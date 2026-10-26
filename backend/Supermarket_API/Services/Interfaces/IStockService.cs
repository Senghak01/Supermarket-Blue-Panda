using Supermarket.API.DTOs.Common;
using Supermarket.API.DTOs.Inventory;

namespace Supermarket.API.Services.Interfaces;

public interface IStockService
{
    Task<PagedResult<InventoryItemResponse>> GetInventoryListAsync(InventoryQuery query);
    Task<InventoryItemResponse> GetInventoryByProductAsync(int productId);
    Task<InventoryItemResponse> AdjustStockAsync(int? employeeId, AdjustStockRequest request);
    Task<PagedResult<StockMovementResponse>> GetStockMovementsAsync(int? productId = null, int page = 1, int pageSize = 20);
}

