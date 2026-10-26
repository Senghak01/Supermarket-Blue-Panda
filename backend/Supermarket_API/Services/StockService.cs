using Microsoft.EntityFrameworkCore;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Inventory;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Services;

public class StockService : IStockService
{
    private readonly ApplicationDbContext _db;

    public StockService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<InventoryItemResponse>> GetInventoryListAsync(InventoryQuery query)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var q = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Inventory)
            .AsNoTracking()
            .AsQueryable();

        if (query.CategoryId.HasValue)
        {
            q = q.Where(p => p.CategoryId == query.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(term) || p.Sku.ToLower().Contains(term));
        }

        if (query.LowStockOnly == true)
        {
            q = q.Where(p => (p.Inventory != null ? p.Inventory.Quantity : 0) <= query.LowStockThreshold);
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new InventoryItemResponse
            {
                ProductId = p.ProductId,
                ProductName = p.Name,
                Sku = p.Sku,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                Price = p.Price,
                Unit = p.Unit,
                Quantity = p.Inventory != null ? p.Inventory.Quantity : 0,
                IsActive = p.IsActive,
                UpdatedAt = p.Inventory != null ? p.Inventory.UpdatedAt : p.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<InventoryItemResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<InventoryItemResponse> GetInventoryByProductAsync(int productId)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Inventory)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == productId)
            ?? throw AppException.NotFound("Product not found.");

        return new InventoryItemResponse
        {
            ProductId = product.ProductId,
            ProductName = product.Name,
            Sku = product.Sku,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            Price = product.Price,
            Unit = product.Unit,
            Quantity = product.Inventory?.Quantity ?? 0,
            IsActive = product.IsActive,
            UpdatedAt = product.Inventory?.UpdatedAt ?? product.CreatedAt
        };
    }

    public async Task<InventoryItemResponse> AdjustStockAsync(int? employeeId, AdjustStockRequest request)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.ProductId == request.ProductId)
            ?? throw AppException.NotFound("Product not found.");

        var now = DateTime.UtcNow;

        if (product.Inventory == null)
        {
            product.Inventory = new Inventory
            {
                ProductId = product.ProductId,
                Quantity = 0,
                UpdatedAt = now
            };
            _db.Inventories.Add(product.Inventory);
        }

        var newQuantity = product.Inventory.Quantity + request.DeltaQuantity;
        if (newQuantity < 0)
        {
            throw AppException.BadRequest($"Cannot reduce stock by {-request.DeltaQuantity}. Current stock is only {product.Inventory.Quantity}.");
        }

        product.Inventory.Quantity = newQuantity;
        product.Inventory.UpdatedAt = now;

        var movement = new StockMovement
        {
            ProductId = product.ProductId,
            EmployeeId = employeeId,
            MovementType = request.MovementType,
            Quantity = request.DeltaQuantity,
            CreatedAt = now
        };

        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();

        return new InventoryItemResponse
        {
            ProductId = product.ProductId,
            ProductName = product.Name,
            Sku = product.Sku,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            Price = product.Price,
            Unit = product.Unit,
            Quantity = product.Inventory.Quantity,
            IsActive = product.IsActive,
            UpdatedAt = product.Inventory.UpdatedAt
        };
    }

    public async Task<PagedResult<StockMovementResponse>> GetStockMovementsAsync(int? productId = null, int page = 1, int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _db.StockMovements.AsNoTracking().AsQueryable();

        if (productId.HasValue)
        {
            q = q.Where(m => m.ProductId == productId.Value);
        }

        var total = await q.CountAsync();
        var items = await (
            from m in q
            join p in _db.Products on m.ProductId equals p.ProductId into pj
            from p in pj.DefaultIfEmpty()
            orderby m.StockMovementId descending
            select new StockMovementResponse
            {
                StockMovementId = m.StockMovementId,
                ProductId = m.ProductId,
                ProductName = p != null ? p.Name : string.Empty,
                EmployeeId = m.EmployeeId,
                MovementType = m.MovementType,
                Quantity = m.Quantity,
                ReferenceId = m.ReferenceId,
                CreatedAt = m.CreatedAt
            })
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<StockMovementResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }
}

