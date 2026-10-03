using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantOS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreparationStation",
                table: "MenuItems");

            migrationBuilder.RenameColumn(
                name: "Station",
                table: "OrderItems",
                newName: "StationType");

            migrationBuilder.AddColumn<bool>(
                name: "FiresImmediately",
                table: "OrderItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "StationId",
                table: "OrderItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "StationName",
                table: "OrderItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "StationId",
                table: "MenuItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Stations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    FiresImmediately = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_StationId_Status",
                table: "OrderItems",
                columns: new[] { "StationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_StationId",
                table: "MenuItems",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_Stations_Name",
                table: "Stations",
                column: "Name",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_Stations_StationId",
                table: "MenuItems",
                column: "StationId",
                principalTable: "Stations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_Stations_StationId",
                table: "MenuItems");

            migrationBuilder.DropTable(
                name: "Stations");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_StationId_Status",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_MenuItems_StationId",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "FiresImmediately",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "StationId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "StationName",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "StationId",
                table: "MenuItems");

            migrationBuilder.RenameColumn(
                name: "StationType",
                table: "OrderItems",
                newName: "Station");

            migrationBuilder.AddColumn<int>(
                name: "PreparationStation",
                table: "MenuItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
