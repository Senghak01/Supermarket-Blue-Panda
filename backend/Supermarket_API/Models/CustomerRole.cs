namespace Supermarket.API.Models;

public class CustomerRole
{
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

