# Certified Payroll and Prevailing Wage Control

A standalone BeautyHQ-style workspace. See [FEATURES.md](FEATURES.md) for implemented scope and [OPENROUTER.md](OPENROUTER.md) for provider settings.

## Run locally

This workspace has a dedicated PostgreSQL database and private `.env`. Dependencies and a production build are installed by the initial build process.

```sh
cd /Volumes/external/projects/ai-certified-payroll-and-prevailing-wage-control
npm start
```

Open http://localhost:5700. Administrator: `admin@ai-certified-payroll-and-prevailing-wage-control.local`. The initial password is in this app's private `.env` (`INITIAL_ADMIN_PASSWORD`) and the collection's private `LOCAL-LOGINS.md`. Manage additional accounts from Team accounts.

For a fresh machine, use Node 22 or newer and PostgreSQL 17. Create a database owned by a dedicated role, copy `.env.example` to `.env`, configure credentials, then run `npm ci` and `npm run setup`. `SEED_DEMO_DATA=true` inserts 12 explicitly fictional records only when the domain is empty.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run test:integration` requires a separate PostgreSQL database named `inspection_test_*`, migrated to this app's schema. It uses synthetic sessions and outbound provider fixtures and never submits real records externally.

JSON import supports up to 500 rows per atomic request, with deduplication. CSV/JSON exports cover all records up to 10,000; larger datasets use the paginated API. Dates are stored as UTC instants. Review workflows require two independent reviewers excluding the last editor.

External services are configured through `DOMAIN_CONNECTORS_JSON`; no external submission adapter is provisioned. Sample records, scenarios and rule values are fictional. Backups and hosting are environment responsibilities.

Running `./start.sh` or `npm start` when this app is already healthy prints its URL and exits successfully. A port occupied by another service or an unhealthy instance produces a clear error without stopping any process.

The login page includes **Fill credentials** for this local workspace. It fills the configured initial administrator email and password without submitting the form. `LOCAL_LOGIN_HELPER=true` and a loopback `HOST` are required; the helper is disabled for public bindings and public origins. Credentials are loaded on demand with no-store responses and are checked against the current account, rather than embedded in browser bundles. Disable the flag when sharing or deploying an app.

AI drafts can run directly from entered fields or a filled example. Saved records and documents are optional. Input-only drafts retain an explicitly unverified input snapshot and cite it; they do not create or approve domain records. Disabled action buttons display the missing requirement. The three AI input-fill buttons can also prepare an empty form.
