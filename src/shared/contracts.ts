/**
 * Thay the cho goi `@vetcare/contracts` (song trong `packages/contracts/` cua monorepo
 * cu, tach roi khoi thu muc worker). Sau khi tach 4 ung dung thanh 4 repo doc lap,
 * khong con workspace npm de chia se mot goi giua worker va backend nua - nen worker
 * tu giu ban khai bao QUEUE/JOB cua chinh minh o day.
 *
 * Day la hop dong NOI BO cua rieng worker (ten hang doi BullMQ + kieu payload job).
 * Backend khong import file nay - no chi ghi mot dong vao bang `outbox_events` voi
 * cot `type` la chuoi tu do (xem OutboxService.record), roi worker doc bang do va
 * tu anh xa sang JOB/QUEUE o day. Vi vay khong bat buoc hai ben phai dung chung mot
 * nguon dinh nghia - chi can WORKER tu nhat quan voi chinh no.
 */
export const QUEUE = {
  NOTIFICATION: 'notification',
  AI_PREDICTION: 'ai-prediction',
  REPORTING_REFRESH: 'reporting-refresh',
} as const;

export const JOB = {
  SEND_APPOINTMENT_REMINDER: 'send-appointment-reminder',
  REFRESH_MATERIALIZED_VIEWS: 'refresh-materialized-views',
} as const;

export interface SendAppointmentReminderJob {
  appointmentId: string;
  recipientPhone: string;
  message: string;
  dedupeKey: string;
}

export interface RefreshMaterializedViewsJob {
  viewNames?: string[];
  concurrently?: boolean;
}
