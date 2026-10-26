using Microsoft.Extensions.Logging.Abstractions;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Cart;
using Supermarket.API.DTOs.Order;
using Supermarket.API.DTOs.Payments;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Options;
using Supermarket.API.Services;
using Supermarket.API.Services.Payments;

namespace Supermarket.API.Tests;

public class PaymentServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    private static PaymentService NewPayments(ApplicationDbContext db) =>
        new(db,
            new IPaymentProvider[]
            {
                new CashOnDeliveryProvider(),
                new SandboxPaymentProvider(PaymentMethod.Khqr)
            },
            Seed.Opt(new PaymentOptions()),
            NullLogger<PaymentService>.Instance);

    private async Task<(int customerId, int orderId)> PlaceOrder()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var address = Seed.AddAddress(db, customer.CustomerId);
        var product = Seed.AddProduct(db, "Rice", 5m, stock: 10);

        await new CartService(db).AddItemAsync(customer.CustomerId,
            new AddCartItemRequest { ProductId = product.ProductId, Quantity = 2 });

        var orders = new OrderService(db, Seed.Opt(new DeliveryOptions()));
        var order = await orders.PlaceOrderAsync(customer.CustomerId, new PlaceOrderRequest { AddressId = address.AddressId });

        return (customer.CustomerId, order.OrderId);
    }

    [Fact]
    public async Task CashOnDelivery_ConfirmsOrder_AndPaymentStaysPending()
    {
        var (customerId, orderId) = await PlaceOrder();

        using (var db = _testDb.CreateContext())
        {
            var payment = await NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "cashondelivery" });
            Assert.Equal(PaymentStatus.Pending, payment.Status);
            Assert.Null(payment.ExpiresAt);
        }

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Confirmed, verify.Orders.Single(o => o.OrderId == orderId).Status);
    }

    [Fact]
    public async Task OnlinePayment_KeepsOrderPending_UntilPaid()
    {
        var (customerId, orderId) = await PlaceOrder();

        PaymentResponse started;
        using (var db = _testDb.CreateContext())
            started = await NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "Khqr" });

        Assert.NotNull(started.QrData);
        Assert.NotNull(started.ExpiresAt);

        using (var verify = _testDb.CreateContext())
            Assert.Equal(OrderStatus.Pending, verify.Orders.Single(o => o.OrderId == orderId).Status);

        using (var db = _testDb.CreateContext())
            await NewPayments(db).MarkPaidAsync(started.PaymentId, "BANK-REF-1");

        using var after = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Confirmed, after.Orders.Single(o => o.OrderId == orderId).Status);
        Assert.Equal(PaymentStatus.Paid, after.Payments.Single(p => p.PaymentId == started.PaymentId).Status);
    }

    [Fact]
    public async Task MarkPaid_CalledTwice_IsHarmless()
    {
        var (customerId, orderId) = await PlaceOrder();

        int paymentId;
        using (var db = _testDb.CreateContext())
            paymentId = (await NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "Khqr" })).PaymentId;

        using (var db = _testDb.CreateContext())
            await NewPayments(db).MarkPaidAsync(paymentId, "REF-A");

        PaymentResponse second;
        using (var db = _testDb.CreateContext())
            second = await NewPayments(db).MarkPaidAsync(paymentId, "REF-B"); // provider retry

        Assert.Equal(PaymentStatus.Paid, second.Status);
        Assert.Equal("REF-A", second.TransactionId); // the first reference is kept
    }

    [Fact]
    public async Task PaymentArrivingForCancelledOrder_IsRecorded_ButOrderStaysCancelled()
    {
        var (customerId, orderId) = await PlaceOrder();

        int paymentId;
        using (var db = _testDb.CreateContext())
            paymentId = (await NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "Khqr" })).PaymentId;

        using (var db = _testDb.CreateContext())
            await new OrderService(db, Seed.Opt(new DeliveryOptions())).CancelAsync(customerId, orderId);

        using (var db = _testDb.CreateContext())
            await NewPayments(db).MarkPaidAsync(paymentId, "LATE-REF");

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Cancelled, verify.Orders.Single(o => o.OrderId == orderId).Status);
        Assert.Equal(PaymentStatus.Paid, verify.Payments.Single(p => p.PaymentId == paymentId).Status); // money arrived: refund needed
    }

    [Fact]
    public async Task PaidOrder_CannotBeCancelledByCustomer()
    {
        var (customerId, orderId) = await PlaceOrder();

        int paymentId;
        using (var db = _testDb.CreateContext())
            paymentId = (await NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "Khqr" })).PaymentId;

        using (var db = _testDb.CreateContext())
            await NewPayments(db).MarkPaidAsync(paymentId, "REF");

        using var db2 = _testDb.CreateContext();
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            new OrderService(db2, Seed.Opt(new DeliveryOptions())).CancelAsync(customerId, orderId));

        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task UnknownMethod_ThrowsBadRequest()
    {
        var (customerId, orderId) = await PlaceOrder();

        using var db = _testDb.CreateContext();
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            NewPayments(db).InitiateAsync(customerId, orderId, new InitiatePaymentRequest { Method = "Bitcoin" }));

        Assert.Equal(400, ex.StatusCode);
    }
}
