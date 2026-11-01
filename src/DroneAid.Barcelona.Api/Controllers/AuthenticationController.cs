using DroneAid.Barcelona.Api.Contracts.Authentication;
using DroneAid.Barcelona.Api.Data;
using DroneAid.Barcelona.Api.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DroneAid.Barcelona.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthenticationController(DroneAidDbContext database) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedUserName = request.UserName.Trim().ToUpperInvariant();
        var user = await database.Users.SingleOrDefaultAsync(
            item => item.NormalizedUserName == normalizedUserName,
            cancellationToken);

        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        {
            return Unauthorized(new { message = "The username or password is incorrect." });
        }

        return Ok(new LoginResponse(user.UserName, user.Role));
    }
}
