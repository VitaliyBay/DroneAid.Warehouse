using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DroneAid.Barcelona.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace DroneAid.Barcelona.Api.IntegrationTests;

/// <summary>
/// Hosts the real API pipeline (routing, model binding, JSON, controllers, seeding) over an
/// isolated in-memory database, so every test starts from the same seeded state.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = Guid.NewGuid().ToString();

    public static JsonSerializerOptions Json { get; } = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:DroneAidDatabase", "Host=not-used");
        builder.ConfigureServices(services =>
        {
            foreach (var descriptor in services
                         .Where(item => item.ServiceType == typeof(DbContextOptions<DroneAidDbContext>)
                             || item.ServiceType == typeof(IDbContextOptionsConfiguration<DroneAidDbContext>))
                         .ToList())
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<DroneAidDbContext>(options => options.UseInMemoryDatabase(databaseName));
        });
    }

    public Task<HttpResponseMessage> PostAsync<T>(string url, T body) =>
        CreateClient().PostAsJsonAsync(url, body, Json);

    public Task<HttpResponseMessage> PutAsync<T>(string url, T body) =>
        CreateClient().PutAsJsonAsync(url, body, Json);
}

public static class HttpExtensions
{
    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(ApiFactory.Json);
}
