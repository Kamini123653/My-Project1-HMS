using System.Security.Claims;
using System.Text.Json;
using HMS.API.Common;
using HMS.API.Data;
using HMS.API.DTOs;
using HMS.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/lab")]
[Authorize]
public class LabController(HMSDbContext db) : ControllerBase
{
    [HttpGet("catalog")]
    public async Task<ActionResult<List<TestCatalogDto>>> Catalog() =>
        await db.TestCatalogs.Where(t => t.IsActive)
            .Select(t => new TestCatalogDto(t.TestId, t.Name, t.Type, t.Price)).ToListAsync();

    [HttpGet("queue")]
    public async Task<ActionResult<List<TestOrderDto>>> Queue([FromQuery] string? status)
    {
        var query = db.TestOrders.Include(o => o.Patient).Include(o => o.Doctor).ThenInclude(d => d.User)
            .Include(o => o.Test).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(o => o.Status == status);

        var list = await query.OrderByDescending(o => o.OrderedAt).ToListAsync();
        return list.Select(ToDto).ToList();
    }

    [HttpPost("{orderId:int}/collect")]
    [Authorize(Roles = "Lab,Admin")]
    public async Task<IActionResult> Collect(int orderId)
    {
        var order = await db.TestOrders.FindAsync(orderId);
        if (order is null) return NotFound();
        if (order.Status != "Pending") return BadRequest(new { message = "Sample already collected." });

        order.Status = "Collected";
        order.SampleId = CodeGenerator.NewSampleId();
        order.CollectedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { message = $"Sample marked as collected. Sample ID {order.SampleId} generated.", sampleId = order.SampleId });
    }

    [HttpPost("{orderId:int}/result")]
    [Authorize(Roles = "Lab,Admin")]
    public async Task<IActionResult> SaveResult(int orderId, SaveTestResultRequest req)
    {
        var order = await db.TestOrders.FindAsync(orderId);
        if (order is null) return NotFound();
        if (order.Status != "Collected") return BadRequest(new { message = "Sample has not been collected yet." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        db.TestResults.Add(new TestResult
        {
            OrderId = orderId,
            ResultData = JsonSerializer.Serialize(req.Parameters),
            EnteredByUserId = userId
        });
        order.Status = "ResultReady";
        await db.SaveChangesAsync();
        return Ok(new { message = "Results saved. Report generated and doctor notified." });
    }

    [HttpGet("{orderId:int}/result")]
    public async Task<ActionResult<TestResultDto>> GetResult(int orderId)
    {
        var order = await db.TestOrders.Include(o => o.Test).Include(o => o.Doctor).ThenInclude(d => d.User)
            .Include(o => o.Result).FirstOrDefaultAsync(o => o.OrderId == orderId);
        if (order is null) return NotFound();

        return new TestResultDto(order.OrderId, order.Test.Name, order.Test.Type, order.Status,
            order.Result?.ResultData, order.Result?.EnteredAt, order.Doctor.User.FullName);
    }

    private static TestOrderDto ToDto(TestOrder o) => new(o.OrderId, o.Patient.FullName, o.PatientId, o.Test.Name,
        o.Test.Type, o.Doctor.User.FullName, o.Status, o.SampleId, o.OrderedAt);
}
