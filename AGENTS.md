# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a minimal .NET-oriented scaffold. At present,
`README.md` contains the project identity and `.gitignore` defines .NET build
artifacts to exclude; no solution, source projects, or test projects have been
committed yet. Keep the root focused on repository-level files. When adding the
application, use a conventional layout such as `src/DroneAid.Warehouse/` for
production code and `tests/DroneAid.Warehouse.Tests/` for its matching test
project. Put feature code in focused folders or namespaces (for example,
`Inventory/`, `Dispatch/`, and `Infrastructure/`) rather than a catch-all
`Helpers/` directory.

## Build, Test, and Development Commands

Once a solution (`*.sln`) is introduced, run commands from the repository root:

```powershell
dotnet restore                 # Restore NuGet dependencies
dotnet build <solution>.sln    # Compile all projects
dotnet test <solution>.sln     # Run the automated tests
dotnet format <solution>.sln   # Apply .NET formatter and analyzer fixes
```

Do not commit `bin/`, `obj/`, coverage output, NuGet packages, local `.env`
files, or test-result directories; these are already covered by `.gitignore`.
Update this section when the actual solution and any local-run command exist.

## Coding Style & Naming Conventions

Use the repository's `.editorconfig` if one is added; until then, follow
standard C# conventions: four-space indentation, braces on their own lines,
PascalCase for types, public members, and methods, and camelCase for local
variables and parameters. Prefer clear, domain-specific names such as
`WarehouseInventoryService` over abbreviations. Keep nullable-reference and
analyzer warnings addressed rather than suppressing them without explanation.

## Testing Guidelines

Create a test project for each production project and name test files after the
unit under test, e.g. `InventoryReservationServiceTests.cs`. Use descriptive
test names that state behavior, such as
`ReserveAsync_returns_failure_when_stock_is_insufficient`. Tests must be
deterministic, independent, and runnable with `dotnet test`; add regression
coverage for every bug fix.

## Commit & Pull Request Guidelines

The history currently contains only `Initial commit`, so no established commit
format exists. Use concise, imperative messages such as `Add inventory
reservation validation`; keep each commit narrowly scoped. Pull requests should
explain the change and its motivation, link the relevant issue when available,
list validation performed, and include screenshots or API examples for visible
or contract changes. Do not merge with failing builds or unresolved review
comments.
