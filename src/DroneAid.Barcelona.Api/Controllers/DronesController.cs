using DroneAid.Barcelona.Api.Contracts.Drones;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Inventory;
using DroneAid.Barcelona.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Controllers;

[ApiController]
[Route("api/drones")]
public sealed class DronesController(DroneAidDbContext database) : ControllerBase
{
    private const int MaxComponents = 100;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DroneSummaryResponse>>> List(
        [FromQuery] string? search,
        [FromQuery] DroneStatus? status,
        [FromQuery] DroneType? type,
        CancellationToken cancellationToken)
    {
        var query = database.Drones.AsNoTracking().AsQueryable();
        if (status is not null)
        {
            query = query.Where(drone => drone.Status == status);
        }

        if (type is not null)
        {
            query = query.Where(drone => drone.Type == type);
        }

        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            var upper = term.ToUpperInvariant();
            var lower = term.ToLowerInvariant();
            query = query.Where(drone =>
                drone.NormalizedCode.Contains(upper) || drone.Nickname.ToLower().Contains(lower));
        }

        var drones = await query
            .OrderBy(drone => drone.Status == DroneStatus.Available ? 0 : 1)
            .ThenBy(drone => drone.NormalizedCode)
            .Select(drone => new DroneSummaryResponse(
                drone.Id,
                drone.Code,
                drone.Nickname,
                drone.Type,
                drone.Status,
                drone.Components.Count,
                drone.Issues.Count(issue => issue.Status == DroneIssueStatus.Open),
                drone.Videos.Count,
                drone.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        return Ok(drones);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DroneStatusSummaryResponse>> Summary(CancellationToken cancellationToken)
    {
        var counts = await database.Drones.AsNoTracking()
            .GroupBy(drone => drone.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        int CountOf(DroneStatus status) => counts.Where(item => item.Status == status).Sum(item => item.Count);
        return Ok(new DroneStatusSummaryResponse(
            counts.Sum(item => item.Count),
            CountOf(DroneStatus.Available),
            CountOf(DroneStatus.InTesting),
            CountOf(DroneStatus.NeedsRepair),
            CountOf(DroneStatus.Unavailable)));
    }

    [HttpGet("default-components/{type}")]
    public ActionResult<IReadOnlyList<ComponentInput>> DefaultComponents(DroneType type) =>
        Ok(DefaultComponentsFor(type));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DroneDetailResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        return drone is null ? NotFound(Message("The drone could not be found.")) : Ok(ToDetail(drone));
    }

    [HttpPost]
    public async Task<ActionResult<DroneDetailResponse>> Create(
        [FromBody] CreateDroneRequest request,
        CancellationToken cancellationToken)
    {
        var error = ValidateIdentity(request.Code, request.Nickname, request.Type);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        var code = request.Code!.Trim();
        if (await CodeExists(code, null, cancellationToken))
        {
            return Conflict(Message($"A drone with the code {code} already exists."));
        }

        var inputs = request.Components ?? DefaultComponentsFor(request.Type!.Value);
        var componentError = ValidateComponents(inputs);
        if (componentError is not null)
        {
            return BadRequest(Message(componentError));
        }

        var drone = new Drone
        {
            Code = code,
            NormalizedCode = Normalize(code),
            Nickname = request.Nickname!.Trim(),
            Type = request.Type!.Value,
            Status = request.Status ?? DroneStatus.Available
        };
        drone.Components.AddRange(ToComponents(inputs));
        database.Drones.Add(drone);
        await database.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = drone.Id }, ToDetail(drone));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DroneDetailResponse>> Update(
        Guid id,
        [FromBody] UpdateDroneRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        if (drone is null)
        {
            return NotFound(Message("The drone could not be found."));
        }

        var error = ValidateIdentity(request.Code, request.Nickname, request.Type);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        if (request.Status is null)
        {
            return BadRequest(Message("Choose a status for the drone."));
        }

        var code = request.Code!.Trim();
        if (await CodeExists(code, id, cancellationToken))
        {
            return Conflict(Message($"A drone with the code {code} already exists."));
        }

        drone.Code = code;
        drone.NormalizedCode = Normalize(code);
        drone.Nickname = request.Nickname!.Trim();
        drone.Type = request.Type!.Value;
        if (drone.Status != request.Status.Value)
        {
            drone.Status = request.Status.Value;
            drone.StatusChangedAtUtc = DateTimeOffset.UtcNow;
        }

        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpPut("{id:guid}/components")]
    public async Task<ActionResult<DroneDetailResponse>> ReplaceComponents(
        Guid id,
        [FromBody] ReplaceComponentsRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        if (drone is null)
        {
            return NotFound(Message("The drone could not be found."));
        }

        var inputs = request.Components ?? [];
        var error = ValidateComponents(inputs);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        database.DroneComponents.RemoveRange(drone.Components);
        drone.Components.Clear();
        var replacements = ToComponents(inputs);
        foreach (var component in replacements)
        {
            component.DroneId = drone.Id;
        }

        database.DroneComponents.AddRange(replacements);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpPost("{id:guid}/issues")]
    public async Task<ActionResult<DroneDetailResponse>> AddIssue(
        Guid id,
        [FromBody] IssueRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        if (drone is null)
        {
            return NotFound(Message("The drone could not be found."));
        }

        var error = ValidateIssue(request);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        var issue = new DroneIssue { DroneId = drone.Id };
        ApplyIssue(issue, request);
        database.DroneIssues.Add(issue);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpPut("{id:guid}/issues/{issueId:guid}")]
    public async Task<ActionResult<DroneDetailResponse>> UpdateIssue(
        Guid id,
        Guid issueId,
        [FromBody] IssueRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        var issue = drone?.Issues.SingleOrDefault(item => item.Id == issueId);
        if (drone is null || issue is null)
        {
            return NotFound(Message("The issue could not be found."));
        }

        var error = ValidateIssue(request);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        ApplyIssue(issue, request);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpPost("{id:guid}/videos")]
    public async Task<ActionResult<DroneDetailResponse>> AddVideo(
        Guid id,
        [FromBody] VideoRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        if (drone is null)
        {
            return NotFound(Message("The drone could not be found."));
        }

        var error = ValidateVideo(request);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        var video = new DroneVideo { DroneId = drone.Id };
        ApplyVideo(video, request);
        database.DroneVideos.Add(video);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpPut("{id:guid}/videos/{videoId:guid}")]
    public async Task<ActionResult<DroneDetailResponse>> UpdateVideo(
        Guid id,
        Guid videoId,
        [FromBody] VideoRequest request,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        var video = drone?.Videos.SingleOrDefault(item => item.Id == videoId);
        if (drone is null || video is null)
        {
            return NotFound(Message("The video link could not be found."));
        }

        var error = ValidateVideo(request);
        if (error is not null)
        {
            return BadRequest(Message(error));
        }

        ApplyVideo(video, request);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    [HttpDelete("{id:guid}/videos/{videoId:guid}")]
    public async Task<ActionResult<DroneDetailResponse>> RemoveVideo(
        Guid id,
        Guid videoId,
        CancellationToken cancellationToken)
    {
        var drone = await LoadDrone(id, cancellationToken);
        var video = drone?.Videos.SingleOrDefault(item => item.Id == videoId);
        if (drone is null || video is null)
        {
            return NotFound(Message("The video link could not be found."));
        }

        database.DroneVideos.Remove(video);
        drone.Videos.Remove(video);
        drone.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDetail(drone));
    }

    private static object Message(string message) => new { message };

    private static string Normalize(string code) => code.Trim().ToUpperInvariant();

    private Task<Drone?> LoadDrone(Guid id, CancellationToken cancellationToken) =>
        database.Drones
            .Include(drone => drone.Components)
            .Include(drone => drone.Issues)
            .Include(drone => drone.Videos)
            .AsSplitQuery()
            .SingleOrDefaultAsync(drone => drone.Id == id, cancellationToken);

    private Task<bool> CodeExists(string code, Guid? exceptId, CancellationToken cancellationToken)
    {
        var normalized = Normalize(code);
        return database.Drones.AnyAsync(
            drone => drone.NormalizedCode == normalized && drone.Id != exceptId,
            cancellationToken);
    }

    private static IReadOnlyList<ComponentInput> DefaultComponentsFor(DroneType type)
    {
        var configuration = DroneBuildConfigurations.Find(type.ToString())!;
        return configuration.Requirements
            .Select(requirement => new ComponentInput(requirement.ComponentName, null, (int)requirement.Quantity))
            .ToList();
    }

    private static List<DroneComponent> ToComponents(IReadOnlyList<ComponentInput> inputs) =>
        inputs.Select((input, index) => new DroneComponent
        {
            Name = input.Name!.Trim(),
            Detail = Clean(input.Detail),
            Quantity = input.Quantity,
            SortOrder = index
        }).ToList();

    private static string? Clean(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? ValidateIdentity(string? code, string? nickname, DroneType? type)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return "Enter the drone code.";
        }

        if (code.Trim().Length > 50)
        {
            return "The drone code can have at most 50 characters.";
        }

        if (string.IsNullOrWhiteSpace(nickname))
        {
            return "Enter a nickname for the drone.";
        }

        if (nickname.Trim().Length > 100)
        {
            return "The nickname can have at most 100 characters.";
        }

        return type is null ? "Choose the drone type: Analog or Digital." : null;
    }

    private static string? ValidateComponents(IReadOnlyList<ComponentInput> inputs)
    {
        if (inputs.Count > MaxComponents)
        {
            return $"A drone can have at most {MaxComponents} component entries.";
        }

        foreach (var input in inputs)
        {
            if (string.IsNullOrWhiteSpace(input.Name))
            {
                return "Every component needs a name.";
            }

            if (input.Name.Trim().Length > 200 || (input.Detail?.Trim().Length ?? 0) > 500)
            {
                return "A component name can have at most 200 characters and a detail note at most 500.";
            }

            if (input.Quantity < 1)
            {
                return $"The quantity for {input.Name.Trim()} must be a whole number of at least 1.";
            }
        }

        return null;
    }

    private static string? ValidateIssue(IssueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Enter a short title for the issue.";
        }

        if (request.Title.Trim().Length > 200 ||
            (request.Description?.Trim().Length ?? 0) > 2000 ||
            (request.ComponentName?.Trim().Length ?? 0) > 200)
        {
            return "The issue title can have at most 200 characters, the description 2000, and the component 200.";
        }

        return null;
    }

    private static string? ValidateVideo(VideoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url) ||
            !Uri.TryCreate(request.Url.Trim(), UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps)
        {
            return "Enter a valid link that starts with https://.";
        }

        if (request.Url.Trim().Length > 2000 || (request.Label?.Trim().Length ?? 0) > 200)
        {
            return "The link can have at most 2000 characters and the label 200.";
        }

        return null;
    }

    private static void ApplyIssue(DroneIssue issue, IssueRequest request)
    {
        issue.Title = request.Title!.Trim();
        issue.Description = Clean(request.Description);
        issue.ComponentName = Clean(request.ComponentName);
        var status = request.Status ?? issue.Status;
        if (status != issue.Status)
        {
            issue.Status = status;
            issue.ResolvedAtUtc = status == DroneIssueStatus.Resolved ? DateTimeOffset.UtcNow : null;
        }
    }

    private static void ApplyVideo(DroneVideo video, VideoRequest request)
    {
        video.Url = request.Url!.Trim();
        video.Label = Clean(request.Label);
        video.TestedOn = request.TestedOn;
    }

    private static DroneDetailResponse ToDetail(Drone drone) => new(
        drone.Id,
        drone.Code,
        drone.Nickname,
        drone.Type,
        drone.Status,
        drone.StatusChangedAtUtc,
        drone.CreatedAtUtc,
        drone.UpdatedAtUtc,
        drone.Components.OrderBy(item => item.SortOrder)
            .Select(item => new DroneComponentResponse(item.Id, item.Name, item.Detail, item.Quantity))
            .ToList(),
        drone.Issues.OrderBy(item => item.Status).ThenByDescending(item => item.ReportedAtUtc)
            .Select(item => new DroneIssueResponse(
                item.Id, item.Title, item.Description, item.ComponentName,
                item.Status, item.ReportedAtUtc, item.ResolvedAtUtc))
            .ToList(),
        drone.Videos.OrderByDescending(item => item.TestedOn ?? DateOnly.MinValue)
            .ThenByDescending(item => item.AddedAtUtc)
            .Select(item => new DroneVideoResponse(item.Id, item.Url, item.Label, item.TestedOn, item.AddedAtUtc))
            .ToList());
}
