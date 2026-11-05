using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Supermarket.API.DTOs.Auth;
using Supermarket.API.DTOs.Profile;
using Supermarket.API.Extensions;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        => Ok(await _auth.RegisterAsync(request));

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        => Ok(await _auth.LoginAsync(request));

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CustomerResponse>> Me()
        => Ok(await _auth.GetMeAsync(User.GetCustomerId()));

    [EnableRateLimiting("auth")]
    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        => Ok(await _auth.ForgotPasswordAsync(request));

    [EnableRateLimiting("auth")]
    [HttpPost("verify-reset-code")]
    public async Task<ActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequest request)
    {
        await _auth.VerifyResetCodeAsync(request);
        return Ok(new { message = "Verification code is valid." });
    }

    [EnableRateLimiting("auth")]
    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await _auth.ResetPasswordAsync(request);
        return Ok(new { message = "Password has been successfully reset. You can now log in with your new password." });
    }

    // POST /api/auth/google and /facebook: added later
}
