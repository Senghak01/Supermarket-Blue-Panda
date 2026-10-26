using Microsoft.EntityFrameworkCore;
using Supermarket.API.DTOs.Cart;
using Supermarket.API.DTOs.Order;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Options;
using Supermarket.API.Services;

namespace Supermarket.API.Tests;

public class OrderServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    private static OrderService NewOrders(Supermarket.API.Data.ApplicationDbContext db) =>
        new(db, Seed.Opt(new DeliveryOptions { FlatFee = 1.5m, FreeDeliveryThreshold = 20m }));

    private async Task<(int customerId, int addressId, int productId)> Arrange(int stock, decimal price, int quantity)
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var address = Seed.AddAddress(db, customer.CustomerId);
        var product = Seed.AddProduct(db, "Rice", price, stock);

        await new CartService(db).AddItemAsync(customer.CustomerId,
            new AddCartItemRequest { ProductId = product.ProductId, Quantity = quantity });

        return (customer.CustomerId, address.AddressId, product.ProductId);
    }

    [Fact]
    public async Task Checkout_CreatesOrder_TakesStock_ClearsCart_AndLogsSale()
    {
        var (customerId, addressId, productId) = await Arrange(stock: 10, price: 5m, quantity: 2);

        OrderDetailResponse order;
        using (var db = _testDb.CreateContext())
            order = await NewOrders(db).PlaceOrderAsync(customerId, new PlaceOrderRequest { AddressId = addressId });

        Assert.Equal(10m, order.Subtotal);
        Assert.Equal(1.5m, order.DeliveryFee);   // below the free-delivery threshold
        Assert.Equal(11.5m, order.TotalAmount);
        Assert.Equal(OrderStatus.Pending, order.Status);

        using var verify = _testDb.CreateContext();
        Assert.Equal(8, verify.Inventories.Single(i => i.ProductId == productId).Quantity);
        Assert.Empty(verify.CartItems);

        var movement = Assert.Single(verify.StockMovements);
        Assert.Equal(StockMovementType.Sale, movement.MovementType);
        Assert.Equal(-2, movement.Quantity);
        Assert.Equal(order.OrderId, movement.ReferenceId);
    }

    [Fact]
    public async Task Checkout_AtThreshold_HasFreeDelivery()
    {
        var (customerId, addressId, _) = await Arrange(stock: 10, price: 10m, quantity: 2); // subtotal 20

        using var db = _testDb.CreateContext();
        var order = await NewOrders(db).PlaceOrderAsync(customerId, new PlaceOrderRequest { AddressId = addressId });

        Assert.Equal(0m, order.DeliveryFee);
        Assert.Equal(20m, order.TotalAmount);
    }

    [Fact]
    public async Task Checkout_EmptyCart_ThrowsBadRequest()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var address = Seed.AddAddress(db, customer.CustomerId);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            NewOrders(db).PlaceOrderAsync(customer.CustomerId, new PlaceOrderRequest { AddressId = address.AddressId }));

        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task Checkout_WhenStockDroppedSinceAddingToCart_ThrowsConflict_AndChangesNothing()
    {
        var (customerId, addressId, productId) = await Arrange(stock: 5, price: 5m, quantity: 5);

        using (var db = _testDb.CreateContext())
            await db.Inventories.Where(i => i.ProductId == productId)
                .ExecuteUpdateAsync(s => s.SetProperty(i => i.Quantity, 3)); // someone else bought some

        using (var db = _testDb.CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppException>(() =>
                NewOrders(db).PlaceOrderAsync(customerId, new PlaceOrderRequest { AddressId = addressId }));

            Assert.Equal(409, ex.StatusCode);
        }

        using var verify = _testDb.CreateContext();
        Assert.Equal(3, verify.Inventories.Single(i => i.ProductId == productId).Quantity);
        Assert.Empty(verify.Orders);
        Assert.Single(verify.CartItems); // the cart is kept so the customer can fix it
    }

    [Fact]
    public async Task Checkout_WithSomeoneElsesAddress_ThrowsBadRequest()
    {
        var (customerId, _, _) = await Arrange(stock: 5, price: 5m, quantity: 1);

        int otherAddressId;
        using (var db = _testDb.CreateContext())
        {
            var other = Seed.AddCustomer(db, "other@test.com");
            otherAddressId = Seed.AddAddress(db, other.CustomerId).AddressId;
        }

        using var db2 = _testDb.CreateContext();
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            NewOrders(db2).PlaceOrderAsync(customerId, new PlaceOrderRequest { AddressId = otherAddressId }));

        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task Cancel_RestoresStockOnce_AndSecondCancelFails()
    {
        var (customerId, addressId, productId) = await Arrange(stock: 10, price: 5m, quantity: 4);

        int orderId;
        using (var db = _testDb.CreateContext())
            orderId = (await NewOrders(db).PlaceOrderAsync(customerId, new PlaceOrderRequest { AddressId = addressId })).OrderId;

        using (var db = _testDb.CreateContext())
        {
            var cancelled = await NewOrders(db).CancelAsync(customerId, orderId);
            Assert.Equal(OrderStatus.Cancelled, cancelled.Status);
        }

        using (var db = _testDb.CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppException>(() => NewOrders(db).CancelAsync(customerId, orderId));
            Assert.Equal(409, ex.StatusCode);
        }

        using var verify = _testDb.CreateContext();
        Assert.Equal(10, verify.Inventories.Single(i => i.ProductId == productId).Quantity);
        Assert.Equal(1, verify.StockMovements.Count(m => m.MovementType == StockMovementType.Return));
    }

    [Fact]
    public async Task ExpireUnpaidOrders_CancelsOldPending_ButNeverAConfirmedOrder()
    {
        // two customers, each with one order
        var (customerA, addressA, _) = await Arrange(stock: 10, price: 5m, quantity: 1);

        int customerB, addressB;
        using (var db = _testDb.CreateContext())
        {
            var b = Seed.AddCustomer(db, "second@test.com");
            customerB = b.CustomerId;
            addressB = Seed.AddAddress(db, b.CustomerId).AddressId;
            var product = db.Products.First();
            await new CartService(db).AddItemAsync(customerB, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 1 });
        }

        int orderA, orderB;
        using (var db = _testDb.CreateContext())
        {
            orderA = (await NewOrders(db).PlaceOrderAsync(customerA, new PlaceOrderRequest { AddressId = addressA })).OrderId;
            orderB = (await NewOrders(db).PlaceOrderAsync(customerB, new PlaceOrderRequest { AddressId = addressB })).OrderId;
        }

        // both orders are 2 hours old, but order B has been paid (Confirmed)
        using (var db = _testDb.CreateContext())
        {
            var old = DateTime.UtcNow.AddHours(-2);
            await db.Orders.ExecuteUpdateAsync(s => s.SetProperty(o => o.CreatedAt, old));
            await db.Orders.Where(o => o.OrderId == orderB)
                .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, OrderStatus.Confirmed));
        }

        int expired;
        using (var db = _testDb.CreateContext())
            expired = await NewOrders(db).ExpireUnpaidOrdersAsync(DateTime.UtcNow.AddMinutes(-30));

        Assert.Equal(1, expired);

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Cancelled, verify.Orders.Single(o => o.OrderId == orderA).Status);
        Assert.Equal(OrderStatus.Confirmed, verify.Orders.Single(o => o.OrderId == orderB).Status);
    }
}
