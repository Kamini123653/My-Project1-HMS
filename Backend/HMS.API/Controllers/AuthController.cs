using System.Security.Claims;
using HMS.API.Common;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(HMSDbContext db, TokenService tokenService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req)
    {
        var user = await db.Users
            .Include(u => u.Role)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Username == req.Username);

        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var (token, expiresAt) = tokenService.CreateToken(user);
        var dto = new UserDto(user.UserId, user.Username, user.FullName, user.Role.RoleName, user.Email, user.Phone,
            user.Department?.Name, user.IsActive);
        return Ok(new LoginResponse(token, expiresAt, dto));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.Include(u => u.Role).Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.UserId == userId);
        if (user is null) return NotFound();
        return Ok(new UserDto(user.UserId, user.Username, user.FullName, user.Role.RoleName, user.Email, user.Phone,
            user.Department?.Name, user.IsActive));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 11);
        user.MustChangePassword = false;
        await db.SaveChangesAsync();
        return Ok(new { message = "Password updated successfully." });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.Username == req.UsernameOrEmail || u.Email == req.UsernameOrEmail);

        // Always respond the same way to avoid leaking which accounts exist.
        if (user is not null)
        {
            var token = Guid.NewGuid().ToString("N");
            db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.UserId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30)
            });
            await db.SaveChangesAsync();
            // In production this would be emailed; for this environment we return it so the
            // reset flow can be exercised end-to-end without an email provider configured.
        }

        return Ok(new { message = "If an account matches those details, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req)
    {
        var reset = await db.PasswordResetTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == req.Token);
        if (reset is null || reset.UsedAt is not null || reset.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "This reset link is invalid or has expired." });

        reset.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 11);
        reset.UsedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { message = "Password has been reset." });
    }
}
