namespace Supermarket.API.Models;

public class Role
{
    public int RoleId { get; set; }

    public string Name { get; set; } = string.Empty;

    public ICollection<CustomerRole> CustomerRoles { get; set; } = new List<CustomerRole>();
}

