using DroneAid.Barcelona.Api.Contracts.Drones;
using DroneAid.Barcelona.Api.Controllers;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Tests;

public sealed class DronesControllerTests
{
    [Fact]
    public async Task Create_loads_default_components_for_an_analog_drone()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);

        var detail = Created(await controller.Create(
            new CreateDroneRequest("DABCN0001", "Falcon", DroneType.Analog, null, null),
            CancellationToken.None));

        Assert.Equal(DroneStatus.Available, detail.Status);
        Assert.Contains(detail.Components, item => item.Name == "Analog camera");
        Assert.DoesNotContain(detail.Components, item => item.Name == "Digital video unit");
    }

    [Fact]
    public async Task Create_loads_default_components_for_a_digital_drone()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);

        var detail = Created(await controller.Create(
            new CreateDroneRequest("DABCN0002", "Pico", DroneType.Digital, null, null),
            CancellationToken.None));

        Assert.Contains(detail.Components, item => item.Name == "Digital video unit");
        Assert.DoesNotContain(detail.Components, item => item.Name == "Analog camera");
    }

    [Fact]
    public async Task Create_rejects_a_duplicate_code_ignoring_case()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await controller.Create(new CreateDroneRequest("DABCN0001", "Falcon", DroneType.Analog, null, null), CancellationToken.None);

        var result = await controller.Create(
            new CreateDroneRequest(" dabcn0001 ", "Other", DroneType.Digital, null, null),
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(1, await database.Drones.CountAsync());
    }

    [Fact]
    public async Task Create_errors_include_a_code_the_web_app_can_translate()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await controller.Create(new CreateDroneRequest("DABCN0001", "Falcon", DroneType.Analog, null, null), CancellationToken.None);

        var duplicate = Assert.IsType<ConflictObjectResult>(
            (await controller.Create(new CreateDroneRequest("dabcn0001", "Other", DroneType.Digital, null, null), CancellationToken.None)).Result);
        var missing = Assert.IsType<BadRequestObjectResult>(
            (await controller.Create(new CreateDroneRequest("", "Falcon", DroneType.Analog, null, null), CancellationToken.None)).Result);

        Assert.Equal("drone.code.duplicate", ErrorCode(duplicate.Value));
        Assert.Equal("drone.code.required", ErrorCode(missing.Value));
    }

    private static string? ErrorCode(object? body) =>
        body?.GetType().GetProperty("code")?.GetValue(body) as string;

    [Theory]
    [InlineData("", "Falcon", DroneType.Analog)]
    [InlineData("DABCN0001", "  ", DroneType.Analog)]
    [InlineData("DABCN0001", "Falcon", null)]
    public async Task Create_rejects_missing_code_nickname_or_type(string code, string nickname, DroneType? type)
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);

        var result = await controller.Create(
            new CreateDroneRequest(code, nickname, type, null, null),
            CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_rejects_a_component_quantity_below_one()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);

        var result = await controller.Create(
            new CreateDroneRequest("DABCN0001", "Falcon", DroneType.Analog, null, [new ComponentInput("Frame", null, 0)]),
            CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task List_searches_by_code_or_nickname_and_combines_filters()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);
        await Seed(controller, "DABCN0002", "Pico", DroneType.Analog, DroneStatus.NeedsRepair);
        await Seed(controller, "DABCN0003", "Stork", DroneType.Analog, DroneStatus.Available);

        Assert.Equal(["DABCN0002"], await Codes(controller, "pic", null, null));
        Assert.Equal(["DABCN0003"], await Codes(controller, "0003", null, null));
        Assert.Equal(["DABCN0003"], await Codes(controller, null, DroneStatus.Available, DroneType.Analog));
        Assert.Empty(await Codes(controller, "falcon", null, DroneType.Analog));
    }

    [Fact]
    public async Task List_shows_available_drones_first()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Unavailable);
        await Seed(controller, "DABCN0002", "Pico", DroneType.Analog, DroneStatus.Available);

        Assert.Equal(["DABCN0002", "DABCN0001"], await Codes(controller, null, null, null));
    }

    [Fact]
    public async Task Summary_counts_drones_by_status()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);
        await Seed(controller, "DABCN0002", "Pico", DroneType.Analog, DroneStatus.Available);
        await Seed(controller, "DABCN0003", "Stork", DroneType.Analog, DroneStatus.NeedsRepair);

        var summary = Assert.IsType<OkObjectResult>((await controller.Summary(CancellationToken.None)).Result);
        var value = Assert.IsType<DroneStatusSummaryResponse>(summary.Value);

        Assert.Equal(3, value.Total);
        Assert.Equal(2, value.Available);
        Assert.Equal(1, value.NeedsRepair);
        Assert.Equal(0, value.InTesting);
    }

    [Fact]
    public async Task Update_changes_data_and_records_the_status_change_time()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        var drone = await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);
        var before = drone.StatusChangedAtUtc;
        await Task.Delay(5);

        var updated = Ok(await controller.Update(
            drone.Id,
            new UpdateDroneRequest("DABCN0009", "Hawk", DroneType.Digital, DroneStatus.InTesting),
            CancellationToken.None));

        Assert.Equal("DABCN0009", updated.Code);
        Assert.Equal("Hawk", updated.Nickname);
        Assert.Equal(DroneStatus.InTesting, updated.Status);
        Assert.True(updated.StatusChangedAtUtc > before);
    }

    [Fact]
    public async Task Update_rejects_a_code_used_by_another_drone()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);
        var other = await Seed(controller, "DABCN0002", "Pico", DroneType.Analog, DroneStatus.Available);

        var result = await controller.Update(
            other.Id,
            new UpdateDroneRequest("dabcn0001", "Pico", DroneType.Analog, DroneStatus.Available),
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task ReplaceComponents_changes_only_the_selected_drone()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        var first = await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);
        var second = await Seed(controller, "DABCN0002", "Pico", DroneType.Digital, DroneStatus.Available);
        var secondCount = second.Components.Count;

        var updated = Ok(await controller.ReplaceComponents(
            first.Id,
            new ReplaceComponentsRequest([new ComponentInput("Frame", "7 inch", 1), new ComponentInput("Battery", null, 2)]),
            CancellationToken.None));

        Assert.Equal(["Frame", "Battery"], updated.Components.Select(item => item.Name));
        Assert.Equal("7 inch", updated.Components[0].Detail);
        var reloaded = Ok(await controller.Get(second.Id, CancellationToken.None));
        Assert.Equal(secondCount, reloaded.Components.Count);
    }

    [Fact]
    public async Task Issues_can_be_reported_resolved_and_are_counted_as_open_in_the_list()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        var drone = await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);

        var withIssue = Ok(await controller.AddIssue(
            drone.Id, new IssueRequest("Motor wire loose", null, "Motor", null), CancellationToken.None));
        var issue = Assert.Single(withIssue.Issues);
        Assert.Equal(DroneIssueStatus.Open, issue.Status);
        Assert.Equal(1, (await Summaries(controller)).Single().OpenIssueCount);

        var resolved = Ok(await controller.UpdateIssue(
            drone.Id, issue.Id, new IssueRequest("Motor wire loose", "Resoldered", "Motor", DroneIssueStatus.Resolved), CancellationToken.None));
        var resolvedIssue = Assert.Single(resolved.Issues);
        Assert.Equal(DroneIssueStatus.Resolved, resolvedIssue.Status);
        Assert.NotNull(resolvedIssue.ResolvedAtUtc);
        Assert.Equal(0, (await Summaries(controller)).Single().OpenIssueCount);
    }

    [Theory]
    [InlineData("http://example.com/video")]
    [InlineData("not a link")]
    [InlineData("")]
    public async Task AddVideo_rejects_links_that_are_not_https(string url)
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        var drone = await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);

        var result = await controller.AddVideo(drone.Id, new VideoRequest(url, null, null), CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Videos_can_be_added_edited_and_removed()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);
        var drone = await Seed(controller, "DABCN0001", "Falcon", DroneType.Digital, DroneStatus.Available);

        var added = Ok(await controller.AddVideo(
            drone.Id,
            new VideoRequest("https://onedrive.live.com/video1", "Hover test", new DateOnly(2026, 10, 28)),
            CancellationToken.None));
        var video = Assert.Single(added.Videos);

        var edited = Ok(await controller.UpdateVideo(
            drone.Id, video.Id, new VideoRequest("https://onedrive.live.com/video2", "Range test", null), CancellationToken.None));
        Assert.Equal("Range test", Assert.Single(edited.Videos).Label);

        var removed = Ok(await controller.RemoveVideo(drone.Id, video.Id, CancellationToken.None));
        Assert.Empty(removed.Videos);
    }

    [Fact]
    public async Task Get_returns_not_found_for_an_unknown_drone()
    {
        await using var database = CreateDatabase();
        var controller = new DronesController(database);

        var result = await controller.Get(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    private static async Task<DroneDetailResponse> Seed(
        DronesController controller, string code, string nickname, DroneType type, DroneStatus status) =>
        Created(await controller.Create(
            new CreateDroneRequest(code, nickname, type, status, null), CancellationToken.None));

    private static async Task<IReadOnlyList<DroneSummaryResponse>> Summaries(DronesController controller) =>
        Assert.IsType<List<DroneSummaryResponse>>(
            Assert.IsType<OkObjectResult>((await controller.List(null, null, null, CancellationToken.None)).Result).Value);

    private static async Task<List<string>> Codes(
        DronesController controller, string? search, DroneStatus? status, DroneType? type)
    {
        var result = Assert.IsType<OkObjectResult>((await controller.List(search, status, type, CancellationToken.None)).Result);
        return Assert.IsType<List<DroneSummaryResponse>>(result.Value).Select(item => item.Code).ToList();
    }

    private static DroneDetailResponse Created(ActionResult<DroneDetailResponse> result) =>
        Assert.IsType<DroneDetailResponse>(Assert.IsType<CreatedAtActionResult>(result.Result).Value);

    private static DroneDetailResponse Ok(ActionResult<DroneDetailResponse> result) =>
        Assert.IsType<DroneDetailResponse>(Assert.IsType<OkObjectResult>(result.Result).Value);

    private static DroneAidDbContext CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<DroneAidDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new DroneAidDbContext(options);
    }
}
