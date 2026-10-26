using System.ComponentModel.DataAnnotations;
using Supermarket.API.Models;

namespace Supermarket.API.DTOs.Inventory;

public class InventoryItemResponse
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class InventoryQuery
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public bool? LowStockOnly { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdjustStockRequest
{
    [Required]
    public int ProductId { get; set; }

    /// <summary>
    /// Quantity change. Positive to add stock (e.g. +10), negative to reduce stock (e.g. -5).
    /// </summary>
    [Required]
    public int DeltaQuantity { get; set; }

    /// <summary>
    /// Reason or movement type: Purchase, Sale, Return, Adjustment
    /// </summary>
    public StockMovementType MovementType { get; set; } = StockMovementType.Adjustment;

    public string? Note { get; set; }
}

public class StockMovementResponse
{
    public int StockMovementId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public int? ReferenceId { get; set; }
    public DateTime CreatedAt { get; set; }
}

