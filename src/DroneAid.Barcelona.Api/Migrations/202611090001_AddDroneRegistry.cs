using DroneAid.Barcelona.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DroneAid.Barcelona.Api.Migrations;

[DbContext(typeof(DroneAidDbContext))]
[Migration("202611090001_AddDroneRegistry")]
public sealed class AddDroneRegistry : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS drones (
                "Id" uuid NOT NULL PRIMARY KEY,
                "Code" character varying(50) NOT NULL,
                "NormalizedCode" character varying(50) NOT NULL,
                "Nickname" character varying(100) NOT NULL,
                "Type" character varying(20) NOT NULL,
                "Status" character varying(30) NOT NULL,
                "StatusChangedAtUtc" timestamp with time zone NOT NULL,
                "CreatedAtUtc" timestamp with time zone NOT NULL,
                "UpdatedAtUtc" timestamp with time zone NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_drones_NormalizedCode" ON drones ("NormalizedCode");
            CREATE INDEX IF NOT EXISTS "IX_drones_Status_Type" ON drones ("Status", "Type");

            CREATE TABLE IF NOT EXISTS drone_components (
                "Id" uuid NOT NULL PRIMARY KEY,
                "DroneId" uuid NOT NULL REFERENCES drones ("Id") ON DELETE CASCADE,
                "Name" character varying(200) NOT NULL,
                "Detail" character varying(500) NULL,
                "Quantity" integer NOT NULL,
                "SortOrder" integer NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_drone_components_DroneId" ON drone_components ("DroneId");

            CREATE TABLE IF NOT EXISTS drone_issues (
                "Id" uuid NOT NULL PRIMARY KEY,
                "DroneId" uuid NOT NULL REFERENCES drones ("Id") ON DELETE CASCADE,
                "Title" character varying(200) NOT NULL,
                "Description" character varying(2000) NULL,
                "ComponentName" character varying(200) NULL,
                "Status" character varying(20) NOT NULL,
                "ReportedAtUtc" timestamp with time zone NOT NULL,
                "ResolvedAtUtc" timestamp with time zone NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_drone_issues_DroneId" ON drone_issues ("DroneId");

            CREATE TABLE IF NOT EXISTS drone_videos (
                "Id" uuid NOT NULL PRIMARY KEY,
                "DroneId" uuid NOT NULL REFERENCES drones ("Id") ON DELETE CASCADE,
                "Url" character varying(2000) NOT NULL,
                "Label" character varying(200) NULL,
                "TestedOn" date NULL,
                "AddedAtUtc" timestamp with time zone NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_drone_videos_DroneId" ON drone_videos ("DroneId");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DROP TABLE IF EXISTS drone_videos;
            DROP TABLE IF EXISTS drone_issues;
            DROP TABLE IF EXISTS drone_components;
            DROP TABLE IF EXISTS drones;
            """);
    }
}
