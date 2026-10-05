using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Realtime;

[Authorize]
public class KitchenHub : Hub
{
    public const string PassGroup = "pass";
    public const string FloorGroup = "floor";
    public static string StationGroup(Guid stationId) => $"station:{stationId}";

    private const string ProductionRoles = $"{nameof(UserRole.Kitchen)},{nameof(UserRole.Bar)},{nameof(UserRole.Manager)}";

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        if (user is not null &&
            (user.IsInRole(nameof(UserRole.Waiter)) ||
             user.IsInRole(nameof(UserRole.Host)) ||
             user.IsInRole(nameof(UserRole.Manager))))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, FloorGroup);
        }

        await base.OnConnectedAsync();
    }

    [Authorize(Roles = ProductionRoles)]
    public Task JoinStation(Guid stationId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, StationGroup(stationId));

    [Authorize(Roles = ProductionRoles)]
    public Task LeaveStation(Guid stationId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, StationGroup(stationId));

    [Authorize(Roles = ProductionRoles)]
    public Task JoinPass() =>
        Groups.AddToGroupAsync(Context.ConnectionId, PassGroup);

    [Authorize(Roles = ProductionRoles)]
    public Task LeavePass() =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, PassGroup);
}