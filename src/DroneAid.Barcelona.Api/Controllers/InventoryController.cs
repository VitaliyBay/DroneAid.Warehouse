using DroneAid.Barcelona.Api.Contracts.Inventory;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController(DroneAidDbContext database) : ControllerBase
{
    [HttpGet("component-types")]
    public async Task<ActionResult<IReadOnlyList<ComponentType>>> GetComponentTypes(CancellationToken cancellationToken) =>
        Ok(await database.ComponentTypes.AsNoTracking().OrderBy(item => item.Category).ThenBy(item => item.Name).ToListAsync(cancellationToken));

    [HttpPost("component-types")]
    public async Task<ActionResult<ComponentType>> CreateComponentType(
        CreateComponentTypeRequest request,
        CancellationToken cancellationToken)
    {
        var componentType = new ComponentType
        {
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            ManufacturerOrModel = CleanOptional(request.ManufacturerOrModel),
            PartNumber = CleanOptional(request.PartNumber),
            UnitOfMeasure = request.UnitOfMeasure.Trim(),
            CompatibilityNotes = CleanOptional(request.CompatibilityNotes),
            MinimumQuantityPerBuild = request.MinimumQuantityPerBuild
        };
        database.ComponentTypes.Add(componentType);
        AddAuditEvent("ComponentTypeCreated", request.PerformedBy, "Catalogue entry created.", componentTypeId: componentType.Id);
        await database.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetComponentTypes), componentType);
    }

    [HttpGet("stock")]
    public async Task<ActionResult<IReadOnlyList<ComponentStock>>> GetStock(CancellationToken cancellationToken) =>
        Ok(await database.ComponentStock.AsNoTracking()
            .Include(item => item.ComponentType)
            .OrderBy(item => item.ComponentType.Category)
            .ThenBy(item => item.ComponentType.Name)
            .ThenBy(item => item.ReceivedAtUtc)
            .ToListAsync(cancellationToken));

    [HttpPost("stock/receipts")]
    public async Task<ActionResult<ComponentStock>> ReceiveStock(
        ReceiveStockRequest request,
        CancellationToken cancellationToken)
    {
        if (!await database.ComponentTypes.AnyAsync(item => item.Id == request.ComponentTypeId, cancellationToken))
        {
            return NotFound(new { message = "The selected component type no longer exists." });
        }

        var stock = new ComponentStock
        {
            ComponentTypeId = request.ComponentTypeId,
            Quantity = request.Quantity,
            AvailabilityState = request.AvailabilityState,
            SerialNumberOrBatch = CleanOptional(request.SerialNumberOrBatch),
            SourceReference = CleanOptional(request.SourceReference)
        };
        database.ComponentStock.Add(stock);
        AddAuditEvent("StockReceived", request.PerformedBy, request.Reason, stock.ComponentTypeId, stock.Id);
        await database.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetStock), stock);
    }

    [HttpPost("stock/{stockId:guid}/adjustments")]
    public async Task<ActionResult<ComponentStock>> AdjustStock(
        Guid stockId,
        AdjustStockRequest request,
        CancellationToken cancellationToken)
    {
        if (request.QuantityDelta == 0)
        {
            return BadRequest(new { message = "An adjustment must change the quantity." });
        }

        var stock = await database.ComponentStock.FindAsync([stockId], cancellationToken);
        if (stock is null)
        {
            return NotFound(new { message = "The stock record no longer exists." });
        }

        if (stock.Quantity + request.QuantityDelta < 0)
        {
            return BadRequest(new { message = "The adjustment cannot reduce stock below zero." });
        }

        stock.Quantity += request.QuantityDelta;
        if (stock.Quantity == 0 && stock.AvailabilityState != StockAvailabilityState.ConsumedOrRemoved)
        {
            stock.AvailabilityState = StockAvailabilityState.ConsumedOrRemoved;
        }
        AddAuditEvent("StockAdjusted", request.PerformedBy, request.Reason, stock.ComponentTypeId, stock.Id);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(stock);
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IReadOnlyList<ComponentRequest>>> GetRequests(CancellationToken cancellationToken) =>
        Ok(await database.ComponentRequests.AsNoTracking()
            .Include(item => item.ComponentType)
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken));

    [HttpPost("requests")]
    public async Task<ActionResult<ComponentRequest>> CreateRequest(
        CreateComponentRequestRequest request,
        CancellationToken cancellationToken)
    {
        if (!await database.ComponentTypes.AnyAsync(item => item.Id == request.ComponentTypeId, cancellationToken))
        {
            return NotFound(new { message = "The selected component type no longer exists." });
        }

        var componentRequest = new ComponentRequest
        {
            ComponentTypeId = request.ComponentTypeId,
            RequestedQuantity = request.Quantity,
            Reason = request.Reason.Trim(),
            Priority = request.Priority,
            RequestedBy = request.RequestedBy.Trim(),
            RelatedDroneIdentifier = CleanOptional(request.RelatedDroneIdentifier)
        };
        database.ComponentRequests.Add(componentRequest);
        AddAuditEvent("RequestCreated", request.RequestedBy, componentRequest.Reason, componentRequest.ComponentTypeId, componentRequestId: componentRequest.Id);
        await database.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetRequests), componentRequest);
    }

    [HttpPost("requests/{requestId:guid}/submit")]
    public Task<ActionResult<ComponentRequest>> SubmitRequest(Guid requestId, RequestActionRequest request, CancellationToken cancellationToken) =>
        ChangeRequestStatus(requestId, ComponentRequestStatus.Draft, ComponentRequestStatus.Submitted, "RequestSubmitted", request, cancellationToken);

    [HttpPost("requests/{requestId:guid}/approve")]
    public Task<ActionResult<ComponentRequest>> ApproveRequest(Guid requestId, RequestActionRequest request, CancellationToken cancellationToken) =>
        ChangeRequestStatus(requestId, ComponentRequestStatus.Submitted, ComponentRequestStatus.Approved, "RequestApproved", request, cancellationToken);

    [HttpPost("requests/{requestId:guid}/order")]
    public async Task<ActionResult<ComponentRequest>> OrderRequest(Guid requestId, OrderComponentRequest request, CancellationToken cancellationToken)
    {
        var componentRequest = await database.ComponentRequests.FindAsync([requestId], cancellationToken);
        if (componentRequest is null)
        {
            return NotFound(new { message = "The component request no longer exists." });
        }
        if (componentRequest.Status != ComponentRequestStatus.Approved)
        {
            return Conflict(new { message = "Only approved requests can be marked as ordered." });
        }

        componentRequest.OrderReference = request.OrderReference.Trim();
        componentRequest.Status = ComponentRequestStatus.Ordered;
        AddAuditEvent("RequestOrdered", request.PerformedBy, request.Reason, componentRequest.ComponentTypeId, componentRequestId: componentRequest.Id);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(componentRequest);
    }

    [HttpPost("requests/{requestId:guid}/receipts")]
    public async Task<ActionResult<ComponentRequest>> ReceiveRequest(
        Guid requestId,
        ReceiveComponentRequest request,
        CancellationToken cancellationToken)
    {
        var componentRequest = await database.ComponentRequests.FindAsync([requestId], cancellationToken);
        if (componentRequest is null)
        {
            return NotFound(new { message = "The component request no longer exists." });
        }
        if (componentRequest.Status is not (ComponentRequestStatus.Ordered or ComponentRequestStatus.PartiallyReceived))
        {
            return Conflict(new { message = "Only ordered or partially received requests can receive stock." });
        }

        var stock = new ComponentStock
        {
            ComponentTypeId = componentRequest.ComponentTypeId,
            Quantity = request.Quantity,
            AvailabilityState = request.AvailabilityState,
            SerialNumberOrBatch = CleanOptional(request.SerialNumberOrBatch),
            SourceReference = CleanOptional(request.SourceReference)
        };
        componentRequest.ReceivedQuantity += request.Quantity;
        componentRequest.Status = componentRequest.ReceivedQuantity >= componentRequest.RequestedQuantity
            ? ComponentRequestStatus.Received
            : ComponentRequestStatus.PartiallyReceived;
        database.ComponentStock.Add(stock);
        AddAuditEvent("RequestStockReceived", request.PerformedBy, request.Reason, componentRequest.ComponentTypeId, stock.Id, componentRequest.Id);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(componentRequest);
    }

    private async Task<ActionResult<ComponentRequest>> ChangeRequestStatus(
        Guid requestId,
        ComponentRequestStatus requiredStatus,
        ComponentRequestStatus nextStatus,
        string action,
        RequestActionRequest request,
        CancellationToken cancellationToken)
    {
        var componentRequest = await database.ComponentRequests.FindAsync([requestId], cancellationToken);
        if (componentRequest is null)
        {
            return NotFound(new { message = "The component request no longer exists." });
        }
        if (componentRequest.Status != requiredStatus)
        {
            return Conflict(new { message = $"This request must be {requiredStatus} before it can be {nextStatus}." });
        }

        componentRequest.Status = nextStatus;
        AddAuditEvent(action, request.PerformedBy, request.Reason, componentRequest.ComponentTypeId, componentRequestId: componentRequest.Id);
        await database.SaveChangesAsync(cancellationToken);
        return Ok(componentRequest);
    }

    private void AddAuditEvent(
        string action,
        string performedBy,
        string reason,
        Guid? componentTypeId = null,
        Guid? componentStockId = null,
        Guid? componentRequestId = null) =>
        database.InventoryAuditEvents.Add(new InventoryAuditEvent
        {
            Action = action,
            PerformedBy = performedBy.Trim(),
            Reason = reason.Trim(),
            ComponentTypeId = componentTypeId,
            ComponentStockId = componentStockId,
            ComponentRequestId = componentRequestId
        });

    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
