namespace HMS.API.DTOs;

public record TestOrderDto(int OrderId, string PatientName, int PatientId, string TestName, string Type,
    string OrderedBy, string Status, string? SampleId, DateTime OrderedAt);

public record TestResultDto(int OrderId, string TestName, string Type, string Status, string? ResultData,
    DateTime? EnteredAt, string OrderedBy);

public record SaveTestResultRequest(Dictionary<string, string> Parameters);
public record TestCatalogDto(int TestId, string Name, string Type, decimal Price);
