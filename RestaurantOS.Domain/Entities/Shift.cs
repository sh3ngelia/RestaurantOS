using RestaurantOS.Domain.Common;

namespace RestaurantOS.Domain.Entities;

public class Shift : BaseEntity
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public DateTime? ActualStartTime { get; private set; }
    public DateTime? ActualEndTime { get; private set; }
    public string? Notes { get; private set; }

    public Shift(Guid userId, DateTime startTime, DateTime endTime, string? notes = null)
    {
        ValidateShiftTimes(startTime, endTime);
        UserId = userId;
        StartTime = startTime;
        EndTime = endTime;
        Notes = notes;
    }

    public bool IsActive => ActualStartTime.HasValue && !ActualEndTime.HasValue;
    public TimeSpan? ActualDuration => ActualEndTime - ActualStartTime;

    public void ClockIn()
    {
        if (ActualStartTime.HasValue)
            throw new DomainException("Shift has already been clocked in.");
        ActualStartTime = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void ClockOut()
    {
        if (!ActualStartTime.HasValue)
            throw new DomainException("Shift has not been clocked in.");
        if (ActualEndTime.HasValue)
            throw new DomainException("Shift has already been clocked out.");
        ActualEndTime = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Reschedule(DateTime newStartTime, DateTime newEndTime)
    {
        if (ActualStartTime.HasValue)
            throw new DomainException("Cannot reschedule a shift that has already started");
        ValidateShiftTimes(newStartTime, newEndTime);
        StartTime = newStartTime;
        EndTime = newEndTime;
        MarkAsUpdated();
    }

    public void UpdateNotes(string? newNotes)
    {
        Notes = newNotes;
        MarkAsUpdated();
    }
    
    private static void ValidateShiftTimes(DateTime newStartTime, DateTime newEndTime)
    {
        if (newEndTime <= newStartTime)
            throw new DomainException("End time must be after start time");
    }
}
