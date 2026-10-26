namespace Supermarket.API.Models;

public class CustomerPermission
{
    public int CustomerPermissionId { get; set; }

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public string Permission { get; set; } = string.Empty;
}

