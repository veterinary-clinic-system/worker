import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { JOB, QUEUE, SendAppointmentReminderJob } from '../shared/contracts';

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

    // Ghi mot dong SENT MOI de doi soat - KHONG UPDATE dong co san theo appointment_id.
    //
    // Bug da tung xay ra: backend (AppointmentsService.createBooking) vua ghi outbox
    // event nay VUA GOI NotificationsService.scheduleAppointmentReminder(), tao rieng
    // mot dong PENDING khac trong bang notifications (lich gui truoc gio hen
    // reminderLeadHours, se duoc @Cron sendDueNotifications() cua backend gui that su
    // sau nay). Vi outbox duoc dispatch moi 5 giay, UPDATE ... WHERE appointment_id=$1
    // AND status <> 'SENT' truoc day khop luon vao dong PENDING do va danh dau no la
    // SENT chi vai giay sau khi dat lich - tuc la RAT LAU truoc gio hen thuc su. He
    // thong tuong da nhac lich xong, nhung dong PENDING that (se duoc cron xu ly dung
    // gio) khong bao gio con duoc gui, vi status cua no da bi doi thanh SENT roi.
    //
    // Ghi dong MOI thay vi sua dong co san tranh dung cham vao ban ghi cua co che khac.
    await this.dataSource.query(
      `INSERT INTO notifications
         (appointment_id, type, channel, recipient_phone, message, status, scheduled_for, sent_at)
       VALUES ($1, 'APPOINTMENT_REMINDER', 'SMS', $2, $3, 'SENT', now(), now())`,
      [appointmentId, recipientPhone, message],
    );

    this.logger.debug(`Da xu ly ${dedupeKey}`);
  }
}
