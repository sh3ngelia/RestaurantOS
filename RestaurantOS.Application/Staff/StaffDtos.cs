using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Staff;

public record StaffResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt);

public record CreateStaffRequest(string FirstName, string LastName, string Email, string Password, UserRole Role);
public record UpdateStaffProfileRequest(string FirstName, string LastName, string Email);
public record ChangeRoleRequest(UserRole Role);
public record ResetPasswordRequest(string NewPassword);