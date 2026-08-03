import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { JOB, QUEUE, SendAppointmentReminderJob } from '@vetcare/contracts';

/**
 * Gui thong bao lay tu hang doi (W1 trong so do Phan II tai lieu kien truc).
 *
 * O moi truong dev, NOTIFICATION_PROVIDER=log chi ghi ra log thay vi goi nha cung cap
 * that - de chay thu khong lam phien so dien thoai that cua ai.
 */
@Processor(QUEUE.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<SendAppointmentReminderJob>): Promise<void> {
    if (job.name !== JOB.SEND_APPOINTMENT_REMINDER) {
      this.logger.warn(`Bo qua job khong ro loai: ${job.name}`);
      return;
    }

    const { appointmentId, recipientPhone, message, dedupeKey } = job.data;
    const mode = this.configService.get<string>('NOTIFICATION_PROVIDER') ?? 'log';

    if (mode === 'log') {
      this.logger.log(`[log] -> ${recipientPhone}: ${message}`);
    } else {
      // Cho nha cung cap that (Zalo ZNS / SMS brandname). Chua noi o day vi worker
      // chua co thong tin dang nhap cua nha cung cap - xem apps/veterinary-clinic-backend
      // modules/notification/infrastructure/providers/ da co san adapter.
      throw new Error(`Chua noi nha cung cap "${mode}" trong worker - hien chi ho tro che do log`);
    }

    // Ghi lai da gui de doi soat, dung dedupe_key nen chay lai khong tao ban ghi trung.
    await this.dataSource.query(
      `UPDATE notifications
          SET status = 'SENT', sent_at = now()
        WHERE appointment_id = $1 AND status <> 'SENT'`,
      [appointmentId],
    );

    this.logger.debug(`Da xu ly ${dedupeKey}`);
  }
}
