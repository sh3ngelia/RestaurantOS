using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Order Order { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentMethod Method { get; private set; }
    public Guid? ReceivedByUserId { get; private set; }
    public DateTime PaidAt { get; private set; }
    public string? Notes { get; private set; }

    public Payment(Guid orderId, decimal amount, PaymentMethod method, Guid? receivedByUserId = null, string? notes = null)
    {
        ValidateAmount(amount);
        OrderId = orderId;
        Amount = amount;
        Method = method;
        ReceivedByUserId = receivedByUserId;
        PaidAt = DateTime.UtcNow;
        Notes = notes;
    }

    public void UpdateNotes(string? newNotes)
    {
        Notes = newNotes;
        MarkAsUpdated();
    }

    private static void ValidateAmount(decimal amount)
    {
        if (amount <= 0)
            throw new DomainException("Payment amount must be greater than zero");
    }
}
