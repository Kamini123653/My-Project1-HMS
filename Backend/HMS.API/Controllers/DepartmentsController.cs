using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController(HMSDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll()
    {
        var depts = await db.Departments
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.DepartmentId, d.Name, d.ConsultationFee, d.IsActive, d.Doctors.Count))
            .ToListAsync();
        return depts;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> Create(CreateDepartmentRequest req)
    {
        var dept = new Department { Name = req.Name, ConsultationFee = req.ConsultationFee };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return Ok(new DepartmentDto(dept.DepartmentId, dept.Name, dept.ConsultationFee, dept.IsActive, 0));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateDepartmentRequest req)
    {
        var dept = await db.Departments.FindAsync(id);
        if (dept is null) return NotFound();
        dept.Name = req.Name;
        dept.ConsultationFee = req.ConsultationFee;
        dept.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
