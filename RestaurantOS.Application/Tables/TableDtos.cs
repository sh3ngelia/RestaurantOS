using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Tables;

public record TableResponse(Guid Id, int TableNumber, int Capacity, TableStatus Status);

public record CreateTableRequest(int TableNumber, int Capacity);
public record UpdateTableRequest(int TableNumber, int Capacity);