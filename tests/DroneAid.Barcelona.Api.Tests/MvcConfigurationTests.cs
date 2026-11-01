using System.Text.Json;
using DroneAid.Barcelona.Api.Contracts.Inventory;
using DroneAid.Barcelona.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace DroneAid.Barcelona.Api.Tests;

public sealed class MvcConfigurationTests
{
    [Fact]
    public void Controller_json_options_deserialize_string_enum_values_from_drone_requests()
    {
        var services = new ServiceCollection();
        services.AddDroneAidControllers();
        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JsonOptions>>().Value.JsonSerializerOptions;

        var request = JsonSerializer.Deserialize<CreateDroneRequestRequest>(
            """
            {"configurationId":"digital","quantity":1,"priority":"Normal","reason":"Workshop request","requestedBy":"DAB_Test"}
            """,
            options);

        Assert.NotNull(request);
        Assert.Equal(ComponentRequestPriority.Normal, request.Priority);
        Assert.Equal("digital", request.ConfigurationId);
    }
}
