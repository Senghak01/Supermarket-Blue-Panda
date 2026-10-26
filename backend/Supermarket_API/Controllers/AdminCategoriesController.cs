using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Catalog;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/categories")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminCatalogService _adminCatalog;

    public AdminCategoriesController(IAdminCatalogService adminCatalog)
    {
        _adminCatalog = adminCatalog;
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = await _adminCatalog.CreateCategoryAsync(request);
        return Created($"/api/categories/{category.CategoryId}", category);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryResponse>> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        return Ok(await _adminCatalog.UpdateCategoryAsync(id, request));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _adminCatalog.DeleteCategoryAsync(id);
        return NoContent();
    }
}
