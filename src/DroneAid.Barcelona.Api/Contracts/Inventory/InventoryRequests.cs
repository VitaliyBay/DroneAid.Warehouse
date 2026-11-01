using DroneAid.Barcelona.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DroneAid.Barcelona.Api.Contracts.Inventory;

public sealed class CreateComponentTypeRequest
{
    [Required, StringLength(200)] public string Name { get; init; } = string.Empty;
    [Required, StringLength(100)] public string Category { get; init; } = string.Empty;
    [StringLength(200)] public string? ManufacturerOrModel { get; init; }
    [StringLength(100)] public string? PartNumber { get; init; }
    [Required, StringLength(50)] public string UnitOfMeasure { get; init; } = string.Empty;
    [StringLength(2000)] public string? CompatibilityNotes { get; init; }
    [Range(typeof(decimal), "0.001", "999999")] public decimal MinimumQuantityPerBuild { get; init; }
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
}

public sealed class ReceiveStockRequest
{
    public Guid ComponentTypeId { get; init; }
    [Range(typeof(decimal), "0.001", "999999")] public decimal Quantity { get; init; }
    public StockAvailabilityState AvailabilityState { get; init; } = StockAvailabilityState.Available;
    [StringLength(200)] public string? SerialNumberOrBatch { get; init; }
    [StringLength(300)] public string? SourceReference { get; init; }
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
}

public sealed class AdjustStockRequest
{
    [Range(typeof(decimal), "-999999", "999999")] public decimal QuantityDelta { get; init; }
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
}

public sealed class CreateComponentRequestRequest
{
    public Guid ComponentTypeId { get; init; }
    [Range(typeof(decimal), "0.001", "999999")] public decimal Quantity { get; init; }
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
    public ComponentRequestPriority Priority { get; init; } = ComponentRequestPriority.Normal;
    [Required, StringLength(100)] public string RequestedBy { get; init; } = string.Empty;
    [StringLength(100)] public string? RelatedDroneIdentifier { get; init; }
}

public sealed class RequestActionRequest
{
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
}

public sealed class OrderComponentRequest
{
    [Required, StringLength(200)] public string OrderReference { get; init; } = string.Empty;
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
}

public sealed class ReceiveComponentRequest
{
    [Range(typeof(decimal), "0.001", "999999")] public decimal Quantity { get; init; }
    public StockAvailabilityState AvailabilityState { get; init; } = StockAvailabilityState.Available;
    [StringLength(200)] public string? SerialNumberOrBatch { get; init; }
    [StringLength(300)] public string? SourceReference { get; init; }
    [Required, StringLength(100)] public string PerformedBy { get; init; } = string.Empty;
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
}
