using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Catalog;

namespace Supermarket.API.Services.Interfaces;

public interface IAdminCatalogService
{
    Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request);
    Task<ProductDetailResponse> UpdateProductAsync(int productId, UpdateProductRequest request);
    Task<bool> DeleteProductAsync(int productId);

    Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request);
    Task<CategoryResponse> UpdateCategoryAsync(int categoryId, UpdateCategoryRequest request);
    Task<bool> DeleteCategoryAsync(int categoryId);
}
