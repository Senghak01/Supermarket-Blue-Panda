using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Order;
using Supermarket.API.Models;

namespace Supermarket.API.Services.Interfaces;

public interface IAdminOrderService
{
    Task<PagedResult<OrderSummaryResponse>> GetAllOrdersAsync(AdminOrderQuery query);
    Task<OrderDetailResponse> GetOrderByIdAsync(int orderId);
    Task<OrderDetailResponse> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus);
}

