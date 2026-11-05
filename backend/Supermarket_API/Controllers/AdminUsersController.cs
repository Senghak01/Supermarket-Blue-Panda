using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Supermarket.API.DTOs.Admin;
using Supermarket.API.DTOs.Common;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUsers;

    public AdminUsersController(IAdminUserService adminUsers)
    {
        _adminUsers = adminUsers;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminUserListItem>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? role = null,
        [FromQuery] string? search = null)
    {
        return Ok(await _adminUsers.GetUsersAsync(page, pageSize, role, search));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminUserListItem>> GetById(int id)
    {
        return Ok(await _adminUsers.GetUserByIdAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserListItem>> CreateStaffUser([FromBody] CreateStaffUserRequest request)
    {
        var created = await _adminUsers.CreateStaffUserAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.CustomerId }, created);
    }

    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleResponse>>> GetRoles()
    {
        return Ok(await _adminUsers.GetRolesAsync());
    }

    [HttpPost("roles")]
    public async Task<ActionResult<RoleResponse>> CreateRole([FromBody] CreateRoleRequest request)
    {
        var role = await _adminUsers.CreateRoleAsync(request);
        return Ok(role);
    }

    [HttpPut("{id:int}/roles")]
    public async Task<ActionResult<AdminUserListItem>> UpdateRoles(int id, [FromBody] UpdateUserRolesRequest request)
    {
        return Ok(await _adminUsers.UpdateUserRolesAsync(id, request));
    }

    [HttpPut("{id:int}/permissions")]
    public async Task<ActionResult<AdminUserListItem>> UpdatePermissions(int id, [FromBody] UpdateUserPermissionsRequest request)
    {
        return Ok(await _adminUsers.UpdateUserPermissionsAsync(id, request));
    }

    [HttpPost("{id:int}/permissions")]
    public async Task<ActionResult<AdminUserListItem>> GrantPermission(int id, [FromBody] GrantPermissionRequest request)
    {
        return Ok(await _adminUsers.GrantPermissionAsync(id, request.Permission));
    }

    [HttpDelete("{id:int}/permissions/{permission}")]
    public async Task<ActionResult<AdminUserListItem>> RevokePermission(int id, string permission)
    {
        return Ok(await _adminUsers.RevokePermissionAsync(id, permission));
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<AdminUserListItem>> SetStatus(int id, [FromBody] UpdateUserStatusRequest request)
    {
        return Ok(await _adminUsers.SetUserStatusAsync(id, request.IsActive));
    }

    [HttpPut("{id:int}/employee")]
    public async Task<ActionResult<AdminUserListItem>> UpdateEmployeeInfo(int id, [FromBody] UpdateEmployeeInfoRequest request)
    {
        return Ok(await _adminUsers.UpdateEmployeeInfoAsync(id, request));
    }
}

