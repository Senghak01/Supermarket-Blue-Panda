using Microsoft.EntityFrameworkCore;
using Supermarket.API.Models;

namespace Supermarket.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<CustomerRole> CustomerRoles => Set<CustomerRole>();
    public DbSet<CustomerPermission> CustomerPermissions => Set<CustomerPermission>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Customer>(e =>
        {
            e.HasKey(x => x.CustomerId);
            e.Property(x => x.Username).IsRequired().HasMaxLength(50);
            e.Property(x => x.Email).IsRequired().HasMaxLength(255);
            e.Property(x => x.PasswordHash).HasMaxLength(255);
            e.Property(x => x.Provider).HasMaxLength(20);
            e.Property(x => x.ProviderId).HasMaxLength(255);

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => new { x.Provider, x.ProviderId }).IsUnique();
        });

        b.Entity<CustomerAddress>(e =>
        {
            e.HasKey(x => x.AddressId);
            e.Property(x => x.Label).IsRequired().HasMaxLength(30);
            e.Property(x => x.RecipientName).IsRequired().HasMaxLength(100);
            e.Property(x => x.PhoneNumber).IsRequired().HasMaxLength(20);
            e.Property(x => x.AddressLine).IsRequired().HasMaxLength(255);
            e.Property(x => x.District).HasMaxLength(100);
            e.Property(x => x.City).IsRequired().HasMaxLength(100);
            e.Property(x => x.Note).HasMaxLength(255);

            e.HasOne(x => x.Customer)
             .WithMany(c => c.Addresses)
             .HasForeignKey(x => x.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.CustomerId);

            // Soft delete: deleted addresses are hidden from every normal query
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        b.Entity<Role>(e =>
        {
            e.HasKey(x => x.RoleId);
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<CustomerRole>(e =>
        {
            e.HasKey(x => new { x.CustomerId, x.RoleId });
            e.HasOne(x => x.Customer)
             .WithMany(c => c.CustomerRoles)
             .HasForeignKey(x => x.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Role)
             .WithMany(r => r.CustomerRoles)
             .HasForeignKey(x => x.RoleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CustomerPermission>(e =>
        {
            e.HasKey(x => x.CustomerPermissionId);
            e.Property(x => x.Permission).IsRequired().HasMaxLength(100);
            e.HasOne(x => x.Customer)
             .WithMany(c => c.CustomerPermissions)
             .HasForeignKey(x => x.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.CustomerId, x.Permission }).IsUnique();
        });

        // Cart, Catalog and Order configurations live in Data/Configurations
        b.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
