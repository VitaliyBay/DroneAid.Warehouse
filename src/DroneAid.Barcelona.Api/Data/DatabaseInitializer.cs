using DroneAid.Barcelona.Api.Models;
using DroneAid.Barcelona.Api.Inventory;
using DroneAid.Barcelona.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Data;

public static class DatabaseInitializer
{
    public static async Task InitialiseAsync(IServiceProvider serviceProvider)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<DroneAidDbContext>();

        await database.Database.EnsureCreatedAsync();
        await database.Database.MigrateAsync();

        const string testUserName = "DAB_Test";
        if (!await database.Users.AnyAsync(user => user.NormalizedUserName == "DAB_TEST"))
        {
            var password = PasswordHasher.CreateHash("qwerty123");
            database.Users.Add(new AppUser
            {
                UserName = testUserName,
                NormalizedUserName = testUserName.ToUpperInvariant(),
                PasswordHash = password.Hash,
                PasswordSalt = password.Salt,
                Role = "Administrator"
            });
        }

        var existingComponentNames = await database.ComponentTypes
            .Select(componentType => componentType.Name)
            .ToListAsync();
        var catalogueNames = existingComponentNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var componentName in DroneBuildConfigurations.All
                     .SelectMany(configuration => configuration.Requirements)
                     .Select(requirement => requirement.ComponentName)
                     .Distinct(StringComparer.OrdinalIgnoreCase)
                     .Where(componentName => !catalogueNames.Contains(componentName)))
        {
            database.ComponentTypes.Add(new ComponentType
            {
                Name = componentName,
                Category = componentName,
                UnitOfMeasure = "each",
                MinimumQuantityPerBuild = 1,
                CompatibilityNotes = "Part of the standard Digital and/or Analog drone configuration."
            });
        }

        await database.SaveChangesAsync();
    }
}
