using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Inventory;
using Supermarket.API.Extensions;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Route("api/inventory")]
public class StockController : ControllerBase
{
    private readonly IStockService _stock;

    public StockController(IStockService stock)
    {
        _stock = stock;
    }

    /// <summary>
    /// View inventory levels (Staff or Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<PagedResult<InventoryItemResponse>>> GetList([FromQuery] InventoryQuery query)
    {
        return Ok(await _stock.GetInventoryListAsync(query));
    }

    /// <summary>
    /// View inventory for a specific product (Staff or Admin)
    /// </summary>
    [HttpGet("{productId:int}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<InventoryItemResponse>> GetByProduct(int productId)
    {
        return Ok(await _stock.GetInventoryByProductAsync(productId));
    }

    /// <summary>
    /// View stock movement history/audit trail (Staff or Admin)
    /// </summary>
    [HttpGet("movements")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<PagedResult<StockMovementResponse>>> GetMovements(
        [FromQuery] int? productId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        return Ok(await _stock.GetStockMovementsAsync(productId, page, pageSize));
    }

    /// <summary>
    /// Adjust inventory quantity (Requires Admin or Staff promoted with 'ManageStock' permission)
    /// </summary>
    [HttpPost("adjust")]
    [Authorize(Policy = "ManageStock")]
    public async Task<ActionResult<InventoryItemResponse>> Adjust([FromBody] AdjustStockRequest request)
    {
        int? employeeId = null;
        try
        {
            employeeId = User.GetCustomerId();
        }
        catch
        {
            // Ignored if anonymous/unparsed
        }

        return Ok(await _stock.AdjustStockAsync(employeeId, request));
    }
}

