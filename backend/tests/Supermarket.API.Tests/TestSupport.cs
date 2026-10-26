using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Supermarket.API.Data;
using Supermarket.API.Models;

namespace Supermarket.API.Tests;

// A fresh in-memory SQLite database per test class instance. SQLite is not MySQL, so these tests
// cover the business rules (stock, fees, status changes), not MySQL-specific behaviour.
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public TestDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var db = CreateContext();
        db.Database.EnsureCreated();
    }

    // Use a new context to check results, so you read from the database and not from tracked objects
    public ApplicationDbContext CreateContext() => new(_options);

    public void Dispose() => _connection.Dispose();
}

public static class Seed
{
    public static IOptions<T> Opt<T>(T value) where T : class => new OptionsWrapper<T>(value);

    public static Customer AddCustomer(ApplicationDbContext db, string email = "buyer@test.com")
    {
        var customer = new Customer { Username = "buyer", Email = email, PasswordHash = "not-used" };
        db.Customers.Add(customer);
        db.SaveChanges();
        return customer;
    }

    public static CustomerAddress AddAddress(ApplicationDbContext db, int customerId)
    {
        var address = new CustomerAddress
        {
            CustomerId = customerId,
            Label = "Home",
            RecipientName = "Buyer",
            PhoneNumber = "012345678",
            AddressLine = "St 123",
            City = "Phnom Penh",
            IsDefault = true
        };
        db.CustomerAddresses.Add(address);
        db.SaveChanges();
        return address;
    }

    public static Product AddProduct(ApplicationDbContext db, string name, decimal price, int stock, bool active = true)
    {
        var category = db.Categories.FirstOrDefault() ?? db.Categories.Add(new Category { Name = "Test" }).Entity;

        var product = new Product
        {
            Category = category,
            Name = name,
            Sku = $"SKU-{Guid.NewGuid().ToString("N")[..8]}",
            Price = price,
            Unit = "pcs",
            IsActive = active,
            Inventory = new Inventory { Quantity = stock }
        };

        db.Products.Add(product);
        db.SaveChanges();
        return product;
    }
}
