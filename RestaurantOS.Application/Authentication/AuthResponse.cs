namespace RestaurantOS.Application.Authentication;

public record AuthResponse(string Token, string FullName, string Role);