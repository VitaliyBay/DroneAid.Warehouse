# Claude Skills and Hooks

Repository-local Claude Code skills live in `.claude/skills/`. Invoke a skill explicitly
with a slash command, for example: `/implement-feature add flight
test records`. The skills complement `CLAUDE.md`; they do not override user
instructions or permission boundaries.

| Skill | Use it for |
| --- | --- |
| `/product-discovery` | Asking the right questions, agreeing scope, and writing a feature specification before code exists. |
| `/implement-feature` | Building or changing a documented feature with tests, responsive UI checks, documentation updates, and focused commits. |
| `/verify-local-stack` | Starting and verifying the Angular, API, and PostgreSQL Docker Compose stack without deleting local data. |
| `/review-change` | Reviewing a change for defects, security, responsive UX, tests, and documentation consistency. |

## Optional pre-commit hook

The repository provides `.githooks/pre-commit`. For staged API or test changes
it runs `dotnet test`; for staged Angular changes it runs `npm run build`. It
does not run for documentation-only commits.

Enable it once per local clone:

```powershell
.\scripts\enable-git-hooks.ps1
```

The hook uses the installed local dependencies and does not start Docker or
alter database volumes. If a required runtime is unavailable, fix the local
environment and rerun the commit rather than bypassing the hook.
