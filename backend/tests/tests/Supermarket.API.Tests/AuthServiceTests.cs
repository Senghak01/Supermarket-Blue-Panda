using Microsoft.Extensions.Configuration;
using Supermarket.API.DTOs.Auth;
using Supermarket.API.Exceptions;
using Supermarket.API.Services;

namespace Supermarket.API.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly TestDb _testDb = new();

    public void Dispose() => _testDb.Dispose();

    private static AuthService NewAuth(Supermarket.API.Data.ApplicationDbContext db)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = new string('k', 40),
                ["Jwt:Issuer"] = "test",
                ["Jwt:Audience"] = "test",
                ["Jwt:ExpiryMinutes"] = "5"
            })
            .Build();

        return new AuthService(db, new TokenService(config));
    }

    [Fact]
    public async Task Register_ThenLogin_Works_AndEmailIsCaseInsensitive()
    {
        using var db = _testDb.CreateContext();
        var auth = NewAuth(db);

        await auth.RegisterAsync(new RegisterRequest { Username = "sok", Email = "Sok@Test.com", Password = "password123" });
        var login = await auth.LoginAsync(new LoginRequest { Email = "sok@test.com", Password = "password123" });

        Assert.False(string.IsNullOrEmpty(login.Token));
        Assert.Equal("sok@test.com", login.Customer.Email);
    }

    [Fact]
    public async Task Register_SameEmailTwice_ThrowsConflict()
    {
        using var db = _testDb.CreateContext();
        var auth = NewAuth(db);
        var request = new RegisterRequest { Username = "sok", Email = "sok@test.com", Password = "password123" };

        await auth.RegisterAsync(request);
        var ex = await Assert.ThrowsAsync<AppException>(() => auth.RegisterAsync(request));

        Assert.Equal(409, ex.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_AndUnknownEmail_GiveTheSameAnswer()
    {
        using var db = _testDb.CreateContext();
        var auth = NewAuth(db);
        await auth.RegisterAsync(new RegisterRequest { Username = "sok", Email = "sok@test.com", Password = "password123" });

        var wrongPassword = await Assert.ThrowsAsync<AppException>(() =>
            auth.LoginAsync(new LoginRequest { Email = "sok@test.com", Password = "nope-nope" }));
        var unknownEmail = await Assert.ThrowsAsync<AppException>(() =>
            auth.LoginAsync(new LoginRequest { Email = "nobody@test.com", Password = "password123" }));

        Assert.Equal(401, wrongPassword.StatusCode);
        Assert.Equal(401, unknownEmail.StatusCode);
        Assert.Equal(wrongPassword.Message, unknownEmail.Message);
    }
}
