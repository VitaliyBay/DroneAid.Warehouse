using DroneAid.Barcelona.Api.Contracts.Inventory;
using DroneAid.Barcelona.Api.Controllers;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Tests;

public sealed class InventoryControllerTests
{
    [Fact]
    public async Task ReceiveStock_creates_available_stock_and_an_audit_event()
    {
        await using var database = CreateDatabase();
        var componentType = await CreateComponentType(database);
        var controller = new InventoryController(database);

        var result = await controller.ReceiveStock(new ReceiveStockRequest
        {
            ComponentTypeId = componentType.Id,
            Quantity = 4,
            AvailabilityState = StockAvailabilityState.Available,
            SourceReference = "Donor record D-42",
            PerformedBy = "Coordinator",
            Reason = "Incoming inspection passed."
        }, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var stock = Assert.IsType<ComponentStock>(created.Value);
        Assert.Equal(4, stock.Quantity);
        Assert.Equal(StockAvailabilityState.Available, stock.AvailabilityState);
        var audit = await database.InventoryAuditEvents.SingleAsync();
        Assert.Equal("StockReceived", audit.Action);
        Assert.Equal("Coordinator", audit.PerformedBy);
        Assert.Equal(stock.Id, audit.ComponentStockId);
    }

    [Fact]
    public async Task AdjustStock_rejects_a_change_that_would_make_quantity_negative()
    {
        await using var database = CreateDatabase();
        var componentType = await CreateComponentType(database);
        var stock = new ComponentStock
        {
            ComponentTypeId = componentType.Id,
            Quantity = 2,
            AvailabilityState = StockAvailabilityState.Available
        };
        database.ComponentStock.Add(stock);
        await database.SaveChangesAsync();
        var controller = new InventoryController(database);

        var result = await controller.AdjustStock(stock.Id, new AdjustStockRequest
        {
            QuantityDelta = -3,
            PerformedBy = "Coordinator",
            Reason = "Stocktake correction."
        }, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(2, (await database.ComponentStock.SingleAsync()).Quantity);
    }

    [Fact]
    public async Task ReceiveRequest_tracks_actual_received_quantity_without_changing_the_request()
    {
        await using var database = CreateDatabase();
        var componentType = await CreateComponentType(database);
        var componentRequest = new ComponentRequest
        {
            ComponentTypeId = componentType.Id,
            RequestedQuantity = 4,
            Reason = "Replacement required after inspection.",
            Priority = ComponentRequestPriority.High,
            RequestedBy = "Mentor",
            Status = ComponentRequestStatus.Ordered,
            OrderReference = "PO-105"
        };
        database.ComponentRequests.Add(componentRequest);
        await database.SaveChangesAsync();
        var controller = new InventoryController(database);

        var result = await controller.ReceiveRequest(componentRequest.Id, new ReceiveComponentRequest
        {
            Quantity = 2,
            AvailabilityState = StockAvailabilityState.Quarantined,
            SourceReference = "PO-105",
            PerformedBy = "Coordinator",
            Reason = "Awaiting battery safety check."
        }, CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var receivedRequest = Assert.IsType<ComponentRequest>(response.Value);
        Assert.Equal(4, receivedRequest.RequestedQuantity);
        Assert.Equal(2, receivedRequest.ReceivedQuantity);
        Assert.Equal(ComponentRequestStatus.PartiallyReceived, receivedRequest.Status);
        var stock = await database.ComponentStock.SingleAsync();
        Assert.Equal(StockAvailabilityState.Quarantined, stock.AvailabilityState);
        Assert.Equal(2, stock.Quantity);
        Assert.Contains(await database.InventoryAuditEvents.ToListAsync(), item => item.Action == "RequestStockReceived");
    }

    [Fact]
    public async Task ApproveRequest_rejects_a_draft_request()
    {
        await using var database = CreateDatabase();
        var componentType = await CreateComponentType(database);
        var componentRequest = new ComponentRequest
        {
            ComponentTypeId = componentType.Id,
            RequestedQuantity = 1,
            Reason = "New build.",
            Priority = ComponentRequestPriority.Normal,
            RequestedBy = "Builder"
        };
        database.ComponentRequests.Add(componentRequest);
        await database.SaveChangesAsync();
        var controller = new InventoryController(database);

        var result = await controller.ApproveRequest(componentRequest.Id, new RequestActionRequest
        {
            PerformedBy = "Coordinator",
            Reason = "Reviewed."
        }, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(ComponentRequestStatus.Draft, (await database.ComponentRequests.SingleAsync()).Status);
    }

    private static async Task<ComponentType> CreateComponentType(DroneAidDbContext database)
    {
        var componentType = new ComponentType
        {
            Name = "Flight controller",
            Category = "Flight controller",
            UnitOfMeasure = "each",
            MinimumQuantityPerBuild = 1
        };
        database.ComponentTypes.Add(componentType);
        await database.SaveChangesAsync();
        return componentType;
    }

    private static DroneAidDbContext CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<DroneAidDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new DroneAidDbContext(options);
    }
}
