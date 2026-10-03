using HMS.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

public record MedicineOptionDto(int MedicineId, string Name, string Unit);

[ApiController]
[Route("api/medicines")]
[Authorize]
public class MedicinesController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MedicineOptionDto>>> GetAll() =>
        await db.Medicines.Where(m => m.IsActive).OrderBy(m => m.Name)
            .Select(m => new MedicineOptionDto(m.MedicineId, m.Name, m.Unit)).ToListAsync();
}
