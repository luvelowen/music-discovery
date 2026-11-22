import { applyChange, type Account, type Change, type ChangeInput } from './changes.ts';

export type SaveStatus = 'saved' | 'saving' | 'failed' | 'rejected' | 'signedOut';
export type Snapshot = { account: Account; status: SaveStatus };

const TYPING_PAUSE = 350;
const RETRY_AFTER = 3000;
const BATCH = 50;

/*
 * One of these exists for each signed-in screen. It shows a change immediately, saves it in order,
 * and keeps it until the server confirms, retrying if the connection drops.
 * Never make it a module-level variable: the server would share it between different people.
 */
export class AccountStore {
  private userId: string;
  private confirmed: Account;
  private pending: Change[] = [];
  private inFlight = 0;
  private sending: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<() => void>();
  private snapshot: Snapshot;
  readonly initial: Snapshot;

  constructor(userId: string, account: Account) {
    this.userId = userId;
    this.confirmed = account;
    this.snapshot = { account, status: 'saved' };
    this.initial = this.snapshot;
  }

  read = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  private emit(status: SaveStatus) {
    const account = this.pending.reduce((value, change) => applyChange(value, change, Date.now()), this.confirmed);
    this.snapshot = { account, status };
    this.listeners.forEach((listener) => listener());
  }

  private schedule(delay: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.send(), delay);
  }

  change = (input: ChangeInput) => {
    const id = crypto.randomUUID();
    const last = this.pending.length > this.inFlight ? this.pending[this.pending.length - 1] : undefined;
    // Typing becomes one save, not one save for each letter.
    if (input.kind === 'profile' && last?.kind === 'profile') {
      this.pending[this.pending.length - 1] = { ...input, id, patch: { ...last.patch, ...input.patch } };
    } else {
      this.pending.push({ ...input, id });
    }
    this.emit('saving');
    this.schedule(input.kind === 'profile' ? TYPING_PAUSE : 0);
  };

  private send(): Promise<boolean> {
    if (this.sending) return this.sending;
    if (!this.pending.length) return Promise.resolve(true);
    this.sending = this.post().finally(() => {
      this.sending = null;
      this.inFlight = 0;
      if (!this.pending.length || this.snapshot.status === 'signedOut') return;
      this.schedule(this.snapshot.status === 'failed' ? RETRY_AFTER : 0);
    });
    return this.sending;
  }

  private async post(): Promise<boolean> {
    const batch = this.pending.slice(0, BATCH);
    this.inFlight = batch.length;
    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, changes: batch }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        this.confirmed = ((await response.json()) as { account: Account }).account;
        this.pending.splice(0, batch.length);
        this.emit(this.pending.length ? 'saving' : 'saved');
        return true;
      }
      if (response.status === 401 || response.status === 409) {
        this.emit('signedOut');
      } else if (response.status < 500) {
        this.pending.splice(0, batch.length);
        this.emit('rejected');
      } else {
        this.emit('failed');
      }
    } catch {
      this.emit('failed');
    }
    return false;
  }

  /** Resolves true only when the server has confirmed every change. */
  flush = async (): Promise<boolean> => {
    clearTimeout(this.timer);
    while (this.pending.length || this.sending) {
      if (!(await this.send())) return false;
    }
    return true;
  };

  hasUnsaved = () => this.pending.length > 0;

  /** Picks up changes made in another tab or browser. */
  refresh = async () => {
    if (this.pending.length || this.sending) return;
    const before = this.confirmed;
    try {
      const response = await fetch('/api/account', { cache: 'no-store' });
      if (response.status === 401) return this.emit('signedOut');
      if (!response.ok) return;
      const body = (await response.json()) as { userId: string; account: Account };
      if (body.userId !== this.userId) return this.emit('signedOut');
      // Anything changed here while we waited is newer than this answer.
      if (this.pending.length || this.confirmed !== before) return;
      this.confirmed = body.account;
      this.emit('saved');
    } catch {
      // Offline. The next save or focus tries again.
    }
  };
}
