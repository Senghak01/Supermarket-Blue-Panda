using System.ComponentModel.DataAnnotations;

namespace Supermarket.API.DTOs.Admin;

public class AdminUserListItem
{
    public int CustomerId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}

public class CreateStaffUserRequest
{
    [Required, StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Role to assign: "Staff" (default) or "Admin"
    /// </summary>
    public string Role { get; set; } = "Staff";

    /// <summary>
    /// Optional initial permissions (e.g. "ManageStock")
    /// </summary>
    public List<string>? Permissions { get; set; }
}

public class UpdateUserRolesRequest
{
    [Required]
    public List<string> Roles { get; set; } = new();
}

public class GrantPermissionRequest
{
    [Required]
    public string Permission { get; set; } = string.Empty; // e.g. "ManageStock"
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

