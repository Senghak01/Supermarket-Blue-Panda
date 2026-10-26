using Supermarket.API.Data;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services;

namespace Supermarket.API.Tests;

public class AdminUserServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    private void SeedRoles(ApplicationDbContext db)
    {
        db.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "Staff" },
            new Role { Name = "Customer" }
        );
        db.SaveChanges();
    }

    [Fact]
    public async Task CreateStaffUser_DefaultRoleStaff_Success()
    {
        using var db = _testDb.CreateContext();
        SeedRoles(db);

        var service = new AdminUserService(db);
        var created = await service.CreateStaffUserAsync(new CreateStaffUserRequest
        {
            Username = "john_staff",
            Email = "john@supermarket.com",
            Password = "Password@123",
            Role = "Staff"
        });

        Assert.Equal("john_staff", created.Username);
        Assert.Equal("john@supermarket.com", created.Email);
        Assert.Contains("Staff", created.Roles);
        Assert.Empty(created.Permissions);
    }

    [Fact]
    public async Task GrantPermission_PromotesStaffToStockControl()
    {
        using var db = _testDb.CreateContext();
        SeedRoles(db);

        var service = new AdminUserService(db);
        var staff = await service.CreateStaffUserAsync(new CreateStaffUserRequest
        {
            Username = "stock_worker",
            Email = "stock@supermarket.com",
            Password = "Password@123",
            Role = "Staff"
        });

        // Grant stock management permission
        var updated = await service.GrantPermissionAsync(staff.CustomerId, "ManageStock");

        Assert.Contains("ManageStock", updated.Permissions);
    }

    [Fact]
    public async Task RevokePermission_RemovesPermission()
    {
        using var db = _testDb.CreateContext();
        SeedRoles(db);

        var service = new AdminUserService(db);
        var staff = await service.CreateStaffUserAsync(new CreateStaffUserRequest
        {
            Username = "temp_worker",
            Email = "temp@supermarket.com",
            Password = "Password@123",
            Role = "Staff",
            Permissions = new List<string> { "ManageStock" }
        });

        Assert.Contains("ManageStock", staff.Permissions);

        var revoked = await service.RevokePermissionAsync(staff.CustomerId, "ManageStock");
        Assert.DoesNotContain("ManageStock", revoked.Permissions);
    }
}

