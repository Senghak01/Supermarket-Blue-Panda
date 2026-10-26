using Microsoft.EntityFrameworkCore;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Services;

public class AdminUserService : IAdminUserService
{
    private readonly ApplicationDbContext _db;

    public AdminUserService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<AdminUserListItem>> GetUsersAsync(int page = 1, int pageSize = 20, string? role = null, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 20;

        var q = _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            var targetRole = role.Trim();
            q = q.Where(c => c.CustomerRoles.Any(cr => cr.Role.Name == targetRole));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(c => c.Username.ToLower().Contains(term) || c.Email.ToLower().Contains(term));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(c => c.CustomerId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => MapToListItem(c))
            .ToListAsync();

        return new PagedResult<AdminUserListItem>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminUserListItem> GetUserByIdAsync(int customerId)
    {
        var user = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
            ?? throw AppException.NotFound("User not found.");

        return MapToListItem(user);
    }

    public async Task<AdminUserListItem> CreateStaffUserAsync(CreateStaffUserRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Customers.AnyAsync(c => c.Email == email))
            throw AppException.Conflict("A user with this email already exists.");

        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Staff" : request.Role.Trim();
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName)
            ?? throw AppException.BadRequest($"Role '{roleName}' does not exist.");

        var customer = new Customer
        {
            Username = request.Username.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true
        };

        customer.CustomerRoles.Add(new CustomerRole { Role = role, RoleId = role.RoleId });

        if (request.Permissions != null && request.Permissions.Count > 0)
        {
            foreach (var perm in request.Permissions.Distinct())
            {
                if (!string.IsNullOrWhiteSpace(perm))
                {
                    customer.CustomerPermissions.Add(new CustomerPermission { Permission = perm.Trim() });
                }
            }
        }

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return MapToListItem(customer);
    }

    public async Task<AdminUserListItem> UpdateUserRolesAsync(int customerId, UpdateUserRolesRequest request)
    {
        var user = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
            ?? throw AppException.NotFound("User not found.");

        var requestedRoleNames = request.Roles.Select(r => r.Trim()).Distinct().ToList();
        var availableRoles = await _db.Roles.Where(r => requestedRoleNames.Contains(r.Name)).ToListAsync();

        if (availableRoles.Count != requestedRoleNames.Count)
        {
            var found = availableRoles.Select(r => r.Name);
            var missing = requestedRoleNames.Except(found);
            throw AppException.BadRequest($"Invalid role(s): {string.Join(", ", missing)}");
        }

        user.CustomerRoles.Clear();
        foreach (var r in availableRoles)
        {
            user.CustomerRoles.Add(new CustomerRole { CustomerId = user.CustomerId, RoleId = r.RoleId, Role = r });
        }

        await _db.SaveChangesAsync();
        return MapToListItem(user);
    }

    public async Task<AdminUserListItem> GrantPermissionAsync(int customerId, string permission)
    {
        if (string.IsNullOrWhiteSpace(permission))
            throw AppException.BadRequest("Permission name cannot be empty.");

        var user = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
            ?? throw AppException.NotFound("User not found.");

        var trimmedPerm = permission.Trim();
        if (!user.CustomerPermissions.Any(p => p.Permission.Equals(trimmedPerm, StringComparison.OrdinalIgnoreCase)))
        {
            user.CustomerPermissions.Add(new CustomerPermission { CustomerId = user.CustomerId, Permission = trimmedPerm });
            await _db.SaveChangesAsync();
        }

        return MapToListItem(user);
    }

    public async Task<AdminUserListItem> RevokePermissionAsync(int customerId, string permission)
    {
        if (string.IsNullOrWhiteSpace(permission))
            throw AppException.BadRequest("Permission name cannot be empty.");

        var user = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
            ?? throw AppException.NotFound("User not found.");

        var trimmedPerm = permission.Trim();
        var existing = user.CustomerPermissions
            .FirstOrDefault(p => p.Permission.Equals(trimmedPerm, StringComparison.OrdinalIgnoreCase));

        if (existing != null)
        {
            user.CustomerPermissions.Remove(existing);
            await _db.SaveChangesAsync();
        }

        return MapToListItem(user);
    }

    public async Task<AdminUserListItem> SetUserStatusAsync(int customerId, bool isActive)
    {
        var user = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId)
            ?? throw AppException.NotFound("User not found.");

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToListItem(user);
    }

    private static AdminUserListItem MapToListItem(Customer c) => new()
    {
        CustomerId = c.CustomerId,
        Username = c.Username,
        Email = c.Email,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt,
        Roles = c.CustomerRoles.Select(cr => cr.Role?.Name ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)).ToList(),
        Permissions = c.CustomerPermissions.Select(cp => cp.Permission).ToList()
    };
}
