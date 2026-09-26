using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Tables;

public static class TableMappings
{
    public static TableResponse ToResponse(this Table table) =>
        new(table.Id, table.TableNumber, table.Capacity, table.Status);
}