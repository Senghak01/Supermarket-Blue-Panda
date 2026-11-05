namespace Supermarket.API.DTOs.Auth;

public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Provided in development / debug mode to allow immediate testing without an active SMTP server
    /// </summary>
    public string? ResetToken { get; set; }

    /// <summary>
    /// Provided in development / debug mode to allow immediate mobile OTP testing without an active SMS/SMTP gateway
    /// </summary>
    public string? ResetCode { get; set; }
}

