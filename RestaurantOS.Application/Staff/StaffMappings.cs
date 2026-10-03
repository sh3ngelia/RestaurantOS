using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Staff;

public static class StaffMappings
{
    public static StaffResponse ToStaffResponse(this User user) =>
        new(user.Id, user.FirstName, user.LastName, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt);
}