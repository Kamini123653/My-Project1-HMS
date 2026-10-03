namespace HMS.API.Common;

public static class CodeGenerator
{
    private static readonly Random Rng = new();

    public static string NewUHID() => $"UHID-{DateTime.UtcNow:yyyyMMdd}{Rng.Next(100, 999)}";

    public static string NewInvoiceNumber(string prefix) => $"{prefix}-{Rng.Next(10000, 99999)}";

    public static string NewSampleId() => $"SMP-{Rng.Next(1000, 9999)}";

    public static string NewToken(int sequence) => $"A-{sequence}";
}
