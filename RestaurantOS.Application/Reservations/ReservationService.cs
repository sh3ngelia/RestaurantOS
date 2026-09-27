using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Reservations;

public class ReservationService : IReservationService
{
    private static readonly TimeSpan BookingWindow = ReservationPolicy.BookingWindow;

    private readonly IReservationRepository _reservationRepository;
    private readonly ITableRepository _tableRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateReservationRequest> _createValidator;
    private readonly IValidator<UpdateReservationGuestInfoRequest> _guestInfoValidator;
    private readonly IValidator<RescheduleReservationRequest> _rescheduleValidator;

    public ReservationService(
        IReservationRepository reservationRepository,
        ITableRepository tableRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IValidator<CreateReservationRequest> createValidator,
        IValidator<UpdateReservationGuestInfoRequest> guestInfoValidator,
        IValidator<RescheduleReservationRequest> rescheduleValidator)
    {
        _reservationRepository = reservationRepository;
        _tableRepository = tableRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
        _guestInfoValidator = guestInfoValidator;
        _rescheduleValidator = rescheduleValidator;
    }

    public async Task<IReadOnlyList<ReservationResponse>> GetInRangeAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken cancellationToken = default)
    {
        if (to <= from)
            throw new DomainException("'to' must be after 'from'.");

        var reservations = await _reservationRepository.GetInRangeAsync(from.UtcDateTime, to.UtcDateTime, cancellationToken);
        return reservations.Select(r => r.ToResponse()).ToList();
    }

    public async Task<ReservationResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reservation = await GetReservationOrThrowAsync(id, cancellationToken);
        return reservation.ToResponse();
    }

    public async Task<ReservationResponse> CreateAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var table = await _tableRepository.GetByIdAsync(request.TableId, cancellationToken)
            ?? throw new NotFoundException("Table", request.TableId);

        EnsureCapacity(table, request.GuestCount);

        var timeUtc = request.ReservationTime.UtcDateTime;

        if (await _reservationRepository.HasOverlapAsync(table.Id, timeUtc, BookingWindow, cancellationToken: cancellationToken))
            throw new ConflictException($"Table {table.TableNumber} is already booked around that time.");

        var reservation = new Reservation(
            table.Id,
            request.GuestName.Trim(),
            request.GuestPhoneNumber.Trim(),
            request.GuestCount,
            timeUtc,
            request.Notes,
            createdByUserId: _currentUser.UserId);

        _reservationRepository.Add(reservation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return reservation.ToResponse() with { TableNumber = table.TableNumber };
    }

    public async Task<ReservationResponse> UpdateGuestInfoAsync(
        Guid id,
        UpdateReservationGuestInfoRequest request,
        CancellationToken cancellationToken = default)
    {
        await _guestInfoValidator.ValidateAndThrowAsync(request, cancellationToken);

        var reservation = await GetReservationOrThrowAsync(id, cancellationToken);
        EnsureCapacity(reservation.Table, request.GuestCount);

        reservation.UpdateGuestInfo(request.GuestName.Trim(), request.GuestPhoneNumber.Trim(), request.GuestCount);
        reservation.UpdateNotes(request.Notes);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return reservation.ToResponse();
    }

    public async Task<ReservationResponse> RescheduleAsync(
        Guid id,
        RescheduleReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        await _rescheduleValidator.ValidateAndThrowAsync(request, cancellationToken);

        var reservation = await GetReservationOrThrowAsync(id, cancellationToken);
        var timeUtc = request.ReservationTime.UtcDateTime;

        if (await _reservationRepository.HasOverlapAsync(reservation.TableId, timeUtc, BookingWindow, id, cancellationToken))
            throw new ConflictException($"Table {reservation.Table.TableNumber} is already booked around that time.");

        reservation.Reschedule(timeUtc);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return reservation.ToResponse();
    }

    public Task<ReservationResponse> ConfirmAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, r => r.Confirm(), cancellationToken);

    public Task<ReservationResponse> CancelAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, r => r.Cancel(), cancellationToken);

    public Task<ReservationResponse> MarkNoShowAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, r => r.MarkAsNoShow(), cancellationToken);

public async Task<ReservationResponse> ArriveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reservation = await GetReservationOrThrowAsync(id, cancellationToken);

        reservation.MarkAsArrived();
        reservation.Table.Occupy();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return reservation.ToResponse();
    }

    private async Task<ReservationResponse> ChangeStatusAsync(
        Guid id,
        Action<Reservation> change,
        CancellationToken cancellationToken)
    {
        var reservation = await GetReservationOrThrowAsync(id, cancellationToken);
        change(reservation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return reservation.ToResponse();
    }

    private async Task<Reservation> GetReservationOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _reservationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Reservation", id);

    private static void EnsureCapacity(Table table, int guestCount)
    {
        if (guestCount > table.Capacity)
            throw new DomainException($"Table {table.TableNumber} seats only {table.Capacity} guests.");
    }
}