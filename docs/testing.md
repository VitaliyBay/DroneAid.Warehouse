# Testing

Four layers of automated checks protect the application. Run all of them before
merging a change; each is fast enough to run often.

| Layer | What it proves | Where | Command |
| --- | --- | --- | --- |
| API unit tests | Controller and helper logic in isolation | `tests/DroneAid.Barcelona.Api.Tests` | `dotnet test DroneAid.Barcelona.sln` |
| API integration tests | The real HTTP contract: routing, JSON, status codes, error codes, validation, seeding | `tests/DroneAid.Barcelona.Api.IntegrationTests` | `dotnet test DroneAid.Barcelona.sln` |
| Angular unit tests | Part mapping and the drone diagram component | `src/droneaid-barcelona-web/src/**/*.spec.ts` | `npm test -- --watch=false --browsers=ChromeHeadless` (from the web folder) |
| End-to-end tests | The whole system in a real browser: web, API, and PostgreSQL | `e2e/` (Playwright) | `./scripts/run-e2e.ps1` |

## API integration tests

- `ApiFactory` starts the real application with `WebApplicationFactory<Program>`
  and replaces PostgreSQL with an isolated in-memory database, so no Docker is
  needed and every test starts from the same seeded state (user `DAB_Test`,
  component catalogue).
- Tests call endpoints over HTTP and assert status codes, stable error `code`
  values (the web app translates these), and response shapes. They cover health,
  login, every `api/drones` endpoint, and the `api/inventory` endpoints.
- The in-memory provider does not enforce PostgreSQL specifics (raw-SQL
  migrations, column types). The end-to-end layer covers those against the real
  database.
- Add a test here for every new endpoint or error code, and a regression test for
  every bug fix (see `CultureIndependenceTests` for an example).

## End-to-end tests

`./scripts/run-e2e.ps1` builds and starts a **disposable** Docker stack as the
Compose project `droneaid-e2e` (web on `http://localhost:4210`, its own database
volume), waits for the API, runs the Playwright tests, and then deletes the stack
and its data. The development stack on port 4200 and its database are never
touched, so it is safe to run while `docker compose up` is running.

```powershell
./scripts/run-e2e.ps1                                         # everything, then clean up
./scripts/run-e2e.ps1 -PlaywrightArgs '-g','diagram'          # only tests matching "diagram"
./scripts/run-e2e.ps1 -PlaywrightArgs '--headed'              # watch the browser
./scripts/run-e2e.ps1 -KeepStack                              # leave the stack up to debug
./scripts/run-e2e.ps1 -NoStack                                # reuse a running stack (E2E_BASE_URL)
./scripts/run-e2e.ps1 -Down                                   # remove a kept stack
```

Requirements: Docker Desktop running, Node.js, and Google Chrome (Playwright uses
the installed Chrome; set `E2E_BROWSER_CHANNEL` to use another channel). The first
run installs the packages in `e2e/`. After a failure, open the report with
`npx playwright show-report` from `e2e/` (screenshots and traces are kept for
failed tests).

What the suite covers:

- **Authentication:** redirect when signed out, wrong password, required fields,
  sign in and sign out.
- **Registry:** create a drone with the default components, duplicate-code
  rejection, required fields, search and filters, status change, issues,
  flight-video links (https only).
- **Drone diagram:** Digital and Analog parts, selection by mouse and keyboard,
  missing-part and open-issue markers, unmatched components.
- **Responsive and language:** no horizontal scrolling at phone, tablet, laptop,
  and desktop widths; compact markers on phones and labelled callouts on wider
  screens; language switching and persistence.

Rules for writing end-to-end tests:

- Create the data a test needs through the API (`createDroneViaApi`) with a
  unique code (`uniqueCode`); never rely on existing rows. Tests run in parallel.
- Use roles, labels, and element ids rather than CSS classes where possible.
- Sign in through the form only in the authentication tests; other tests use
  `signInQuietly`.
- Keep one behavior per test and make it independent of the others.

## Not covered yet

- Browser tests on browsers other than Chrome.
- Accessibility audits and visual regression snapshots.
- Running the suites automatically on every push (no CI yet; see
  [TODO](TODO.md)).
