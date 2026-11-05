using System.ComponentModel.DataAnnotations;

namespace Supermarket.API.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Can be the 6-digit OTP code (mobile app) or the reset token string (web link)
    /// </summary>
    [Required]
    public string TokenOrCode { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

