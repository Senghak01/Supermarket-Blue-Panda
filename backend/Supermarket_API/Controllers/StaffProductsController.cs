using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Catalog;
using Supermarket.API.DTOs.Common;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize(Policy = "StaffOrAdmin")]
[Route("api/staff/products")]
public class StaffProductsController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public StaffProductsController(ICatalogService catalog)
    {
        _catalog = catalog;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItem>>> Search([FromQuery] ProductQuery query)
    {
        return Ok(await _catalog.SearchProductsAsync(query));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDetailResponse>> GetById(int id)
    {
        return Ok(await _catalog.GetProductAsync(id));
    }
}

