using DroneAid.Barcelona.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Data;

public sealed class DroneAidDbContext(DbContextOptions<DroneAidDbContext> options)
    : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();

    public DbSet<ComponentType> ComponentTypes => Set<ComponentType>();

    public DbSet<ComponentStock> ComponentStock => Set<ComponentStock>();

    public DbSet<ComponentRequest> ComponentRequests => Set<ComponentRequest>();

    public DbSet<InventoryAuditEvent> InventoryAuditEvents => Set<InventoryAuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<AppUser>();
        user.ToTable("users");
        user.HasKey(item => item.Id);
        user.Property(item => item.UserName).HasMaxLength(100).IsRequired();
        user.Property(item => item.NormalizedUserName).HasMaxLength(100).IsRequired();
        user.HasIndex(item => item.NormalizedUserName).IsUnique();
        user.Property(item => item.PasswordHash).HasMaxLength(256).IsRequired();
        user.Property(item => item.PasswordSalt).HasMaxLength(256).IsRequired();
        user.Property(item => item.Role).HasMaxLength(100).IsRequired();

        var componentType = modelBuilder.Entity<ComponentType>();
        componentType.ToTable("component_types");
        componentType.HasKey(item => item.Id);
        componentType.Property(item => item.Name).HasMaxLength(200).IsRequired();
        componentType.Property(item => item.Category).HasMaxLength(100).IsRequired();
        componentType.Property(item => item.ManufacturerOrModel).HasMaxLength(200);
        componentType.Property(item => item.PartNumber).HasMaxLength(100);
        componentType.Property(item => item.UnitOfMeasure).HasMaxLength(50).IsRequired();
        componentType.Property(item => item.CompatibilityNotes).HasMaxLength(2000);
        componentType.Property(item => item.MinimumQuantityPerBuild).HasPrecision(12, 3);

        var stock = modelBuilder.Entity<ComponentStock>();
        stock.ToTable("component_stock");
        stock.HasKey(item => item.Id);
        stock.Property(item => item.Quantity).HasPrecision(12, 3);
        stock.Property(item => item.AvailabilityState).HasConversion<string>().HasMaxLength(30);
        stock.Property(item => item.SerialNumberOrBatch).HasMaxLength(200);
        stock.Property(item => item.SourceReference).HasMaxLength(300);
        stock.HasOne(item => item.ComponentType)
            .WithMany()
            .HasForeignKey(item => item.ComponentTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        stock.HasIndex(item => new { item.ComponentTypeId, item.AvailabilityState });

        var componentRequest = modelBuilder.Entity<ComponentRequest>();
        componentRequest.ToTable("component_requests");
        componentRequest.HasKey(item => item.Id);
        componentRequest.Property(item => item.RequestedQuantity).HasPrecision(12, 3);
        componentRequest.Property(item => item.ReceivedQuantity).HasPrecision(12, 3);
        componentRequest.Property(item => item.Reason).HasMaxLength(1000).IsRequired();
        componentRequest.Property(item => item.Priority).HasConversion<string>().HasMaxLength(20);
        componentRequest.Property(item => item.RequestedBy).HasMaxLength(100).IsRequired();
        componentRequest.Property(item => item.RelatedDroneIdentifier).HasMaxLength(100);
        componentRequest.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
        componentRequest.Property(item => item.OrderReference).HasMaxLength(200);
        componentRequest.HasOne(item => item.ComponentType)
            .WithMany()
            .HasForeignKey(item => item.ComponentTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        componentRequest.HasIndex(item => new { item.ComponentTypeId, item.Status });

        var auditEvent = modelBuilder.Entity<InventoryAuditEvent>();
        auditEvent.ToTable("inventory_audit_events");
        auditEvent.HasKey(item => item.Id);
        auditEvent.Property(item => item.Action).HasMaxLength(100).IsRequired();
        auditEvent.Property(item => item.PerformedBy).HasMaxLength(100).IsRequired();
        auditEvent.Property(item => item.Reason).HasMaxLength(1000).IsRequired();
        auditEvent.HasIndex(item => item.OccurredAtUtc);
    }
}
