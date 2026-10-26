using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Order;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _adminOrders;

    public AdminOrdersController(IAdminOrderService adminOrders)
    {
        _adminOrders = adminOrders;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderSummaryResponse>>> GetAll([FromQuery] AdminOrderQuery query)
    {
        return Ok(await _adminOrders.GetAllOrdersAsync(query));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDetailResponse>> GetById(int id)
    {
        return Ok(await _adminOrders.GetOrderByIdAsync(id));
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<OrderDetailResponse>> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        return Ok(await _adminOrders.UpdateOrderStatusAsync(id, request.Status));
    }
}

