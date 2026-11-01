namespace DroneAid.Barcelona.Api.Models;

public sealed class InventoryAuditEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid? ComponentTypeId { get; init; }

    public Guid? ComponentStockId { get; init; }

    public Guid? ComponentRequestId { get; init; }

    public string Action { get; init; } = string.Empty;

    public string PerformedBy { get; init; } = string.Empty;

    public string Reason { get; init; } = string.Empty;

    public DateTimeOffset OccurredAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
