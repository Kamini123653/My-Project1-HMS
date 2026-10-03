using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await db.Users.Include(u => u.Role).Include(u => u.Department)
            .OrderBy(u => u.FullName).ToListAsync();
        return users.Select(u => new UserDto(u.UserId, u.Username, u.FullName, u.Role.RoleName, u.Email, u.Phone,
            u.Department?.Name, u.IsActive)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Username == req.Username))
            return Conflict(new { message = "Username already exists." });

        var role = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == req.Role);
        if (role is null) return BadRequest(new { message = "Unknown role." });

        var user = new User
        {
            Username = req.Username,
            FullName = req.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 11),
            RoleId = role.RoleId,
            Email = req.Email,
            Phone = req.Phone,
            DepartmentId = req.DepartmentId,
            MustChangePassword = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new UserDto(user.UserId, user.Username, user.FullName, role.RoleName, user.Email, user.Phone, null, user.IsActive));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateUserRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.FullName = req.FullName;
        user.Email = req.Email;
        user.Phone = req.Phone;
        user.IsActive = req.IsActive;
        user.DepartmentId = req.DepartmentId;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, AdminResetPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 11);
        user.MustChangePassword = true;
        await db.SaveChangesAsync();

        return Ok(new { message = $"Password reset for {user.FullName}." });
    }
}
