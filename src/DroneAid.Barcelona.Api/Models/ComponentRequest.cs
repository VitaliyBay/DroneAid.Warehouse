namespace DroneAid.Barcelona.Api.Models;

public enum ComponentRequestStatus
{
    Draft,
    Submitted,
    Approved,
    Ordered,
    PartiallyReceived,
    Received,
    Cancelled,
    Rejected
}

public enum ComponentRequestPriority
{
    Low,
    Normal,
    High,
    Urgent
}

public sealed class ComponentRequest
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid ComponentTypeId { get; init; }

    public ComponentType ComponentType { get; init; } = null!;

    public decimal RequestedQuantity { get; init; }

    public decimal ReceivedQuantity { get; set; }

    public string Reason { get; init; } = string.Empty;

    public ComponentRequestPriority Priority { get; init; }

    public string RequestedBy { get; init; } = string.Empty;

    public string? RelatedDroneIdentifier { get; init; }

    public ComponentRequestStatus Status { get; set; } = ComponentRequestStatus.Draft;

    public string? OrderReference { get; set; }

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
