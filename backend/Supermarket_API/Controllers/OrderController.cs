using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Order;
using Supermarket.API.Extensions;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrderController(IOrderService orders) => _orders = orders;

    // Checkout: turns the cart into an order
    [HttpPost]
    public async Task<ActionResult<OrderDetailResponse>> Checkout(PlaceOrderRequest request)
    {
        var order = await _orders.PlaceOrderAsync(User.GetCustomerId(), request);
        return CreatedAtAction(nameof(GetById), new { id = order.OrderId }, order);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderSummaryResponse>>> GetAll(int page = 1, int pageSize = 20)
        => Ok(await _orders.GetAllAsync(User.GetCustomerId(), page, pageSize));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDetailResponse>> GetById(int id)
        => Ok(await _orders.GetByIdAsync(User.GetCustomerId(), id));

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<OrderDetailResponse>> Cancel(int id)
        => Ok(await _orders.CancelAsync(User.GetCustomerId(), id));
}
