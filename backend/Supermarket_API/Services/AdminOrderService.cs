using Microsoft.EntityFrameworkCore;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Address;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Order;
using Supermarket.API.DTOs.Payments;
using Supermarket.API.DTOs.Profile;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Services;

public class AdminOrderService : IAdminOrderService
{
    private readonly ApplicationDbContext _db;

    public AdminOrderService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<OrderSummaryResponse>> GetAllOrdersAsync(AdminOrderQuery query)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var q = _db.Orders.AsNoTracking().AsQueryable();

        if (query.Status.HasValue)
        {
            q = q.Where(o => o.Status == query.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            if (int.TryParse(term, out var searchOrderId))
            {
                q = q.Where(o => o.OrderId == searchOrderId);
            }
            else
            {
                var matchingCustomerIds = await _db.Customers
                    .Where(c => c.Username.ToLower().Contains(term) || c.Email.ToLower().Contains(term))
                    .Select(c => c.CustomerId)
                    .ToListAsync();

                q = q.Where(o => matchingCustomerIds.Contains(o.CustomerId));
            }
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(o => o.OrderId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderSummaryResponse
            {
                OrderId = o.OrderId,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                ItemCount = o.Items.Sum(i => i.Quantity),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<OrderSummaryResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<OrderDetailResponse> GetOrderByIdAsync(int orderId)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId)
            ?? throw AppException.NotFound("Order not found.");

        var address = await _db.CustomerAddresses
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.AddressId == order.AddressId);

        var payment = await _db.Payments
            .AsNoTracking()
            .Where(p => p.OrderId == orderId && p.Status != PaymentStatus.Cancelled)
            .OrderByDescending(p => p.PaymentId)
            .FirstOrDefaultAsync();

        return ToDetail(order, address, payment);
    }

    public async Task<OrderDetailResponse> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderId == orderId)
            ?? throw AppException.NotFound("Order not found.");

        if (order.Status == newStatus)
            return await GetOrderByIdAsync(orderId);

        var now = DateTime.UtcNow;

        if (newStatus == OrderStatus.Cancelled)
        {
            // If cancelling an order that reserved stock, return stock to shelves
            if (order.Status is OrderStatus.Pending or OrderStatus.Confirmed or OrderStatus.Preparing)
            {
                foreach (var item in order.Items)
                {
                    var inventory = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
                    if (inventory != null)
                    {
                        inventory.Quantity += item.Quantity;
                        inventory.UpdatedAt = now;
                    }

                    _db.StockMovements.Add(new StockMovement
                    {
                        ProductId = item.ProductId,
                        MovementType = StockMovementType.Return,
                        Quantity = item.Quantity,
                        ReferenceId = order.OrderId,
                        CreatedAt = now
                    });
                }

                // Also cancel pending payments
                var pendingPayments = await _db.Payments
                    .Where(p => p.OrderId == orderId && p.Status == PaymentStatus.Pending)
                    .ToListAsync();

                foreach (var p in pendingPayments)
                {
                    p.Status = PaymentStatus.Cancelled;
                }
            }
        }

        order.Status = newStatus;
        order.UpdatedAt = now;

        await _db.SaveChangesAsync();

        return await GetOrderByIdAsync(orderId);
    }

    private static OrderDetailResponse ToDetail(Order order, CustomerAddress? address, Payment? payment) => new()
    {
        OrderId = order.OrderId,
        Status = order.Status,
        Subtotal = order.Subtotal,
        DeliveryFee = order.DeliveryFee,
        Discount = order.Discount,
        TotalAmount = order.TotalAmount,
        CreatedAt = order.CreatedAt,
        UpdatedAt = order.UpdatedAt,
        CanCancel = order.Status is OrderStatus.Pending or OrderStatus.Confirmed
                    && payment?.Status != PaymentStatus.Paid,
        Payment = payment is null ? null : new PaymentSummaryResponse
        {
            PaymentId = payment.PaymentId,
            Method = payment.Method,
            Status = payment.Status,
            Amount = payment.Amount,
            PaidAt = payment.PaidAt
        },
        DeliveryAddress = address is null ? null : AddressResponse.From(address),
        Items = order.Items
            .OrderBy(i => i.OrderItemId)
            .Select(i => new OrderItemResponse
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                Subtotal = i.Subtotal
            })
            .ToList()
    };
}
