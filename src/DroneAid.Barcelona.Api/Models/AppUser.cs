namespace DroneAid.Barcelona.Api.Models;

public sealed class AppUser
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public string UserName { get; init; } = string.Empty;

    public string NormalizedUserName { get; init; } = string.Empty;

    public string PasswordHash { get; init; } = string.Empty;

    public string PasswordSalt { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
