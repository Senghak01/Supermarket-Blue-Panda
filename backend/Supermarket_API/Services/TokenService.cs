using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Supermarket.API.Models;
using Supermarket.API.Services.Interfaces;

namespace Supermarket.API.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config) => _config = config;

    public (string Token, DateTime ExpiresAt) CreateToken(Customer customer)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var minutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var m) ? m : 60;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, customer.CustomerId.ToString()),
            new(ClaimTypes.Email, customer.Email),
            new(ClaimTypes.Name, customer.Username)
        };

        if (customer.CustomerRoles != null && customer.CustomerRoles.Count > 0)
        {
            foreach (var cr in customer.CustomerRoles)
            {
                if (cr.Role != null && !string.IsNullOrWhiteSpace(cr.Role.Name))
                    claims.Add(new Claim(ClaimTypes.Role, cr.Role.Name));
            }
        }
        else
        {
            claims.Add(new Claim(ClaimTypes.Role, "Customer"));
        }

        if (customer.CustomerPermissions != null && customer.CustomerPermissions.Count > 0)
        {
            foreach (var cp in customer.CustomerPermissions)
            {
                if (!string.IsNullOrWhiteSpace(cp.Permission))
                    claims.Add(new Claim("permission", cp.Permission));
            }
        }

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var jwt = new JwtSecurityToken(issuer, audience, claims, expires: expires, signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
    }
}
