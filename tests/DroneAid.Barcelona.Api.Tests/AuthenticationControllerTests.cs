using DroneAid.Barcelona.Api.Contracts.Authentication;
using DroneAid.Barcelona.Api.Controllers;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Models;
using DroneAid.Barcelona.Api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Tests;

public sealed class AuthenticationControllerTests
{
    [Fact]
    public async Task Login_returns_the_user_when_credentials_are_valid()
    {
        await using var database = CreateDatabase();
        var credentials = PasswordHasher.CreateHash("qwerty123");
        database.Users.Add(new AppUser
        {
            UserName = "DAB_Test",
            NormalizedUserName = "DAB_TEST",
            PasswordHash = credentials.Hash,
            PasswordSalt = credentials.Salt,
            Role = "Administrator"
        });
        await database.SaveChangesAsync();
        var controller = new AuthenticationController(database);

        var result = await controller.Login(
            new LoginRequest { UserName = "dab_test", Password = "qwerty123" },
            CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<LoginResponse>(response.Value);
        Assert.Equal("DAB_Test", user.UserName);
        Assert.Equal("Administrator", user.Role);
    }

    [Fact]
    public async Task Login_returns_unauthorized_for_an_incorrect_password()
    {
        await using var database = CreateDatabase();
        var credentials = PasswordHasher.CreateHash("qwerty123");
        database.Users.Add(new AppUser
        {
            UserName = "DAB_Test",
            NormalizedUserName = "DAB_TEST",
            PasswordHash = credentials.Hash,
            PasswordSalt = credentials.Salt,
            Role = "Administrator"
        });
        await database.SaveChangesAsync();
        var controller = new AuthenticationController(database);

        var result = await controller.Login(
            new LoginRequest { UserName = "DAB_Test", Password = "wrong-password" },
            CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    private static DroneAidDbContext CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<DroneAidDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new DroneAidDbContext(options);
    }
}
