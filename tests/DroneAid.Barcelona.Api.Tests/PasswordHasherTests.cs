using DroneAid.Barcelona.Api.Security;

namespace DroneAid.Barcelona.Api.Tests;

public sealed class PasswordHasherTests
{
    [Fact]
    public void Verify_returns_true_for_the_password_used_to_create_the_hash()
    {
        var credentials = PasswordHasher.CreateHash("qwerty123");

        var verified = PasswordHasher.Verify("qwerty123", credentials.Hash, credentials.Salt);

        Assert.True(verified);
    }

    [Fact]
    public void Verify_returns_false_for_an_incorrect_password()
    {
        var credentials = PasswordHasher.CreateHash("qwerty123");

        var verified = PasswordHasher.Verify("incorrect-password", credentials.Hash, credentials.Salt);

        Assert.False(verified);
    }
}
