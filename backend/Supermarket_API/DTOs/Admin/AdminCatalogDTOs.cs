using System.ComponentModel.DataAnnotations;

namespace Supermarket.API.DTOs.Admin;

public class CreateProductRequest
{
    [Required]
    public int CategoryId { get; set; }

    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required, StringLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Range(0.01, 1000000)]
    public decimal Price { get; set; }

    [Required, StringLength(20)]
    public string Unit { get; set; } = "pcs";

    public string? ImageUrl { get; set; }

    [Range(0, 1000000)]
    public int InitialStock { get; set; } = 0;
}

public class UpdateProductRequest
{
    [Required]
    public int CategoryId { get; set; }

    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required, StringLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Range(0.01, 1000000)]
    public decimal Price { get; set; }

    [Required, StringLength(20)]
    public string Unit { get; set; } = "pcs";

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
}

public class CreateCategoryRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }
}

public class UpdateCategoryRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
}

