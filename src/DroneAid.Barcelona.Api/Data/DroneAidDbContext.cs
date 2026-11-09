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

    public DbSet<DroneRequest> DroneRequests => Set<DroneRequest>();

    public DbSet<Drone> Drones => Set<Drone>();

    public DbSet<DroneComponent> DroneComponents => Set<DroneComponent>();

    public DbSet<DroneIssue> DroneIssues => Set<DroneIssue>();

    public DbSet<DroneVideo> DroneVideos => Set<DroneVideo>();

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

        var droneRequest = modelBuilder.Entity<DroneRequest>();
        droneRequest.ToTable("drone_requests");
        droneRequest.HasKey(item => item.Id);
        droneRequest.Property(item => item.ConfigurationId).HasMaxLength(30).IsRequired();
        droneRequest.Property(item => item.ConfigurationName).HasMaxLength(100).IsRequired();
        droneRequest.Property(item => item.Quantity).HasPrecision(12, 3);
        droneRequest.Property(item => item.Reason).HasMaxLength(1000).IsRequired();
        droneRequest.Property(item => item.Priority).HasConversion<string>().HasMaxLength(20);
        droneRequest.Property(item => item.RequestedBy).HasMaxLength(100).IsRequired();
        droneRequest.Property(item => item.DonorReference).HasMaxLength(200);
        droneRequest.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
        droneRequest.HasIndex(item => new { item.ConfigurationId, item.Status });

        var drone = modelBuilder.Entity<Drone>();
        drone.ToTable("drones");
        drone.HasKey(item => item.Id);
        drone.Property(item => item.Code).HasMaxLength(50).IsRequired();
        drone.Property(item => item.NormalizedCode).HasMaxLength(50).IsRequired();
        drone.HasIndex(item => item.NormalizedCode).IsUnique();
        drone.Property(item => item.Nickname).HasMaxLength(100).IsRequired();
        drone.Property(item => item.Type).HasConversion<string>().HasMaxLength(20);
        drone.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
        drone.HasIndex(item => new { item.Status, item.Type });
        drone.HasMany(item => item.Components).WithOne().HasForeignKey(item => item.DroneId).OnDelete(DeleteBehavior.Cascade);
        drone.HasMany(item => item.Issues).WithOne().HasForeignKey(item => item.DroneId).OnDelete(DeleteBehavior.Cascade);
        drone.HasMany(item => item.Videos).WithOne().HasForeignKey(item => item.DroneId).OnDelete(DeleteBehavior.Cascade);

        var droneComponent = modelBuilder.Entity<DroneComponent>();
        droneComponent.ToTable("drone_components");
        droneComponent.HasKey(item => item.Id);
        droneComponent.Property(item => item.Name).HasMaxLength(200).IsRequired();
        droneComponent.Property(item => item.Detail).HasMaxLength(500);

        var droneIssue = modelBuilder.Entity<DroneIssue>();
        droneIssue.ToTable("drone_issues");
        droneIssue.HasKey(item => item.Id);
        droneIssue.Property(item => item.Title).HasMaxLength(200).IsRequired();
        droneIssue.Property(item => item.Description).HasMaxLength(2000);
        droneIssue.Property(item => item.ComponentName).HasMaxLength(200);
        droneIssue.Property(item => item.Status).HasConversion<string>().HasMaxLength(20);

        var droneVideo = modelBuilder.Entity<DroneVideo>();
        droneVideo.ToTable("drone_videos");
        droneVideo.HasKey(item => item.Id);
        droneVideo.Property(item => item.Url).HasMaxLength(2000).IsRequired();
        droneVideo.Property(item => item.Label).HasMaxLength(200);

        var auditEvent = modelBuilder.Entity<InventoryAuditEvent>();
        auditEvent.ToTable("inventory_audit_events");
        auditEvent.HasKey(item => item.Id);
        auditEvent.Property(item => item.Action).HasMaxLength(100).IsRequired();
        auditEvent.Property(item => item.PerformedBy).HasMaxLength(100).IsRequired();
        auditEvent.Property(item => item.Reason).HasMaxLength(1000).IsRequired();
        auditEvent.HasIndex(item => item.OccurredAtUtc);
    }
}
