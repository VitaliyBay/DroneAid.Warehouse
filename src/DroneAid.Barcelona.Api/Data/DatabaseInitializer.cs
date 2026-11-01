using DroneAid.Barcelona.Api.Models;
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

        const string testUserName = "DAB_Test";
        if (await database.Users.AnyAsync(user => user.NormalizedUserName == "DAB_TEST"))
        {
            return;
        }

        var password = PasswordHasher.CreateHash("qwerty123");
        database.Users.Add(new AppUser
        {
            UserName = testUserName,
            NormalizedUserName = testUserName.ToUpperInvariant(),
            PasswordHash = password.Hash,
            PasswordSalt = password.Salt,
            Role = "Administrator"
        });

        await database.SaveChangesAsync();
    }
}
