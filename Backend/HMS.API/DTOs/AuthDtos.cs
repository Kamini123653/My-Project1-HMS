namespace HMS.API.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);

public record UserDto(int UserId, string Username, string FullName, string Role, string? Email, string? Phone, string? Department, bool IsActive);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record ForgotPasswordRequest(string UsernameOrEmail);
public record ResetPasswordRequest(string Token, string NewPassword);

public record CreateUserRequest(string Username, string FullName, string Password, string Role, string? Email, string? Phone, int? DepartmentId);
public record UpdateUserRequest(string FullName, string? Email, string? Phone, bool IsActive, int? DepartmentId);
public record AdminResetPasswordRequest(string NewPassword);
