namespace DroneAid.Barcelona.Api.Models;

public enum DroneRequestStatus
{
    Requested,
    Planning,
    Cancelled
}

public sealed class DroneRequest
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public string ConfigurationId { get; init; } = string.Empty;

    public string ConfigurationName { get; init; } = string.Empty;

    public decimal Quantity { get; init; }

    public string Reason { get; init; } = string.Empty;

    public ComponentRequestPriority Priority { get; init; }

    public string RequestedBy { get; init; } = string.Empty;

    public string? DonorReference { get; init; }

    public DroneRequestStatus Status { get; set; } = DroneRequestStatus.Requested;

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
