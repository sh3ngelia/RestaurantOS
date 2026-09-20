namespace RestaurantOS.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public bool IsDeleted { get; protected set; }
    public DateTime? DeletedAt { get; protected set; }

    protected void MarkAsUpdated() => UpdatedAt = DateTime.UtcNow;

    public void SoftDelete()
    {
        if (IsDeleted)
            throw new DomainException("object is already deleted");

        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void Restore()
    {
        IsDeleted = false;
        DeletedAt = null;
        MarkAsUpdated();
    }
}