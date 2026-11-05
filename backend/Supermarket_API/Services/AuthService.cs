using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Supermarket.API.Data;
using Supermarket.API.DTOs.Auth;
using Supermarket.API.DTOs.Profile;
using Supermarket.API.Exceptions;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;
using BCrypt.Net;

namespace Supermarket.API.Services;

public class AuthService : IAuthService
{
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("not-a-real-password");

    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IHostEnvironment? _env;

    public AuthService(ApplicationDbContext db, ITokenService tokens, IHostEnvironment? env = null)
    {
        _db = db;
        _tokens = tokens;
        _env = env;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Customers.AnyAsync(c => c.Email == email))
            throw AppException.Conflict("Email is already registered.");

        var customer = new Customer
        {
            Username = request.Username.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        var customerRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
        if (customerRole != null)
        {
            customer.CustomerRoles.Add(new CustomerRole { Role = customerRole, RoleId = customerRole.RoleId });
        }

        _db.Customers.Add(customer);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two registrations with the same email at the same moment (unique index on Email)
            throw AppException.Conflict("Email is already registered.");
        }

        return BuildResponse(customer);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var customer = await _db.Customers
            .Include(c => c.CustomerRoles)
                .ThenInclude(cr => cr.Role)
            .Include(c => c.CustomerPermissions)
            .FirstOrDefaultAsync(c => c.Email == email);

        // Always run one password check, even for an unknown email, so the response time
        // does not reveal which emails are registered
        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, customer?.PasswordHash ?? DummyHash);

        // Same message for unknown email / wrong password / social-only account
        if (customer is null || customer.PasswordHash is null || !passwordOk)
            throw AppException.Unauthorized("Invalid email or password.");

        if (!customer.IsActive)
            throw AppException.Forbidden("This account is deactivated.");

        return BuildResponse(customer);
    }

    public async Task<CustomerResponse> GetMeAsync(int customerId)
    {
        var customer = await _db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CustomerId == customerId && c.IsActive)
            ?? throw AppException.Unauthorized("Account not found.");

        return ToResponse(customer);
    }

    private AuthResponse BuildResponse(Customer customer)
    {
        var (token, expiresAt) = _tokens.CreateToken(customer);
        return new AuthResponse { Token = token, ExpiresAt = expiresAt, Customer = ToResponse(customer) };
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email && c.IsActive);

        // If user not found, in development be explicit so developers/testers know immediately
        if (customer == null)
        {
            if (_env?.IsDevelopment() == true)
            {
                throw AppException.NotFound($"Email '{email}' is not registered as a customer. Please check the spelling or sign up first.");
            }

            return new ForgotPasswordResponse
            {
                Message = "If this email is registered, password reset instructions have been sent."
            };
        }

        // Invalidate previous active tokens for this email
        var previousTokens = await _db.PasswordResetTokens
            .Where(t => t.Email == email && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var prev in previousTokens)
        {
            prev.IsUsed = true;
        }

        var token = Guid.NewGuid().ToString("N");
        var code = Random.Shared.Next(100000, 999999).ToString();

        var resetToken = new PasswordResetToken
        {
            Email = email,
            Token = token,
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.PasswordResetTokens.Add(resetToken);
        await _db.SaveChangesAsync();

        var response = new ForgotPasswordResponse
        {
            Message = "If this email is registered, password reset instructions have been sent."
        };

        // In development, expose the code/token to allow easy local testing
        if (_env?.IsDevelopment() == true)
        {
            response.ResetToken = token;
            response.ResetCode = code;
        }

        return response;
    }

    public async Task<bool> VerifyResetCodeAsync(VerifyResetCodeRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var code = request.Code.Trim();

        var tokenRecord = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Email == email && t.Code == code && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (tokenRecord == null)
            throw AppException.BadRequest("Invalid or expired verification code.");

        return true;
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var tokenOrCode = request.TokenOrCode.Trim();

        var tokenRecord = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Email == email && (t.Token == tokenOrCode || t.Code == tokenOrCode) && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (tokenRecord == null)
            throw AppException.BadRequest("Invalid or expired password reset token or code.");

        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == email);
        if (customer == null)
            throw AppException.NotFound("User account not found.");

        customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        customer.UpdatedAt = DateTime.UtcNow;
        tokenRecord.IsUsed = true;

        await _db.SaveChangesAsync();
    }

    private static CustomerResponse ToResponse(Customer c) => new()
    {
        CustomerId = c.CustomerId,
        Username = c.Username,
        Email = c.Email
    };
}
