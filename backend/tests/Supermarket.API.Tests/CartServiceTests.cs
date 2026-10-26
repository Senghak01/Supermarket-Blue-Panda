using Supermarket.API.DTOs.Cart;
using Supermarket.API.Exceptions;
using Supermarket.API.Services;

namespace Supermarket.API.Tests;

public class CartServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    [Fact]
    public async Task AddItem_Twice_IncreasesQuantity()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var product = Seed.AddProduct(db, "Milk", 2m, stock: 10);
        var cart = new CartService(db);

        await cart.AddItemAsync(customer.CustomerId, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 2 });
        var result = await cart.AddItemAsync(customer.CustomerId, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 3 });

        var line = Assert.Single(result.Items);
        Assert.Equal(5, line.Quantity);
        Assert.Equal(10m, result.Subtotal);
        Assert.False(result.HasIssues);
    }

    [Fact]
    public async Task AddItem_MoreThanStock_ThrowsConflict()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var product = Seed.AddProduct(db, "Milk", 2m, stock: 3);
        var cart = new CartService(db);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            cart.AddItemAsync(customer.CustomerId, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 4 }));

        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task AddItem_InactiveProduct_ThrowsNotFound()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var product = Seed.AddProduct(db, "Old item", 2m, stock: 10, active: false);
        var cart = new CartService(db);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            cart.AddItemAsync(customer.CustomerId, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 1 }));

        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task OtherCustomerCannotChangeMyCartLine()
    {
        using var db = _testDb.CreateContext();
        var me = Seed.AddCustomer(db, "me@test.com");
        var other = Seed.AddCustomer(db, "other@test.com");
        var product = Seed.AddProduct(db, "Milk", 2m, stock: 10);
        var cart = new CartService(db);

        var mine = await cart.AddItemAsync(me.CustomerId, new AddCartItemRequest { ProductId = product.ProductId, Quantity = 1 });
        var lineId = mine.Items[0].CartItemId;

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            cart.UpdateItemAsync(other.CustomerId, lineId, new UpdateCartItemRequest { Quantity = 5 }));

        Assert.Equal(404, ex.StatusCode);
    }
}
