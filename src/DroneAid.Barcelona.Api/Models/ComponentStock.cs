namespace DroneAid.Barcelona.Api.Models;

public enum StockAvailabilityState
{
    Available,
    Reserved,
    Installed,
    Quarantined,
    ConsumedOrRemoved
}

public sealed class ComponentStock
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid ComponentTypeId { get; init; }

    public ComponentType ComponentType { get; init; } = null!;

    public decimal Quantity { get; set; }

    public StockAvailabilityState AvailabilityState { get; set; }

    public string? SerialNumberOrBatch { get; init; }

    public string? SourceReference { get; init; }

    public DateTimeOffset ReceivedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
