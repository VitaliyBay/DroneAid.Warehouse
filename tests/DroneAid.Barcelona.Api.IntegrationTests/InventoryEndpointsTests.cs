using System.Net;

namespace DroneAid.Barcelona.Api.IntegrationTests;

public sealed class InventoryEndpointsTests
{
    private static async Task<string> CreateComponentType(ApiFactory factory, string name = "Test gimbal")
    {
        var response = await factory.PostAsync("/api/inventory/component-types", new
        {
            name,
            category = "Payload",
            unitOfMeasure = "each",
            minimumQuantityPerBuild = 1,
            performedBy = "tester"
        });
        Assert.True(response.StatusCode == HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        return (await response.ReadJsonAsync()).GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task Component_catalogue_is_seeded_from_the_standard_configurations()
    {
        using var factory = new ApiFactory();

        var types = await (await factory.CreateClient().GetAsync("/api/inventory/component-types")).ReadJsonAsync();

        var names = types.EnumerateArray().Select(item => item.GetProperty("name").GetString()).ToArray();
        Assert.Contains("Frame", names);
        Assert.Contains("Digital video unit", names);
        Assert.Contains("Analog camera", names);
    }

    [Fact]
    public async Task Creating_a_component_type_returns_201_and_validates_the_payload()
    {
        using var factory = new ApiFactory();

        var created = await CreateComponentType(factory);
        var invalid = await factory.PostAsync(
            "/api/inventory/component-types",
            new { name = "", category = "x", unitOfMeasure = "each", minimumQuantityPerBuild = 1, performedBy = "t" });

        Assert.NotEmpty(created);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task Receiving_stock_adds_stock_and_unknown_types_return_404()
    {
        using var factory = new ApiFactory();
        var typeId = await CreateComponentType(factory);

        var received = await factory.PostAsync(
            "/api/inventory/stock/receipts",
            new { componentTypeId = typeId, quantity = 5, performedBy = "t", reason = "Delivery" });
        var unknown = await factory.PostAsync(
            "/api/inventory/stock/receipts",
            new { componentTypeId = Guid.NewGuid(), quantity = 5, performedBy = "t", reason = "Delivery" });
        var stock = await (await factory.CreateClient().GetAsync("/api/inventory/stock")).ReadJsonAsync();

        Assert.Equal(HttpStatusCode.Created, received.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal(5, Assert.Single(stock.EnumerateArray()).GetProperty("quantity").GetDecimal());
    }

    [Fact]
    public async Task Build_capacity_lists_both_configurations_and_counts_available_stock()
    {
        using var factory = new ApiFactory();
        var client = factory.CreateClient();
        var types = await (await client.GetAsync("/api/inventory/component-types")).ReadJsonAsync();
        var frame = types.EnumerateArray()
            .Single(item => item.GetProperty("name").GetString() == "Frame")
            .GetProperty("id").GetString();
        await factory.PostAsync(
            "/api/inventory/stock/receipts",
            new { componentTypeId = frame, quantity = 3, performedBy = "t", reason = "Delivery" });

        var capacity = await (await client.GetAsync("/api/inventory/build-capacity")).ReadJsonAsync();

        Assert.Equal(
            ["digital", "analog"],
            capacity.EnumerateArray().Select(item => item.GetProperty("configurationId").GetString()).ToArray());
        var digital = capacity.EnumerateArray().First();
        var frameLine = digital.GetProperty("components").EnumerateArray()
            .Single(item => item.GetProperty("componentName").GetString() == "Frame");
        Assert.Equal(3, frameLine.GetProperty("availableQuantity").GetDecimal());
        Assert.Equal(0, digital.GetProperty("availableBuilds").GetInt32());
    }

    [Fact]
    public async Task Component_request_moves_through_submit_approve_order_and_receipt()
    {
        using var factory = new ApiFactory();
        var typeId = await CreateComponentType(factory);
        var created = await factory.PostAsync(
            "/api/inventory/requests",
            new { componentTypeId = typeId, quantity = 4, reason = "Need parts", priority = "Normal", requestedBy = "tester" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var requestId = (await created.ReadJsonAsync()).GetProperty("id").GetString();
        var action = new { performedBy = "tester", reason = "ok" };

        var outOfOrder = await factory.PostAsync($"/api/inventory/requests/{requestId}/approve", action);
        var submitted = await factory.PostAsync($"/api/inventory/requests/{requestId}/submit", action);
        var approved = await factory.PostAsync($"/api/inventory/requests/{requestId}/approve", action);
        var ordered = await factory.PostAsync(
            $"/api/inventory/requests/{requestId}/order",
            new { orderReference = "PO-1", performedBy = "t", reason = "ordered" });
        var partial = await (await factory.PostAsync(
            $"/api/inventory/requests/{requestId}/receipts",
            new { quantity = 1, performedBy = "t", reason = "first box" })).ReadJsonAsync();
        var full = await (await factory.PostAsync(
            $"/api/inventory/requests/{requestId}/receipts",
            new { quantity = 3, performedBy = "t", reason = "rest" })).ReadJsonAsync();

        Assert.Equal(HttpStatusCode.Conflict, outOfOrder.StatusCode);
        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        Assert.Equal("Ordered", (await ordered.ReadJsonAsync()).GetProperty("status").GetString());
        Assert.Equal("PartiallyReceived", partial.GetProperty("status").GetString());
        Assert.Equal("Received", full.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Request_actions_return_404_for_unknown_requests()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync(
            $"/api/inventory/requests/{Guid.NewGuid()}/submit",
            new { performedBy = "t", reason = "r" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Drone_requests_accept_known_configurations_and_reject_unknown_ones()
    {
        using var factory = new ApiFactory();

        var ok = await factory.PostAsync(
            "/api/inventory/drone-requests",
            new { configurationId = "digital", quantity = 2, reason = "Donor order", priority = "High", requestedBy = "tester" });
        var bad = await factory.PostAsync(
            "/api/inventory/drone-requests",
            new { configurationId = "hybrid", quantity = 1, reason = "x", requestedBy = "t" });
        var list = await (await factory.CreateClient().GetAsync("/api/inventory/drone-requests")).ReadJsonAsync();

        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var item = Assert.Single(list.EnumerateArray());
        Assert.Equal("Digital drone", item.GetProperty("configurationName").GetString());
        Assert.Equal("High", item.GetProperty("priority").GetString());
    }
}
