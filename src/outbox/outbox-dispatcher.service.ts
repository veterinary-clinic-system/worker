import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { JOB, QUEUE, SendAppointmentReminderJob } from '../shared/contracts';

interface OutboxRow {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  dedupe_key: string;
}

/** So su kien lay moi vong - gioi han de mot dot don ung khong chiem het worker. */
const BATCH_SIZE = 50;

/**
 * Cac loai su kien co nguoi nhan la KHACH HANG qua SMS/Zalo.
 *
 * Bang outbox chua ca nhung su kien noi bo (`INVENTORY_LOW_STOCK`, `VACCINATION_DUE`...)
 * ma nguoi nhan la NHAN VIEN - nhung su kien do duoc backend ghi thang vao
 * `staff_notifications` trong chinh transaction nghiep vu (P10-T5), khong di qua day.
 *
 * TRUOC P10 KHONG CO DANH SACH NAY va do la mot loi that: moi dong outbox deu bi dung
 * thanh mot job nhac lich hen, ke ca canh bao ton kho. Cac su kien do khong co
 * `appointmentId` nen job nhan chuoi rong, roi processor chay
 * `INSERT INTO notifications (appointment_id, ...) VALUES ('', ...)` va vo vi '' khong
 * phai uuid - that bai, thu lai nam lan, cuoi cung nam lai trong hang doi that bai.
 */
const CUSTOMER_FACING_EVENT_TYPES = new Set(['APPOINTMENT_CREATED']);

/**
 * Doc bang outbox roi day sang BullMQ - nua sau cua mau Transactional Outbox
 * (Phan IV.2 tai lieu kien truc).
 *
 * Hai chi tiet quan trong:
 *
 * 1. `FOR UPDATE SKIP LOCKED`: cho phep chay NHIEU ban sao worker song song ma khong
 *    ai xu ly trung su kien cua ai. Ban sao thu hai don gian bo qua cac dong dang bi
 *    ban sao thu nhat giu.
 *
 * 2. Danh dau `processed_at` NGAY TRONG transaction da khoa dong do. Neu tien trinh
 *    chet sau khi day job nhung truoc khi commit, transaction rollback va su kien se
 *    duoc thu lai - tin nhan co the gui hai lan. Do la danh doi at-least-once co chu
 *    dich: tin nhan trung con hon tin nhan mat. `dedupeKey` UNIQUE o dau ben kia va
 *    `jobId` cua BullMQ chan phan lon truong hop trung nay.
 */
@Injectable()
export class OutboxDispatcherService {
  private readonly logger = new Logger(OutboxDispatcherService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectQueue(QUEUE.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  @Interval(5000)
  async dispatchPending(): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const rows: OutboxRow[] = await manager.query(
          `SELECT id, type, payload, dedupe_key
             FROM outbox_events
            WHERE processed_at IS NULL
            ORDER BY created_at
            LIMIT $1
              FOR UPDATE SKIP LOCKED`,
          [BATCH_SIZE],
        );

        if (rows.length === 0) return;

        let queued = 0;
        for (const row of rows) {
          // Su kien noi bo van duoc danh dau da xu ly o duoi: chung DA duoc phuc vu
          // (backend ghi thang vao `staff_notifications`), nen de chung nam lai mai
          // trong outbox chi lam bang phinh len va che khuat cac su kien that su ket.
          if (!CUSTOMER_FACING_EVENT_TYPES.has(row.type)) {
            continue;
          }

          const job: SendAppointmentReminderJob = {
            appointmentId: String(row.payload.appointmentId ?? ''),
            recipientPhone: String(row.payload.recipientPhone ?? ''),
            message: String(row.payload.message ?? ''),
            dedupeKey: row.dedupe_key,
          };

          queued += 1;
          await this.notificationQueue.add(JOB.SEND_APPOINTMENT_REMINDER, job, {
            // jobId = dedupeKey: BullMQ tu bo qua job trung id, lop chan trung thu hai.
            jobId: row.dedupe_key,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 1000,
            removeOnFail: false,
          });
        }

        await manager.query(
          `UPDATE outbox_events SET processed_at = now() WHERE id = ANY($1::uuid[])`,
          [rows.map((r) => r.id)],
        );

        this.logger.log(
          `Da xu ly ${rows.length} su kien outbox (${queued} day sang hang doi gui khach)`,
        );
      });
    } catch (error) {
      // Khong nem tiep: mot vong that bai khong duoc lam chet worker, vong sau thu lai.
      this.logger.error(`Vong day outbox that bai: ${(error as Error).message}`);
    }
  }
}
