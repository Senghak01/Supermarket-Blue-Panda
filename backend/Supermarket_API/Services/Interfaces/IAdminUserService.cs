using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;

namespace Supermarket.API.Services.Interfaces;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserListItem>> GetUsersAsync(int page = 1, int pageSize = 20, string? role = null, string? search = null);
    Task<AdminUserListItem> GetUserByIdAsync(int customerId);
    Task<AdminUserListItem> CreateStaffUserAsync(CreateStaffUserRequest request);
    Task<AdminUserListItem> UpdateUserRolesAsync(int customerId, UpdateUserRolesRequest request);
    Task<AdminUserListItem> GrantPermissionAsync(int customerId, string permission);
    Task<AdminUserListItem> RevokePermissionAsync(int customerId, string permission);
    Task<AdminUserListItem> SetUserStatusAsync(int customerId, bool isActive);
}

