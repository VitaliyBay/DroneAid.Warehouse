namespace DroneAid.Barcelona.Api.Models;

public sealed class ComponentType
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public string Name { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public string? ManufacturerOrModel { get; init; }

    public string? PartNumber { get; init; }

    public string UnitOfMeasure { get; init; } = string.Empty;

    public string? CompatibilityNotes { get; init; }

    public decimal MinimumQuantityPerBuild { get; init; }

    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
