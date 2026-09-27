using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Tables;

public static class TableMappings
{
    public static TableResponse ToResponse(
        this Table table,
        TableStatus? effectiveStatus = null,
        TableReservationInfo? nextReservation = null) =>
        new(
            table.Id,
            table.TableNumber,
            table.Capacity,
            effectiveStatus ?? table.Status,
            table.Status == TableStatus.Reserved,
            nextReservation);
}