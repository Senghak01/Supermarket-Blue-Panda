using Microsoft.EntityFrameworkCore;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Catalog;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Services;

public class AdminCatalogService : IAdminCatalogService
{
    private readonly ApplicationDbContext _db;

    public AdminCatalogService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ProductDetailResponse> CreateProductAsync(CreateProductRequest request)
    {
        var category = await _db.Categories.FindAsync(request.CategoryId)
            ?? throw AppException.NotFound("Category not found.");

        var sku = request.Sku.Trim();
        if (await _db.Products.AnyAsync(p => p.Sku == sku))
            throw AppException.Conflict($"A product with SKU '{sku}' already exists.");

        var product = new Product
        {
            CategoryId = category.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Sku = sku,
            Price = request.Price,
            Unit = request.Unit.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Inventory = new Inventory
            {
                Quantity = request.InitialStock,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        if (request.InitialStock > 0)
        {
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = product.ProductId,
                MovementType = StockMovementType.Purchase,
                Quantity = request.InitialStock,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        return MapToDetail(product, category.Name);
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(int productId, UpdateProductRequest request)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.ProductId == productId)
            ?? throw AppException.NotFound("Product not found.");

        if (product.CategoryId != request.CategoryId)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.CategoryId == request.CategoryId);
            if (!categoryExists) throw AppException.NotFound("Category not found.");
            product.CategoryId = request.CategoryId;
        }

        var sku = request.Sku.Trim();
        if (product.Sku != sku && await _db.Products.AnyAsync(p => p.Sku == sku && p.ProductId != productId))
            throw AppException.Conflict($"A product with SKU '{sku}' already exists.");

        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.Sku = sku;
        product.Price = request.Price;
        product.Unit = request.Unit.Trim();
        product.ImageUrl = request.ImageUrl?.Trim();
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var categoryName = await _db.Categories
            .Where(c => c.CategoryId == product.CategoryId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync() ?? string.Empty;

        return MapToDetail(product, categoryName);
    }

    public async Task<bool> DeleteProductAsync(int productId)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == productId)
            ?? throw AppException.NotFound("Product not found.");

        // Check if there are order items referencing this product
        var hasOrders = await _db.OrderItems.AnyAsync(oi => oi.ProductId == productId);
        if (hasOrders)
        {
            // Soft delete: deactivate so history is preserved
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.Products.Remove(product);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request)
    {
        var name = request.Name.Trim();
        if (await _db.Categories.AnyAsync(c => c.Name == name))
            throw AppException.Conflict($"A category with name '{name}' already exists.");

        var category = new Category
        {
            Name = name,
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            ProductCount = 0
        };
    }

    public async Task<CategoryResponse> UpdateCategoryAsync(int categoryId, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(categoryId)
            ?? throw AppException.NotFound("Category not found.");

        var name = request.Name.Trim();
        if (category.Name != name && await _db.Categories.AnyAsync(c => c.Name == name && c.CategoryId != categoryId))
            throw AppException.Conflict($"A category with name '{name}' already exists.");

        category.Name = name;
        category.Description = request.Description?.Trim();
        category.ImageUrl = request.ImageUrl?.Trim();
        category.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        var count = await _db.Products.CountAsync(p => p.CategoryId == categoryId && p.IsActive);

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            ProductCount = count
        };
    }

    public async Task<bool> DeleteCategoryAsync(int categoryId)
    {
        var category = await _db.Categories.FindAsync(categoryId)
            ?? throw AppException.NotFound("Category not found.");

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == categoryId);
        if (hasProducts)
            throw AppException.Conflict("Cannot delete category because it contains products. Deactivate it or reassign products first.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductDetailResponse MapToDetail(Product p, string categoryName)
    {
        var qty = p.Inventory?.Quantity ?? 0;
        return new ProductDetailResponse
        {
            ProductId = p.ProductId,
            CategoryId = p.CategoryId,
            CategoryName = categoryName,
            Name = p.Name,
            Description = p.Description,
            Sku = p.Sku,
            Price = p.Price,
            Unit = p.Unit,
            ImageUrl = p.ImageUrl,
            InStock = qty > 0,
            StockQuantity = qty
        };
    }
}
