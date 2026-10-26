using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Catalog;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/products")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminCatalogService _adminCatalog;

    public AdminProductsController(IAdminCatalogService adminCatalog)
    {
        _adminCatalog = adminCatalog;
    }

    [HttpPost]
    public async Task<ActionResult<ProductDetailResponse>> Create([FromBody] CreateProductRequest request)
    {
        var product = await _adminCatalog.CreateProductAsync(request);
        return Created($"/api/products/{product.ProductId}", product);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDetailResponse>> Update(int id, [FromBody] UpdateProductRequest request)
    {
        return Ok(await _adminCatalog.UpdateProductAsync(id, request));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _adminCatalog.DeleteProductAsync(id);
        return NoContent();
    }
}

