using System.ComponentModel.DataAnnotations;

namespace DroneAid.Barcelona.Api.Contracts.Authentication;

public sealed class LoginRequest
{
    [Required]
    [StringLength(100)]
    public string UserName { get; init; } = string.Empty;

    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string Password { get; init; } = string.Empty;
}
