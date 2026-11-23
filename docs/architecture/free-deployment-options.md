# Free deployment options

How to use DroneAid Warehouse from anywhere at no cost. This is guidance, not a
decision: the host, region, and owner are still open items in the
[to-do list](../TODO.md#deployment-and-operations).

The application is three containers (Angular site served by Caddy, ASP.NET Core
API, PostgreSQL) started with `docker compose up --build -d`.

## Read this first: security before going public

- **The API has no access control.** The login screen only protects the web page.
  Anyone who finds the address can read and change drones by calling `/api/...`
  directly.
- **The seeded account is `DAB_Test` with a known development password**
  (see `DatabaseInitializer.cs`). Change it before real use.
- Do not expose the application publicly until one of these is in place:
  - **Cloudflare Access** (free for up to 50 users) in front of the site, so people
    sign in with their email before reaching it. Needs a domain on Cloudflare
    (about 10 EUR a year); or
  - real token authentication and role-based authorization in the API (an open
    item in the to-do list).

## Option 1: your own PC plus a free Cloudflare Tunnel

The fastest way to try it from a phone or another computer (about 10 minutes).

1. Keep the Docker stack running on your PC (`docker compose up --build -d`).
2. Install `cloudflared` and run:

   ```bash
   cloudflared tunnel --url http://localhost:4200
   ```

3. Open the `https://….trycloudflare.com` address it prints, from any device.

| | |
| --- | --- |
| Cost | Free; no card, no router or firewall changes. |
| Good for | Personal use, demos, trying it with a few people. |
| Limits | The PC must be on and running Docker. The address changes every time the tunnel restarts. |
| Fixed address | Add a domain to a free Cloudflare account and use a named tunnel; then Cloudflare Access can protect it. |

## Option 2: always-on free server (Oracle Cloud "Always Free")

A free virtual machine (up to 4 ARM cores and 24 GB of RAM) that runs the same
Docker Compose stack around the clock.

1. Create an Oracle Cloud account (a card is requested for verification only) and
   an Always Free VM running Ubuntu.
2. Install Docker and copy the repository and a production `.env` to the VM.
3. Run `docker compose up --build -d`.
4. Open ports 80 and 443 in the VM's network rules and add HTTPS (Caddy can obtain
   certificates automatically for a domain, or use a free dynamic-DNS name).
5. Protect it (see above), set up backups, and restart the stack after VM updates.

| | |
| --- | --- |
| Cost | Free while within the Always Free limits. |
| Good for | A small team that needs it available all the time. |
| Limits | Free capacity is sometimes unavailable in a region. You maintain the server: updates, firewall, HTTPS, and backups of the PostgreSQL volume. |

## Hosts that do not fit

| Host | Why not |
| --- | --- |
| Render free tier | The service sleeps when idle, and the free PostgreSQL database is removed after about 30 days. |
| Railway | Trial credit only, not a lasting free tier. |
| Fly.io | No free tier for new accounts. |
| Static-only hosting (GitHub Pages, Netlify) | Hosts only the Angular site; the API and database still need a home. |

Check each provider's current terms before relying on them; free tiers change.

## Recommendation

Use **option 1** for personal use now. Move to **option 2 with Cloudflare
Access** when the team needs it always on, and add API authentication before
storing anything sensitive.

## Decisions to make

- Which option, and who owns the account and the server.
- Whether to buy a domain (needed for a fixed address and Cloudflare Access).
- Backup and restore routine for PostgreSQL (see the to-do list).
