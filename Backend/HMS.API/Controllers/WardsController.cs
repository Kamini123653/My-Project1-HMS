using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/wards")]
[Authorize]
public class WardsController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WardDto>>> GetAll()
    {
        var wards = await db.Wards.Include(w => w.Beds).Where(w => w.IsActive).ToListAsync();
        return wards.Select(w => new WardDto(w.WardId, w.Name, w.RatePerDay, w.Beds.Count,
            w.Beds.Count(b => b.Status == "Occupied"))).ToList();
    }

    [HttpGet("beds")]
    public async Task<ActionResult<List<BedDto>>> GetBeds([FromQuery] int? wardId, [FromQuery] string? status)
    {
        var query = db.Beds.Include(b => b.Ward).AsQueryable();
        if (wardId.HasValue) query = query.Where(b => b.WardId == wardId);
        if (!string.IsNullOrEmpty(status)) query = query.Where(b => b.Status == status);

        var beds = await query.OrderBy(b => b.Ward.WardId).ThenBy(b => b.BedNumber).ToListAsync();
        return beds.Select(b => new BedDto(b.BedId, b.BedNumber, b.Ward.Name, b.WardId, b.Status)).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<WardDto>> Create(CreateWardRequest req)
    {
        var ward = new Ward { Name = req.Name, RatePerDay = req.RatePerDay };
        db.Wards.Add(ward);
        await db.SaveChangesAsync();

        for (var i = 1; i <= req.BedCount; i++)
        {
            db.Beds.Add(new Bed { WardId = ward.WardId, BedNumber = $"{req.BedPrefix}-{i:D2}", Status = "Available" });
        }
        await db.SaveChangesAsync();

        return Ok(new WardDto(ward.WardId, ward.Name, ward.RatePerDay, req.BedCount, 0));
    }
}
