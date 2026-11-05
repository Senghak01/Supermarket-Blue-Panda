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
    public EmployeeInfoDTO? Employee { get; set; }
}

public class EmployeeInfoDTO
{
    public int EmployeeId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }
    public decimal? Salary { get; set; }
    public string? EmergencyContact { get; set; }
}

public class UpdateEmployeeInfoRequest
{
    [Required, StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string LastName { get; set; } = string.Empty;

    [StringLength(30)]
    public string? PhoneNumber { get; set; }

    [StringLength(100)]
    public string? Position { get; set; }

    [StringLength(100)]
    public string? Department { get; set; }

    public DateTime? HireDate { get; set; }

    public decimal? Salary { get; set; }

    [StringLength(100)]
    public string? EmergencyContact { get; set; }
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

    // Optional Employee HR profile
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public DateTime? HireDate { get; set; }
    public decimal? Salary { get; set; }
    public string? EmergencyContact { get; set; }
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

public class RoleResponse
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CreateRoleRequest
{
    [Required, StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
}

public class UpdateUserPermissionsRequest
{
    [Required]
    public List<string> Permissions { get; set; } = new();
}

