using Microsoft.EntityFrameworkCore;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Inventory;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services;

namespace Supermarket.API.Tests;

public class StockServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    [Fact]
    public async Task AdjustStock_AddsQuantity_AndCreatesMovementAudit()
    {
        using var db = _testDb.CreateContext();
        var product = Seed.AddProduct(db, "Cereal", 3.50m, stock: 20);

        var service = new StockService(db);
        var result = await service.AdjustStockAsync(employeeId: 101, new AdjustStockRequest
        {
            ProductId = product.ProductId,
            DeltaQuantity = 15,
            MovementType = StockMovementType.Purchase
        });

        Assert.Equal(35, result.Quantity);

        var movement = await db.StockMovements.FirstOrDefaultAsync(m => m.ProductId == product.ProductId && m.Quantity == 15);
        Assert.NotNull(movement);
        Assert.Equal(101, movement.EmployeeId);
        Assert.Equal(StockMovementType.Purchase, movement.MovementType);
    }

    [Fact]
    public async Task AdjustStock_ReducesQuantity_CannotExceedCurrentStock()
    {
        using var db = _testDb.CreateContext();
        var product = Seed.AddProduct(db, "Juice", 2.00m, stock: 5);

        var service = new StockService(db);

        // Try reducing 10 when stock is 5
        await Assert.ThrowsAsync<AppException>(() => service.AdjustStockAsync(employeeId: 101, new AdjustStockRequest
        {
            ProductId = product.ProductId,
            DeltaQuantity = -10,
            MovementType = StockMovementType.Adjustment
        }));
    }
}

