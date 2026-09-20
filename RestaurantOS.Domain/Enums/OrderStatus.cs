namespace RestaurantOS.Domain.Enums;

public enum OrderStatus
{
    Opened = 1,
    SentToKitchen = 2,
    InProgress = 3,
    Ready = 4,
    Served = 5,
    Closed = 6,
    Cancelled = 7
}
