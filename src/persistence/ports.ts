/**
 * Postgres will implement these ports later. There is no live database in this
 * foundation. External systems are not the system of record.
 */
export interface DurableRecord<T> {
  readonly id: string;
  readonly payload: T;
}

export interface IntentRecord {
  readonly id: string;
  readonly actionKind: string;
  readonly createdAt: string;
}

export interface AuditRecord {
  readonly id: string;
  readonly intentId: string;
  readonly occurredAt: string;
  readonly note: string;
}

export interface DurableStore {
  recordIntent(intent: IntentRecord): Promise<void>;
  appendAudit(record: AuditRecord): Promise<void>;
}
