using System.Net;
using System.Text.Json;

namespace DroneAid.Barcelona.Api.IntegrationTests;

public sealed class DronesEndpointsTests
{
    private static async Task<JsonElement> CreateDrone(ApiFactory factory, string code, string nickname, string type)
    {
        var response = await factory.PostAsync("/api/drones", new { code, nickname, type });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.ReadJsonAsync();
    }

    private static string Id(JsonElement drone) => drone.GetProperty("id").GetString()!;

    private static string[] ComponentNames(JsonElement drone) =>
        drone.GetProperty("components").EnumerateArray().Select(item => item.GetProperty("name").GetString()!).ToArray();

    [Fact]
    public async Task Create_returns_201_with_a_location_and_the_digital_defaults_with_models()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/drones", new { code = "DABCN0001", nickname = "Falcon", type = "Digital" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var drone = await response.ReadJsonAsync();
        Assert.Equal("Digital", drone.GetProperty("type").GetString());
        Assert.Equal("Available", drone.GetProperty("status").GetString());
        var names = ComponentNames(drone);
        Assert.Contains("Digital video unit", names);
        Assert.DoesNotContain("Analog camera", names);
        var video = drone.GetProperty("components").EnumerateArray()
            .Single(item => item.GetProperty("name").GetString() == "Digital video unit");
        Assert.Contains("Avatar GT", video.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task Create_loads_the_analog_defaults()
    {
        using var factory = new ApiFactory();

        var drone = await CreateDrone(factory, "DABCN0002", "Pico", "Analog");

        var names = ComponentNames(drone);
        Assert.Contains("Analog camera", names);
        Assert.Contains("Analog video transmitter", names);
        Assert.DoesNotContain("Digital video unit", names);
    }

    [Fact]
    public async Task Create_rejects_a_duplicate_code_ignoring_case_with_409()
    {
        using var factory = new ApiFactory();
        await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");

        var response = await factory.PostAsync("/api/drones", new { code = " dabcn0001 ", nickname = "Other", type = "Digital" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("drone.code.duplicate", (await response.ReadJsonAsync()).GetProperty("code").GetString());
    }

    [Theory]
    [InlineData("", "Falcon", "Analog", "drone.code.required")]
    [InlineData("DAB1", "", "Analog", "drone.nickname.required")]
    [InlineData("DAB1", "Falcon", null, "drone.type.required")]
    public async Task Create_rejects_missing_identity_fields_with_400(string code, string nickname, string? type, string expectedCode)
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/drones", new { code, nickname, type });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(expectedCode, (await response.ReadJsonAsync()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Get_returns_the_drone_and_404_for_an_unknown_id()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var client = factory.CreateClient();

        var found = await client.GetAsync($"/api/drones/{Id(created)}");
        var missing = await client.GetAsync($"/api/drones/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.OK, found.StatusCode);
        Assert.Equal("DABCN0001", (await found.ReadJsonAsync()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal("drone.notFound", (await missing.ReadJsonAsync()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task ByCode_returns_the_drone_for_a_scanned_code_and_404_with_the_code_otherwise()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0042", "Scanned", "Digital");
        var client = factory.CreateClient();

        var found = await client.GetAsync("/api/drones/by-code/dabcn0042");
        var missing = await client.GetAsync("/api/drones/by-code/DABCN9999");

        Assert.Equal(HttpStatusCode.OK, found.StatusCode);
        Assert.Equal(Id(created), (await found.ReadJsonAsync()).GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        var error = await missing.ReadJsonAsync();
        Assert.Equal("drone.code.notFound", error.GetProperty("code").GetString());
        Assert.Equal("DABCN9999", error.GetProperty("args").GetProperty("code").GetString());
    }

    [Fact]
    public async Task List_searches_by_code_or_nickname_and_filters_by_status_and_type()
    {
        using var factory = new ApiFactory();
        await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var pico = await CreateDrone(factory, "DABCN0002", "Pico", "Digital");
        await factory.PutAsync($"/api/drones/{Id(pico)}", new { code = "DABCN0002", nickname = "Pico", type = "Digital", status = "InTesting" });
        var client = factory.CreateClient();

        var byNickname = await (await client.GetAsync("/api/drones?search=falc")).ReadJsonAsync();
        var byCode = await (await client.GetAsync("/api/drones?search=0002")).ReadJsonAsync();
        var byStatus = await (await client.GetAsync("/api/drones?status=InTesting")).ReadJsonAsync();
        var byType = await (await client.GetAsync("/api/drones?type=Analog")).ReadJsonAsync();
        var none = await (await client.GetAsync("/api/drones?type=Analog&status=InTesting")).ReadJsonAsync();

        Assert.Equal("Falcon", Assert.Single(byNickname.EnumerateArray()).GetProperty("nickname").GetString());
        Assert.Equal("Pico", Assert.Single(byCode.EnumerateArray()).GetProperty("nickname").GetString());
        Assert.Equal("Pico", Assert.Single(byStatus.EnumerateArray()).GetProperty("nickname").GetString());
        Assert.Equal("Falcon", Assert.Single(byType.EnumerateArray()).GetProperty("nickname").GetString());
        Assert.Empty(none.EnumerateArray());
    }

    [Fact]
    public async Task List_puts_available_drones_first()
    {
        using var factory = new ApiFactory();
        var first = await CreateDrone(factory, "DABCN0001", "Alpha", "Analog");
        await CreateDrone(factory, "DABCN0002", "Bravo", "Analog");
        await factory.PutAsync($"/api/drones/{Id(first)}", new { code = "DABCN0001", nickname = "Alpha", type = "Analog", status = "Unavailable" });

        var list = await (await factory.CreateClient().GetAsync("/api/drones")).ReadJsonAsync();

        Assert.Equal(
            ["Bravo", "Alpha"],
            list.EnumerateArray().Select(item => item.GetProperty("nickname").GetString()).ToArray());
    }

    [Fact]
    public async Task Summary_counts_drones_per_status()
    {
        using var factory = new ApiFactory();
        await CreateDrone(factory, "DABCN0001", "Alpha", "Analog");
        var second = await CreateDrone(factory, "DABCN0002", "Bravo", "Analog");
        await factory.PutAsync($"/api/drones/{Id(second)}", new { code = "DABCN0002", nickname = "Bravo", type = "Analog", status = "NeedsRepair" });

        var summary = await (await factory.CreateClient().GetAsync("/api/drones/summary")).ReadJsonAsync();

        Assert.Equal(2, summary.GetProperty("total").GetInt32());
        Assert.Equal(1, summary.GetProperty("available").GetInt32());
        Assert.Equal(1, summary.GetProperty("needsRepair").GetInt32());
    }

    [Fact]
    public async Task Default_components_endpoint_returns_each_types_parts()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateClient();

        var digital = await (await client.GetAsync("/api/drones/default-components/Digital")).ReadJsonAsync();
        var analog = await (await client.GetAsync("/api/drones/default-components/Analog")).ReadJsonAsync();

        var digitalNames = digital.EnumerateArray().Select(item => item.GetProperty("name").GetString()).ToArray();
        var analogNames = analog.EnumerateArray().Select(item => item.GetProperty("name").GetString()).ToArray();
        Assert.Contains("Digital video unit", digitalNames);
        Assert.Contains("MMCX to SMA adapter cable", analogNames);
        Assert.Contains("Frame", digitalNames);
        Assert.Contains("Frame", analogNames);
    }

    [Fact]
    public async Task Update_changes_identity_and_records_the_status_change()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");

        var response = await factory.PutAsync(
            $"/api/drones/{Id(created)}",
            new { code = "DABCN0009", nickname = "Hawk", type = "Digital", status = "NeedsRepair" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.ReadJsonAsync();
        Assert.Equal("DABCN0009", updated.GetProperty("code").GetString());
        Assert.Equal("Hawk", updated.GetProperty("nickname").GetString());
        Assert.Equal("NeedsRepair", updated.GetProperty("status").GetString());
        Assert.True(
            updated.GetProperty("statusChangedAtUtc").GetDateTimeOffset()
            >= created.GetProperty("statusChangedAtUtc").GetDateTimeOffset());
    }

    [Fact]
    public async Task Update_requires_a_status_and_rejects_a_code_used_by_another_drone()
    {
        using var factory = new ApiFactory();
        await CreateDrone(factory, "DABCN0001", "Alpha", "Analog");
        var second = await CreateDrone(factory, "DABCN0002", "Bravo", "Analog");

        var noStatus = await factory.PutAsync($"/api/drones/{Id(second)}", new { code = "DABCN0002", nickname = "Bravo", type = "Analog" });
        var duplicate = await factory.PutAsync($"/api/drones/{Id(second)}", new { code = "dabcn0001", nickname = "Bravo", type = "Analog", status = "Available" });
        var missing = await factory.PutAsync($"/api/drones/{Guid.NewGuid()}", new { code = "X", nickname = "Y", type = "Analog", status = "Available" });

        Assert.Equal(HttpStatusCode.BadRequest, noStatus.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task ReplaceComponents_swaps_the_list_and_rejects_invalid_quantities()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var url = $"/api/drones/{Id(created)}/components";

        var ok = await factory.PutAsync(url, new
        {
            components = new[]
            {
                new { name = "Frame", detail = (string?)"PT10", quantity = 1 },
                new { name = "Motor", detail = (string?)null, quantity = 4 }
            }
        });
        var bad = await factory.PutAsync(url, new
        {
            components = new[] { new { name = "Motor", detail = (string?)null, quantity = 0 } }
        });

        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        Assert.Equal(["Frame", "Motor"], ComponentNames(await ok.ReadJsonAsync()));
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        Assert.Equal("component.quantity.invalid", (await bad.ReadJsonAsync()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Issues_can_be_reported_and_resolved_with_a_resolution_date()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var id = Id(created);

        var reported = await (await factory.PostAsync(
            $"/api/drones/{id}/issues",
            new { title = "Motor noise", description = "Grinding", componentName = "Motor" })).ReadJsonAsync();
        var issue = Assert.Single(reported.GetProperty("issues").EnumerateArray());
        Assert.Equal("Open", issue.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, issue.GetProperty("resolvedAtUtc").ValueKind);

        var resolved = await (await factory.PutAsync(
            $"/api/drones/{id}/issues/{issue.GetProperty("id").GetString()}",
            new { title = "Motor noise", description = "Replaced", componentName = "Motor", status = "Resolved" })).ReadJsonAsync();
        var done = Assert.Single(resolved.GetProperty("issues").EnumerateArray());
        Assert.Equal("Resolved", done.GetProperty("status").GetString());
        Assert.NotEqual(JsonValueKind.Null, done.GetProperty("resolvedAtUtc").ValueKind);
    }

    [Fact]
    public async Task Issue_endpoints_validate_the_title_and_unknown_ids()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var id = Id(created);

        var noTitle = await factory.PostAsync($"/api/drones/{id}/issues", new { title = " " });
        var noDrone = await factory.PostAsync($"/api/drones/{Guid.NewGuid()}/issues", new { title = "x" });
        var noIssue = await factory.PutAsync($"/api/drones/{id}/issues/{Guid.NewGuid()}", new { title = "x" });

        Assert.Equal(HttpStatusCode.BadRequest, noTitle.StatusCode);
        Assert.Equal("issue.title.required", (await noTitle.ReadJsonAsync()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.NotFound, noDrone.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, noIssue.StatusCode);
    }

    [Fact]
    public async Task Videos_can_be_added_edited_and_removed_and_must_use_https()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var id = Id(created);

        var insecure = await factory.PostAsync($"/api/drones/{id}/videos", new { url = "http://example.com/v" });
        var added = await (await factory.PostAsync(
            $"/api/drones/{id}/videos",
            new { url = "https://example.com/v1", label = "Test 1", testedOn = "2026-11-01" })).ReadJsonAsync();
        var video = Assert.Single(added.GetProperty("videos").EnumerateArray());
        var videoId = video.GetProperty("id").GetString();
        var edited = await (await factory.PutAsync(
            $"/api/drones/{id}/videos/{videoId}",
            new { url = "https://example.com/v2", label = "Test 2" })).ReadJsonAsync();
        var removed = await factory.CreateClient().DeleteAsync($"/api/drones/{id}/videos/{videoId}");

        Assert.Equal(HttpStatusCode.BadRequest, insecure.StatusCode);
        Assert.Equal("video.url.invalid", (await insecure.ReadJsonAsync()).GetProperty("code").GetString());
        Assert.Equal("2026-11-01", video.GetProperty("testedOn").GetString());
        Assert.Equal(
            "https://example.com/v2",
            Assert.Single(edited.GetProperty("videos").EnumerateArray()).GetProperty("url").GetString());
        Assert.Equal(HttpStatusCode.OK, removed.StatusCode);
        Assert.Empty((await removed.ReadJsonAsync()).GetProperty("videos").EnumerateArray());
    }

    [Fact]
    public async Task Removing_an_unknown_video_returns_404()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");

        var response = await factory.CreateClient().DeleteAsync($"/api/drones/{Id(created)}/videos/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task List_reports_component_open_issue_and_video_counts()
    {
        using var factory = new ApiFactory();
        var created = await CreateDrone(factory, "DABCN0001", "Falcon", "Analog");
        var id = Id(created);
        await factory.PostAsync($"/api/drones/{id}/issues", new { title = "One" });
        await factory.PostAsync($"/api/drones/{id}/videos", new { url = "https://example.com/v" });

        var list = await (await factory.CreateClient().GetAsync("/api/drones")).ReadJsonAsync();
        var item = Assert.Single(list.EnumerateArray());

        Assert.Equal(1, item.GetProperty("openIssueCount").GetInt32());
        Assert.Equal(1, item.GetProperty("videoCount").GetInt32());
        Assert.Equal(created.GetProperty("components").GetArrayLength(), item.GetProperty("componentCount").GetInt32());
    }
}
