using System.Net;

namespace DroneAid.Barcelona.Api.IntegrationTests;

public sealed class HealthAndAuthenticationTests
{
    [Fact]
    public async Task Health_endpoint_reports_healthy()
    {
        using var factory = new ApiFactory();

        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("healthy", (await response.ReadJsonAsync()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Login_succeeds_for_the_seeded_user_ignoring_case_and_padding()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/auth/login", new { userName = " dab_test ", password = "qwerty123" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.ReadJsonAsync();
        Assert.Equal("DAB_Test", body.GetProperty("userName").GetString());
        Assert.Equal("Administrator", body.GetProperty("role").GetString());
    }

    [Fact]
    public async Task Login_rejects_a_wrong_password_with_a_stable_error_code()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/auth/login", new { userName = "DAB_Test", password = "wrong" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("auth.invalid", (await response.ReadJsonAsync()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Login_rejects_an_unknown_user()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/auth/login", new { userName = "nobody", password = "qwerty123" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_rejects_a_request_without_a_password()
    {
        using var factory = new ApiFactory();

        var response = await factory.PostAsync("/api/auth/login", new { userName = "DAB_Test" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
