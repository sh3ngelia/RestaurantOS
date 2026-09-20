using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Table: BaseEntity
{
    public int TableNumber { get; private set; }
    public int Capacity { get; private set; }
    public TableStatus Status { get; private set; }

    public Table(int tableNumber, int capacity)
    {
        if (tableNumber <= 0)
            throw new DomainException("Table number must be greater than zero");
        if (capacity <= 0)
            throw new DomainException("Capacity must be greater than zero");
        TableNumber = tableNumber;
        Capacity = capacity;
        Status = TableStatus.Available;
    }

    public void Occupy()
    {
        if (Status != TableStatus.Available && Status != TableStatus.Reserved)
            throw new DomainException("Only available and reserved tables can be occupied");
        Status = TableStatus.Occupied;
        MarkAsUpdated();
    }
    
    public void Reserve()
    {
        if (Status != TableStatus.Available)
            throw new DomainException("Only available tables can be reserved");
        Status = TableStatus.Reserved;
        MarkAsUpdated();
    }

    public void Free()
    {
        if (Status == TableStatus.Available)
            throw new DomainException("Table is already available");
        Status = TableStatus.Available;
        MarkAsUpdated();
    }
}
