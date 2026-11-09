namespace DroneAid.Barcelona.Api.Models;

public enum DroneType
{
    Analog,
    Digital
}

public enum DroneStatus
{
    Available,
    InTesting,
    NeedsRepair,
    Unavailable
}

public enum DroneIssueStatus
{
    Open,
    Resolved
}

public sealed class Drone
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public string Code { get; set; } = string.Empty;

    public string NormalizedCode { get; set; } = string.Empty;

    public string Nickname { get; set; } = string.Empty;

    public DroneType Type { get; set; }

    public DroneStatus Status { get; set; } = DroneStatus.Available;

    public DateTimeOffset StatusChangedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public List<DroneComponent> Components { get; init; } = [];

    public List<DroneIssue> Issues { get; init; } = [];

    public List<DroneVideo> Videos { get; init; } = [];
}

public sealed class DroneComponent
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid DroneId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Detail { get; set; }

    public int Quantity { get; set; } = 1;

    public int SortOrder { get; set; }
}

public sealed class DroneIssue
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid DroneId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ComponentName { get; set; }

    public DroneIssueStatus Status { get; set; } = DroneIssueStatus.Open;

    public DateTimeOffset ReportedAtUtc { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ResolvedAtUtc { get; set; }
}

public sealed class DroneVideo
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid DroneId { get; set; }

    public string Url { get; set; } = string.Empty;

    public string? Label { get; set; }

    public DateOnly? TestedOn { get; set; }

    public DateTimeOffset AddedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
