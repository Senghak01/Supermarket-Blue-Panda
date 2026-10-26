using Microsoft.Extensions.Logging.Abstractions;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Cart;
using Supermarket.API.DTOs.Order;
using Supermarket.API.DTOs.Payments;
using Supermarket.API.Models;
using Supermarket.API.Options;
using Supermarket.API.Services;
using Supermarket.API.Services.Payments;

namespace Supermarket.API.Tests;

// Stands in for Bakong: says "paid" or "not paid" on demand
public class FakeVerifyingProvider : IPaymentProvider, IPaymentVerifier
{
    public bool IsPaid { get; set; }

    public PaymentMethod Method => PaymentMethod.Khqr;
    public bool RequiresOnlinePayment => true;

    public Task<PaymentInitResult> InitiateAsync(Order order, Payment payment, CancellationToken cancellationToken = default)
        => Task.FromResult(new PaymentInitResult
        {
            TransactionId = $"md5-{payment.PaymentId}",
            QrData = "FAKE-QR"
        });

    public Task<PaymentVerification> VerifyAsync(Payment payment, CancellationToken cancellationToken = default)
        => Task.FromResult(new PaymentVerification { Paid = IsPaid, ProviderReference = IsPaid ? "hash-123" : null });
}

public class PaymentVerificationTests : IDisposable
{
    private readonly TestDb _testDb = new();
    private readonly FakeVerifyingProvider _provider = new();

    public void Dispose() => _testDb.Dispose();

    private PaymentService NewPayments(ApplicationDbContext db) =>
        new(db,
            new IPaymentProvider[] { new CashOnDeliveryProvider(), _provider },
            Seed.Opt(new PaymentOptions()),
            NullLogger<PaymentService>.Instance);

    private async Task<(int customerId, int orderId, int paymentId)> StartQrPayment()
    {
        using var db = _testDb.CreateContext();
        var customer = Seed.AddCustomer(db);
        var address = Seed.AddAddress(db, customer.CustomerId);
        var product = Seed.AddProduct(db, "Rice", 5m, stock: 10);

        await new CartService(db).AddItemAsync(customer.CustomerId,
            new AddCartItemRequest { ProductId = product.ProductId, Quantity = 2 });

        var order = await new OrderService(db, Seed.Opt(new DeliveryOptions()))
            .PlaceOrderAsync(customer.CustomerId, new PlaceOrderRequest { AddressId = address.AddressId });

        var payment = await NewPayments(db)
            .InitiateAsync(customer.CustomerId, order.OrderId, new InitiatePaymentRequest { Method = "Khqr" });

        return (customer.CustomerId, order.OrderId, payment.PaymentId);
    }

    [Fact]
    public async Task Refresh_WhenNotPaidYet_KeepsOrderPending()
    {
        var (customerId, orderId, paymentId) = await StartQrPayment();
        _provider.IsPaid = false;

        using (var db = _testDb.CreateContext())
        {
            var result = await NewPayments(db).RefreshAsync(customerId, paymentId);
            Assert.Equal(PaymentStatus.Pending, result.Status);
        }

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Pending, verify.Orders.Single(o => o.OrderId == orderId).Status);
    }

    [Fact]
    public async Task Refresh_WhenPaid_ConfirmsOrder_AndKeepsTheQrReference()
    {
        var (customerId, orderId, paymentId) = await StartQrPayment();
        _provider.IsPaid = true;

        using (var db = _testDb.CreateContext())
        {
            var result = await NewPayments(db).RefreshAsync(customerId, paymentId);
            Assert.Equal(PaymentStatus.Paid, result.Status);
            Assert.Equal($"md5-{paymentId}", result.TransactionId);
        }

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Confirmed, verify.Orders.Single(o => o.OrderId == orderId).Status);
    }

    [Fact]
    public async Task Refresh_ForSomeoneElsesPayment_ThrowsNotFound()
    {
        var (_, _, paymentId) = await StartQrPayment();

        int otherCustomerId;
        using (var db = _testDb.CreateContext())
            otherCustomerId = Seed.AddCustomer(db, "other@test.com").CustomerId;

        using var db2 = _testDb.CreateContext();
        var ex = await Assert.ThrowsAsync<Supermarket.API.Exceptions.AppException>(() =>
            NewPayments(db2).RefreshAsync(otherCustomerId, paymentId));

        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task BackgroundCheck_ConfirmsPaidPayments_AndCountsThem()
    {
        var (_, orderId, _) = await StartQrPayment();
        _provider.IsPaid = true;

        int count;
        using (var db = _testDb.CreateContext())
            count = await NewPayments(db).VerifyPendingPaymentsAsync(DateTime.UtcNow.AddHours(-1));

        Assert.Equal(1, count);

        using var verify = _testDb.CreateContext();
        Assert.Equal(OrderStatus.Confirmed, verify.Orders.Single(o => o.OrderId == orderId).Status);
    }

    [Fact]
    public async Task BackgroundCheck_IgnoresPaymentsOlderThanTheWindow()
    {
        await StartQrPayment();
        _provider.IsPaid = true;

        using var db = _testDb.CreateContext();
        var count = await NewPayments(db).VerifyPendingPaymentsAsync(DateTime.UtcNow.AddHours(1)); // window starts in the future

        Assert.Equal(0, count);
    }
}
