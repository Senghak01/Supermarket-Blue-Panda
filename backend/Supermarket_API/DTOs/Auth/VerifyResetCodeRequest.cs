using System.ComponentModel.DataAnnotations;

namespace Supermarket.API.DTOs.Auth;

public class VerifyResetCodeRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(10, MinimumLength = 4)]
    public string Code { get; set; } = string.Empty;
}

