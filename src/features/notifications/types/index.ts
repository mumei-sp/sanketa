/**
 * Notification domain types.
 *
 * A notification is a *record*, not a rendered thing: it carries what happened
 * and what it points at, never a colour or an icon name. Presentation is
 * derived at render time from `category` + `severity` (see
 * `utils/notification-display.ts`), so a theme change never has to migrate
 * stored data. The dashboard's old activity feed baked `iconBg` / `iconColor`
 * into each record and had to be retired to escape exactly that.
 */

/** What area of the school the notification came from. Drives icon and tint. */
export type NotificationCategory =
  | 'attendance'
  | 'grades'
  | 'finance'
  | 'notices'
  | 'people'
  | 'timetable'
  | 'system'

/** How loudly it should read. Maps onto the shared `status` tokens. */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

/**
 * What the notification is about, and where tapping it should land.
 *
 * `route` is a resolved in-app path rather than a template so the client never
 * has to know how to build a URL for a kind it has not seen before — a new
 * notification kind from the backend stays clickable without a client release.
 */
export interface NotificationTarget {
  /** Entity type, e.g. 'notice', 'grade-submission', 'fee-payment'. */
  kind: string
  /** Entity id, for consumers that want to highlight the record. */
  id: string
  /** In-app path, e.g. '/notice-board' or '/students/details/S-2102'. */
  route: string
}

/** Who caused it. Null for notifications the system raised on its own. */
export interface NotificationActor {
  id: string
  name: string
}

export interface Notification {
  id: string
  category: NotificationCategory
  severity: NotificationSeverity
  /** One line, always present. */
  title: string
  /** Optional second line with the detail. */
  body?: string
  actor: NotificationActor | null
  target: NotificationTarget | null
  /** ISO 8601. The UI derives "2h ago" from this. */
  createdAt: string
  /**
   * ISO 8601 when read, null when unread.
   *
   * A timestamp rather than a boolean: the server owns this field, and knowing
   * *when* something was read is what lets "mark all read" be undone or
   * audited later. Unread count is `readAt === null`.
   */
  readAt: string | null
}

/**
 * One delivery from the server — a page of notifications plus the cursor to
 * ask from next time.
 *
 * Both transports (polling and SSE) hand the client this same shape, so the
 * store applies a batch identically whether it was pushed or pulled.
 */
export interface NotificationBatch {
  items: Notification[]
  /**
   * Opaque cursor marking the newest record the server has sent so far. Pass
   * it back as `?since=` (polling) or `Last-Event-ID` (SSE) to resume without
   * gaps after a disconnect.
   */
  cursor: string
}

/**
 * A thing that happened in the app, before anyone decides whether it is worth
 * telling someone about.
 *
 * Services emit these; the notification rules turn them into notifications.
 * Keeping the two apart is what stops every caller having to know the fan-out
 * rules — and is why this type has no title, severity or recipient.
 */
export interface DomainEvent {
  /** Dotted name, e.g. 'grades.submitted', 'notice.published'. */
  type: string
  /** Who performed the action, when known. */
  actor?: NotificationActor | null
  /** Event-specific detail the rules read to build the notification. */
  payload: Record<string, unknown>
  /** ISO 8601. Defaults to now when the emitter omits it. */
  occurredAt?: string
}
