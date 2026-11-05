# Optional LMTI submission Worker

Independent Cloudflare Worker, no root dependencies or site configuration changes. Nothing is deployed by this repository. Requires a Cloudflare account with Workers/KV access, Node 22+ for the tests, and Wrangler 4 (`npx wrangler@4` below). Commands run from `worker/`.

## Deploy manually

1. Authenticate and create the private KV namespace:

   ```sh
   npx wrangler@4 login
   npx wrangler@4 kv namespace create SUBMISSIONS
   ```

2. Replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.toml` with the returned namespace ID. Set `ALLOWED_ORIGIN` to the exact frontend origin, including scheme and port if applicable, with **no path or trailing slash**. Production is `https://hyperbolica-dev.github.io`. Use a separate Worker/KV namespace for development; never expose production stats or submissions to local development.

3. Set two independent, high-entropy secrets using Wrangler's hidden interactive prompts. Generate each with a password manager (at least 32 random bytes). Never paste them into source, shell arguments, frontend config, or this README:

   ```sh
   npx wrangler@4 secret put STATS_TOKEN
   npx wrangler@4 secret put RATE_SALT_SECRET
   ```

   `STATS_TOKEN` authenticates the private counts endpoint. `RATE_SALT_SECRET` keys HMAC-SHA-256 for daily rate-limit identifiers. Keep this secret stable across deployments; rotation intentionally invalidates existing rate-limit keys.

4. Deploy explicitly:

   ```sh
   npx wrangler@4 deploy
   ```

5. Copy the returned HTTPS Worker root URL (ending `/`) into the quiz config's `SUBMIT_ENDPOINT`. Do not point it at `/stats`. The request spec calls this config `config.js`; this Astro integration uses `src/lib/lmti/config.ts`. Only the endpoint URL is public; neither secret belongs in the frontend. An empty endpoint keeps Submit hidden.

6. Verify the allowed-origin frontend by explicitly submitting a disposable result. Verify a second immediate request receives HTTP 429, and unauthorized stats receive HTTP 401. This changes the counts; use a separate development namespace for disposable submissions.

No credentials, namespace setup, deployment, or live requests are performed by the implementation task.

## API

- `POST /`: requires exact `Origin: ALLOWED_ORIGIN` and `Content-Type: text/plain` (optional UTF-8 charset). JSON body maximum **4096 UTF-8 bytes**, including all syntax and metadata; streaming bodies and declared lengths are capped. No-origin submissions are rejected. `OPTIONS /` allows only POST and Content-Type from the configured origin. CORS is not caller authentication: a non-browser client can forge Origin.
- Payload: `{v:2,code,mode,who,model,think,fb,hp:""}`. `mode` is human or agent; `who` and `think` retain the listed client allow-lists.
- Positional codes use `LLMQ2p`. All 24 IDs must occur exactly once. Values must be blank 0 or an exact option position in the bundled question bank, including fractional scores and probe X. Noncanonical numbers, letter codes and older versions are rejected. The generated bank is shared with the client, preventing independent validation mappings from drifting.
- `model` is a string of at most 40 Unicode code points after C0/C1 controls are stripped. `fb` contains at most 24 distinct `{q,text}` objects, with integer q 1–24 and at most 300 Unicode code points per text. The 4 KB total cap still applies even when individual fields fit. Empty notes are allowed. Extra input fields are discarded, including extra note fields.
- Success: HTTP 200 `{ "ok": true }`. Errors: `{ "error": "invalid" }` (400; includes honeypot/spam), `origin` (403), `not_found` (404), `method` (405), `rate` (429 with Retry-After), or `unavailable` (503). No stack traces or submitted values are returned.
- `GET /stats?token=SECRET`: requires Worker secret `STATS_TOKEN`; incorrect or unconfigured tokens return 401. Non-browser requests need no Origin; any supplied Origin must be the configured one. Returns `{ "counts": { "human": 0, "claude": 0, ... } }`, including all allowed who values. Only `submission:` keys are paginated and counted. No raw submissions or rate keys are returned. Responses use `Cache-Control: no-store`.

## Privacy, retention, and limitations

Each successful submission is stored as one `submission:<random UUID>` KV entry containing **only** `{ts,code,mode,who,model,think,fb}`. There is no IP, IP hash, request-header data, honeypot, or other metadata in the submission. Submission rows have no automatic expiry; the account owner must delete rows or the namespace to implement a retention policy. Free-text notes and model names can contain personal information supplied voluntarily: do not promise that arbitrary user-written text is inherently anonymous.

The trusted Cloudflare `CF-Connecting-IP` header is used transiently to derive `HMAC-SHA-256(RATE_SALT_SECRET, UTC-date + newline + IP)`. Missing IP or rate secret fails closed (503); there is no shared fallback identifier. The result is used only in a `rate:<digest>` key holding a timestamp with **60-second KV expiration**. Neither raw IP nor hash is copied to a submission or application log. No daily salt records or longer-lived hash records are stored. The daily derivation rotates at UTC midnight: a request across that boundary can pass within 60 seconds of the previous day's request. Shared IPs share the limit. IPv6/IP rotation can evade it. Cloudflare still processes network-level IP information under its own policies; KV expiry is logical removal, not a claim of physical erasure from provider backups.

**KV is eventually consistent and read/check/write is not atomic.** Concurrent requests or requests reaching different Cloudflare locations can both pass; the 60-second rule is best-effort abuse reduction, not a strict global guarantee. KV caches can also keep a prior timestamp visible longer than expected. Stats enumerate and read every submission page; counts may lag, change during pagination, and are not an atomic snapshot. This implementation deliberately avoids shared counter updates that would lose increments. Large datasets make stats expensive; there is no public raw-data export. Strict rate limiting would require a Durable Object or another atomic service, outside this KV-only contract.

The stats token is a bearer secret in a URL as required by the API. Do not share/bookmark that URL, embed it in a page, or put it into a public issue. URLs may leak through browser history, command history, proxies, or provider access logs; the response's no-store header cannot prevent those channels. Wrangler observability is disabled; do not enable request logging without reviewing token/IP exposure. Query from a private administrative client with no analytics and rotate `STATS_TOKEN` if exposed. This Worker makes no outbound third-party requests and has no application logging.

## Deterministic tests (parent integration step)

From the repository root:

```sh
node --test worker/worker.test.mjs
```

Uses Node's built-in runner, Web Crypto, a fixed clock, deterministic IDs and an isolated in-memory KV fake; no account, network, secrets, Wrangler installation or root dependency edits. Covers origin/method/preflight, media types, body-byte cap, malformed JSON, payload boundaries, probe grammar, model sanitization, storage field privacy, TTL and day rotation, secret stats authentication/pagination, and failed storage/configuration. The KV fake does not model distributed eventual consistency; the limitation above remains real.

Tests/builds/lint/formatters are intentionally not run by this implementation slice; the parent runs checks after integration. For a deployed runtime smoke, follow step 6 with a development namespace; local or fake-KV tests are not proof of distributed rate enforcement.
