const DAY = 86_400_000;
const json = (status, body) => Response.json(body, { status });
const unavailable = () => json(503, { error: 'unavailable' });
const count = (value) => Number.isSafeInteger(value) && value >= 0;

// One named SQLite Durable Object owns admission, the outbox and aggregate counts.
// KV is deliberately not used for synchronization.
export class SubmissionLedger {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.now = Date.now;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.queue = Promise.resolve();
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec('CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY CHECK (id = 1), human INTEGER NOT NULL, agent INTEGER NOT NULL)');
      this.sql.exec('CREATE TABLE IF NOT EXISTS budgets (day TEXT PRIMARY KEY, used INTEGER NOT NULL)');
      this.sql.exec('CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, digest TEXT NOT NULL, mode TEXT NOT NULL, body TEXT, created INTEGER NOT NULL)');
    });
  }

  serial(action) {
    const result = this.queue.then(action);
    this.queue = result.catch(() => {});
    return result;
  }

  async fetch(request) {
    return this.serial(async () => {
      try {
        const path = new URL(request.url).pathname;
        const now = this.now();
        const day = new Date(now).toISOString().slice(0, 10);
        const limit = Number(this.env.DAILY_SUBMISSION_LIMIT);
        if (!Number.isSafeInteger(limit) || limit < 1 || !this.env.SUBMISSIONS) return unavailable();
        const totals = this.sql.exec('SELECT human, agent FROM totals WHERE id = 1').toArray()[0];
        if (path === '/bootstrap' && request.method === 'POST') {
          if (totals) return json(409, { error: 'initialized' });
          const seed = await request.json();
          if (!seed || typeof seed !== 'object' || Array.isArray(seed)) return json(400, { error: 'invalid' });
          if (!count(seed.human) || !count(seed.agent) || !count(seed.used) || seed.day !== day
            || !Number.isSafeInteger(seed.human + seed.agent) || seed.used > seed.human + seed.agent) return json(400, { error: 'invalid' });
          this.ctx.storage.transactionSync(() => {
            this.sql.exec('INSERT INTO totals (id, human, agent) VALUES (1, ?, ?)', seed.human, seed.agent);
            this.sql.exec('INSERT INTO budgets (day, used) VALUES (?, ?)', day, seed.used);
          });
          return json(200, { ok: true });
        }
        if (!totals) return unavailable();
        if (path === '/counts' && request.method === 'GET') return json(200, totals);
        if (path !== '/submit' || request.method !== 'POST') return json(404, { error: 'not_found' });
        const { id, digest, payload } = await request.json();
        // The external Worker validates this internal-only request. No public DO route exists.
        const receipt = this.sql.exec('SELECT digest, body FROM receipts WHERE id = ?', id).toArray()[0];
        if (receipt) {
          if (receipt.digest !== digest) return json(409, { error: 'conflict' });
          if (receipt.body !== null) await this.flush(id, receipt.body);
          return json(200, { ok: true });
        }
        const used = this.sql.exec('SELECT used FROM budgets WHERE day = ?', day).toArray()[0]?.used ?? 0;
        if (used >= limit) return json(429, { error: 'capacity' });
        // Schedule recovery before reserving a slot. A failed KV write keeps the
        // slot consumed and the durable outbox intact, including ambiguous writes.
        await this.ctx.storage.setAlarm(now + 60_000);
        const body = JSON.stringify({ ts: new Date(now).toISOString(), ...payload });
        this.ctx.storage.transactionSync(() => {
          this.sql.exec('INSERT INTO budgets (day, used) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET used = used + 1', day);
          this.sql.exec('INSERT INTO receipts (id, digest, mode, body, created) VALUES (?, ?, ?, ?, ?)', id, digest, payload.mode, body, now);
        });
        await this.flush(id, body);
        return json(200, { ok: true });
      } catch {
        return unavailable();
      }
    });
  }

  async flush(id, body) {
    // Retrying this stable key cannot create another KV row even if put succeeded
    // but its response or the subsequent SQLite transaction was lost.
    await this.env.SUBMISSIONS.put(`submission:${id}`, body);
    this.ctx.storage.transactionSync(() => {
      const row = this.sql.exec('SELECT mode, body FROM receipts WHERE id = ?', id).toArray()[0];
      if (!row || row.body === null) return;
      this.sql.exec(row.mode === 'human' ? 'UPDATE totals SET human = human + 1 WHERE id = 1' : 'UPDATE totals SET agent = agent + 1 WHERE id = 1');
      this.sql.exec('UPDATE receipts SET body = NULL WHERE id = ?', id);
    });
  }

  async alarm() {
    return this.serial(async () => {
      // Bound each recovery batch. Keep retrying pending rows; never discard a
      // submission whose KV acknowledgement/count update may have been lost.
      await this.ctx.storage.setAlarm(this.now() + 60_000);
      const pending = this.sql.exec('SELECT id, body FROM receipts WHERE body IS NOT NULL ORDER BY created LIMIT 20').toArray();
      for (const row of pending) {
        try { await this.flush(row.id, row.body); } catch { break; }
      }
      // Keep compact completed receipts: forgetting a UUID would allow a later
      // replay to overwrite the same KV row while incrementing the total again.
      this.sql.exec('DELETE FROM budgets WHERE day < ?', new Date(this.now() - 2 * DAY).toISOString().slice(0, 10));
      if (!this.sql.exec('SELECT id FROM receipts WHERE body IS NOT NULL LIMIT 1').toArray().length) await this.ctx.storage.deleteAlarm();
    });
  }
}
