using System.ComponentModel.DataAnnotations;
using Supermarket.API.Models;

namespace Supermarket.API.DTOs.Admin;

public class AdminOrderQuery
{
    public OrderStatus? Status { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class UpdateOrderStatusRequest
{
    [Required]
    public OrderStatus Status { get; set; }
}

