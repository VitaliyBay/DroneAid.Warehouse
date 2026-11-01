using DroneAid.Barcelona.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Data;

public sealed class DroneAidDbContext(DbContextOptions<DroneAidDbContext> options)
    : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();

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
    }
}
