# AI Coding Guardrails — Express.js / TypeScript / PostgreSQL / Tailwind

Companion to the NestJS guardrails doc, adapted for a plain Express stack (no DI container, no decorators) — same underlying principles, different architecture conventions since Express gives you no structural opinions out of the box.

---

## 0. Scaffolding — always prefer CLI/generator tools over hand-written boilerplate

- **New project init:** `npm init -y`, then install deps in one shot rather than one-by-one:
  `npm install express dotenv pg && npm install -D typescript ts-node-dev @types/express @types/node`
- **TypeScript config:** `npx tsc --init` then edit (don't hand-write from scratch) — see strict flags in §1.
- **ESLint + Prettier:** `npm init @eslint/config@latest` — pick TypeScript + your style guide, don't hand-roll the config tree.
- **Husky + lint-staged:** `npx husky-init && npm install` then add `lint-staged` config — don't hand-write git hook scripts.
- **Prisma (recommended over raw `pg` for anything beyond a few tables):** `npx prisma init`, `npx prisma migrate dev --name <name>` — never hand-edit migration SQL unless patching a generated one.
- **node-pg-migrate (if staying raw-SQL / no ORM):** `npx node-pg-migrate create <name>` to scaffold migration files instead of writing timestamped files by hand.
- **Vite frontend + Tailwind:** same as the Nest doc — `npm create vite@latest`, then `npx tailwindcss init -p`.
- **Jest setup:** `npm init jest@latest` instead of hand-writing `jest.config.ts`.

Hand-write only route handlers, middleware, services, and actual business logic — not config scaffolding.

---

## 1. TypeScript strictness — identical bar to the Nest doc

```jsonc
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "noImplicitReturns": true,
        "noImplicitOverride": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "outDir": "dist",
        "rootDir": "src",
    },
}
```

`any` banned, `unknown` + narrowing preferred, no `@ts-ignore` (use `@ts-expect-error` with a comment if unavoidable).

---

## 2. Project structure (since Express won't impose one for you)

```
src/
  config/            # env validation, db pool, app-wide config
  modules/
    users/
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      users.dto.ts
      users.spec.ts
  middlewares/         # auth, error handler, request logger, validation
  common/
    errors/            # AppError and subclasses
    utils/
  app.ts               # express app assembly, middleware wiring
  server.ts            # http server bootstrap only
```

- **Router → Controller → Service → Repository**, same layering discipline as Nest, just manually wired instead of DI-injected.
- Controllers only parse `req`/build `res` — no business logic, no direct DB calls.
- Services contain business logic and are framework-agnostic (no `Request`/`Response` types leak in).
- Repositories are the only layer that talks to `pg`/Prisma directly.
- Route files stay declarative — just wiring `router.get(...)`, no inline logic.

---

## 3. Naming conventions

| Element                      | Convention                                      | Example                                          |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Files                        | kebab-case + role suffix                        | `create-order.controller.ts`, `order.service.ts` |
| Classes / Interfaces / Types | PascalCase                                      | `OrderService`, `CreateOrderDto`                 |
| Interfaces                   | PascalCase, no `I` prefix                       | `Repository`, not `IRepository`                  |
| Variables / functions        | camelCase                                       | `findUserById`                                   |
| Constants                    | UPPER_SNAKE_CASE                                | `MAX_UPLOAD_SIZE_MB`                             |
| Route paths                  | kebab-case, plural nouns                        | `/api/v1/shipping-addresses`                     |
| DB tables/columns            | snake_case                                      | `order_items`, `created_at`                      |
| Env vars                     | UPPER_SNAKE_CASE                                | `PG_CONNECTION_STRING`                           |
| Middleware functions         | verbNoun, suffixed `Middleware` where ambiguous | `authenticateMiddleware`, `errorHandler`         |

---

## 4. No dangling / floating promises — critical in Express

Express **does not catch rejected promises in async route handlers** by default (pre-Express 5) — an unhandled rejection in an `async (req, res) => {}` handler will hang the request or crash the process. This makes this rule stricter here than in Nest.

Enforce with ESLint:

```jsonc
{
    "rules": {
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": [
            "error",
            { "checksVoidReturn": { "arguments": false } },
        ],
        "@typescript-eslint/await-thenable": "error",
    },
}
```

Mitigation patterns — pick one and apply it everywhere, don't mix:

- Wrap every async route handler with a catch-forwarding helper:
    ```ts
    const asyncHandler =
        <T extends Request, U extends Response>(
            fn: (req: T, res: U, next: NextFunction) => Promise<void>,
        ) =>
        (req: T, res: U, next: NextFunction): void => {
            fn(req, res, next).catch(next);
        };
    ```
- Or upgrade to **Express 5**, which natively forwards rejected promises from async handlers to the error middleware — preferred for new projects.
- Fire-and-forget background work (e.g. sending an email post-response) must go through a queue (BullMQ) or be explicitly `void`'d with a comment — never a bare unawaited call inside a handler.

---

## 5. Explicit return types

```jsonc
{
    "rules": {
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                "allowExpressions": true,
                "allowTypedFunctionExpressions": true,
            },
        ],
        "@typescript-eslint/explicit-module-boundary-types": "error",
    },
}
```

- Route handlers: `(req: Request, res: Response, next: NextFunction): Promise<void>`.
- Services: always declare the return type, e.g. `Promise<Order>`, `Promise<Order[]>` — never left inferred.
- Middleware: `(req: Request, res: Response, next: NextFunction): void` (or `Promise<void>` if async).

---

## 6. Generics and full type coverage

- Type `req.body`, `req.params`, `req.query` explicitly per route — don't leave them as Express's default `any`-ish generics.
    ```ts
    interface CreateOrderParams { orderId: string }
    interface CreateOrderBody { items: OrderItemDto[] }

    router.post(
      '/:orderId/items',
      asyncHandler(async (
        req: Request<CreateOrderParams, unknown, CreateOrderBody>,
        res: Response
      ): Promise<void> => { ... })
    );
    ```
- Runtime-validate the same shapes with `zod`/`class-validator` — Express gives you zero runtime guarantees on `req.body`'s shape, so the TS type alone is a lie unless paired with validation middleware.
- Use generics for cross-cutting types: `ApiResponse<T>`, `PaginatedResult<T>`, a generic base `Repository<T>` if you have several near-identical CRUD repositories.
- DTOs (input validation shape) and entities (DB row shape) stay separate types — map explicitly at the service boundary.

---

## 7. Testing — required unless explicitly told otherwise

- Every service file gets a co-located `.spec.ts`; services are the easiest layer to unit test since they're framework-agnostic.
- Controllers/routes get integration tests via `supertest` against the real Express app (not a mocked one).
- DB-touching repository code gets integration tests against a real test Postgres instance (docker-compose service or similar) — don't mock the `pg` driver for logic that depends on real constraint/transaction behavior.
- Coverage bar: 80% on services/repositories, enforced in CI.
- `describe('methodName')` / `it('should ... when ...')` naming, same as the Nest doc.

---

## 8. PostgreSQL practices — identical to the Nest doc, repeated because it matters

- Migrations only (`node-pg-migrate` or Prisma) — never `CREATE TABLE` by hand against prod, never rely on auto-sync.
- Always parameterized queries — with raw `pg`, that means `pool.query('... WHERE id = $1', [id])`, never template-string interpolation into SQL.
- Explicit transactions (`BEGIN`/`COMMIT`/`ROLLBACK` or `pool.connect()` + `client.query('BEGIN')`) for multi-statement writes — always release the client in a `finally` block.
- Soft deletes: partial unique index accounting for `deleted_at IS NULL`, not a plain unique constraint.
- Explicit `ON DELETE` policy on every foreign key.
- Index every FK and every filtered/sorted column on large tables; confirm with `EXPLAIN ANALYZE`.
- Connection pooling via a single shared `pg.Pool` instance exported from `config/db.ts` — never `new Client()` per request.
- No N+1 query patterns — batch-fetch or join.

---

## 9. Middleware & error handling

- **Centralized error-handling middleware** as the last app-level middleware (`app.use(errorHandler)`), with 4-arg signature `(err, req, res, next)` — all thrown/forwarded errors funnel here.
- Custom error hierarchy (`AppError` base with `statusCode` and `code`), thrown from services, translated to HTTP responses only in the error middleware — services never construct HTTP responses.
- Validation middleware runs before the controller, using `zod`/`express-validator`/`class-validator` — reject with `400` before business logic ever runs.
- `helmet()`, `cors()` (explicit origin allowlist, not `*` in prod), and a rate limiter (`express-rate-limit`) wired in `app.ts` for every project by default.
- Structured request logging (`pino-http` or `morgan` piped into `pino`) — not bare `console.log`.
- Never let an error middleware leak stack traces or raw DB error messages to the client in production.

---

## 10. API design & validation

- Same conventions as the Nest doc: plural noun resources, versioned paths (`/api/v1/...`), consistent list envelope `{ data, meta }`, correct status codes, idempotency keys on retryable POSTs.
- Router files are grouped by resource and mounted under a versioned prefix in `app.ts`:
    ```ts
    app.use('/api/v1/orders', ordersRouter);
    ```

---

## 11. Security baseline

- `helmet()` always on.
- Rate limiting on auth and public write routes.
- Secrets from env vars only, validated at boot (fail fast if missing — check in `config/env.ts` with a `zod` schema, not scattered `process.env.X!` casts through the codebase).
- Passwords via `bcrypt`/`argon2`.
- `npm audit` in CI.

---

## 13. CI gate

Same bar as the Nest doc: `tsc --noEmit`, ESLint clean, Prettier check, tests + coverage threshold, `npm audit`.

```json
{
    "scripts": {
        "dev": "ts-node-dev --respawn src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js",
        "typecheck": "tsc --noEmit",
        "test": "jest --coverage",
        "format": "prettier --write .",
        "prepare": "husky install"
    }
}
```

---

## 14. Git / commit hygiene

Same as the Nest doc: conventional commits, no commented-out code, no stray `console.log` (lint rule enforced).

---

### Key differences from the NestJS version, at a glance

| Concern           | NestJS                                        | Express                                                             |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Structure         | Enforced by modules/decorators                | Manually enforced by convention (§2)                                |
| Dangling promises | Nest's exception zone catches most rejections | **You must add `asyncHandler` or use Express 5** — higher risk here |
| Validation        | `ValidationPipe` global                       | Explicit validation middleware per route                            |
| Error handling    | Global exception filter                       | Centralized 4-arg error middleware, must be wired last              |
| DI                | Built-in container                            | None — manual constructor injection or module-level singletons      |

For a hackathon on Express specifically, the highest-leverage subset is **§4 (asyncHandler/Express 5) + §1 (strict TS) + §8 (Postgres) + §9 (centralized error middleware)** — these are the ones that silently break things if skipped, unlike Nest where the framework catches some of these by default.
