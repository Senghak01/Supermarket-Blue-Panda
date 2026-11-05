using Supermarket.API.DTOs.Auth;
using Supermarket.API.DTOs.Profile;

namespace Supermarket.API.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<CustomerResponse> GetMeAsync(int customerId);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> VerifyResetCodeAsync(VerifyResetCodeRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
}
