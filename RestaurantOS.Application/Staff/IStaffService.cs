namespace RestaurantOS.Application.Staff;

public interface IStaffService
{
    Task<IReadOnlyList<StaffResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<StaffResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StaffResponse> CreateAsync(CreateStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffResponse> UpdateProfileAsync(Guid id, UpdateStaffProfileRequest request, CancellationToken cancellationToken = default);
    Task<StaffResponse> ChangeRoleAsync(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken = default);
    Task<StaffResponse> DeactivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StaffResponse> ActivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken = default);
}