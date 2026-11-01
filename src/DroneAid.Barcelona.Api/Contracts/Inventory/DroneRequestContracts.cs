using System.ComponentModel.DataAnnotations;
using DroneAid.Barcelona.Api.Models;

namespace DroneAid.Barcelona.Api.Contracts.Inventory;

public sealed class CreateDroneRequestRequest
{
    [Required, StringLength(30)] public string ConfigurationId { get; init; } = string.Empty;
    [Range(typeof(decimal), "0.001", "999999")] public decimal Quantity { get; init; }
    [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty;
    public ComponentRequestPriority Priority { get; init; } = ComponentRequestPriority.Normal;
    [Required, StringLength(100)] public string RequestedBy { get; init; } = string.Empty;
    [StringLength(200)] public string? DonorReference { get; init; }
}

public sealed record DroneBuildCapacityResponse(
    string ConfigurationId,
    string ConfigurationName,
    string Description,
    int AvailableBuilds,
    IReadOnlyList<DroneComponentAvailabilityResponse> Components);

public sealed record DroneComponentAvailabilityResponse(
    string ComponentName,
    decimal RequiredQuantity,
    decimal AvailableQuantity,
    string UnitOfMeasure);
