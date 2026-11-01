using DroneAid.Barcelona.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DroneAid.Barcelona.Api.Migrations;

[DbContext(typeof(DroneAidDbContext))]
[Migration("202611020001_AddDroneRequests")]
public sealed class AddDroneRequests : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS drone_requests (
                "Id" uuid NOT NULL PRIMARY KEY,
                "ConfigurationId" character varying(30) NOT NULL,
                "ConfigurationName" character varying(100) NOT NULL,
                "Quantity" numeric(12,3) NOT NULL,
                "Reason" character varying(1000) NOT NULL,
                "Priority" character varying(20) NOT NULL,
                "RequestedBy" character varying(100) NOT NULL,
                "DonorReference" character varying(200) NULL,
                "Status" character varying(30) NOT NULL,
                "CreatedAtUtc" timestamp with time zone NOT NULL
            );
            """);
        migrationBuilder.Sql(
            "CREATE INDEX IF NOT EXISTS \"IX_drone_requests_ConfigurationId_Status\" ON drone_requests (\"ConfigurationId\", \"Status\");");
        migrationBuilder.Sql(
            "ALTER TABLE inventory_audit_events ADD COLUMN IF NOT EXISTS \"DroneRequestId\" uuid NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS drone_requests;");
        migrationBuilder.Sql("ALTER TABLE inventory_audit_events DROP COLUMN IF EXISTS \"DroneRequestId\";");
    }
}
