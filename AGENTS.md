# Repository Guidelines

## Project Structure & Module Organization

The repository contains an Angular frontend in `src/droneaid-barcelona-web/`,
an ASP.NET Core API in `src/DroneAid.Barcelona.Api/`, and .NET tests in
`tests/DroneAid.Barcelona.Api.Tests/`. `DroneAid.Barcelona.sln` contains the
.NET projects. Keep the root focused on repository-level files and add future
backend projects under `src/` with a matching project under `tests/`. Put
feature code in focused folders or namespaces (for example, `Inventory/`,
`Dispatch/`, and `Infrastructure/`) rather than a catch-all `Helpers/`
directory.

## Build, Test, and Development Commands

Run .NET and Docker commands from the repository root:

```powershell
dotnet restore DroneAid.Barcelona.sln  # Restore NuGet dependencies
dotnet build DroneAid.Barcelona.sln    # Compile the API and tests
dotnet test DroneAid.Barcelona.sln     # Run API tests
dotnet format DroneAid.Barcelona.sln   # Apply .NET formatting
docker compose up --build              # Run web, API, and PostgreSQL locally
```

For frontend checks, run `npm run build` from
`src/droneaid-barcelona-web/`. Copy `.env.example` to `.env` and set its local
database password before using Docker Compose. The Angular UI is then available
at `http://localhost:4200`.

Do not commit `bin/`, `obj/`, coverage output, NuGet packages, local `.env`
files, or test-result directories; these are already covered by `.gitignore`.

## Coding Style & Naming Conventions

Use the repository's `.editorconfig` if one is added; until then, follow
standard C# conventions: four-space indentation, braces on their own lines,
PascalCase for types, public members, and methods, and camelCase for local
variables and parameters. Prefer clear, domain-specific names such as
`WarehouseInventoryService` over abbreviations. Keep nullable-reference and
analyzer warnings addressed rather than suppressing them without explanation.
All user-facing work must be responsive and usable on smartphones, tablets,
laptops, and desktop computers; verify layouts at each of those viewport sizes.

## Testing Guidelines

Create a test project for each production project and name test files after the
unit under test, e.g. `InventoryReservationServiceTests.cs`. Use descriptive
test names that state behavior, such as
`ReserveAsync_returns_failure_when_stock_is_insufficient`. Tests must be
deterministic, independent, and runnable with `dotnet test`; add regression
coverage for every bug fix.

## Documentation Maintenance

Treat documentation as part of the feature change. When changing an existing
feature or its behavior, update the corresponding file in `docs/features/` in
the same change. When implementing a new feature or behavior with no existing
documentation, create a concise feature specification in `docs/features/` and
add it to `docs/README.md`. Put system-design material in
`docs/architecture/`. Include the intended workflow, permissions, key rules,
and open decisions where relevant. Do not leave implemented behavior documented
as planned or omit documentation merely because the implementation is small.
Keep `docs/TODO.md` current: mark completed work, remove invalid items, and add
newly discovered work in the appropriate section.

## Codex Skills and Hooks

Repository-local Codex skills are in `.agents/skills/`; their purpose and
explicit invocation examples are documented in `docs/codex-skills.md`. Use
`$product-discovery` for an unclear feature idea and `$implement-feature` for
approved implementation work. The optional `.githooks/pre-commit` verifies
staged API/test or Angular changes after it is enabled with
`scripts/enable-git-hooks.ps1`.

## Commit & Pull Request Guidelines

The history currently contains only `Initial commit`, so no established commit
format exists. Use concise, imperative messages such as `Add inventory
reservation validation`; keep each commit narrowly scoped. Pull requests should
explain the change and its motivation, link the relevant issue when available,
list validation performed, and include screenshots or API examples for visible
or contract changes. Do not merge with failing builds or unresolved review
comments.
