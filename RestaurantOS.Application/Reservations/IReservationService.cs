namespace RestaurantOS.Application.Reservations;

public interface IReservationService
{
    Task<IReadOnlyList<ReservationResponse>> GetInRangeAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken = default);
    Task<ReservationResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReservationResponse> CreateAsync(CreateReservationRequest request, CancellationToken cancellationToken = default);
    Task<ReservationResponse> UpdateGuestInfoAsync(Guid id, UpdateReservationGuestInfoRequest request, CancellationToken cancellationToken = default);
    Task<ReservationResponse> RescheduleAsync(Guid id, RescheduleReservationRequest request, CancellationToken cancellationToken = default);
    Task<ReservationResponse> ConfirmAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReservationResponse> ArriveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReservationResponse> CancelAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReservationResponse> MarkNoShowAsync(Guid id, CancellationToken cancellationToken = default);
}