using DroneAid.Barcelona.Api.Models;

namespace DroneAid.Barcelona.Api.Contracts.Drones;

public sealed record ComponentInput(string? Name, string? Detail, int Quantity);

public sealed record CreateDroneRequest(
    string? Code,
    string? Nickname,
    DroneType? Type,
    DroneStatus? Status,
    IReadOnlyList<ComponentInput>? Components);

public sealed record UpdateDroneRequest(
    string? Code,
    string? Nickname,
    DroneType? Type,
    DroneStatus? Status);

public sealed record ReplaceComponentsRequest(IReadOnlyList<ComponentInput>? Components);

public sealed record IssueRequest(
    string? Title,
    string? Description,
    string? ComponentName,
    DroneIssueStatus? Status);

public sealed record VideoRequest(string? Url, string? Label, DateOnly? TestedOn);

public sealed record DroneSummaryResponse(
    Guid Id,
    string Code,
    string Nickname,
    DroneType Type,
    DroneStatus Status,
    int ComponentCount,
    int OpenIssueCount,
    int VideoCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record DroneComponentResponse(Guid Id, string Name, string? Detail, int Quantity);

public sealed record DroneIssueResponse(
    Guid Id,
    string Title,
    string? Description,
    string? ComponentName,
    DroneIssueStatus Status,
    DateTimeOffset ReportedAtUtc,
    DateTimeOffset? ResolvedAtUtc);

public sealed record DroneVideoResponse(
    Guid Id,
    string Url,
    string? Label,
    DateOnly? TestedOn,
    DateTimeOffset AddedAtUtc);

public sealed record DroneDetailResponse(
    Guid Id,
    string Code,
    string Nickname,
    DroneType Type,
    DroneStatus Status,
    DateTimeOffset StatusChangedAtUtc,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    IReadOnlyList<DroneComponentResponse> Components,
    IReadOnlyList<DroneIssueResponse> Issues,
    IReadOnlyList<DroneVideoResponse> Videos);

public sealed record DroneStatusSummaryResponse(
    int Total,
    int Available,
    int InTesting,
    int NeedsRepair,
    int Unavailable);
