import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { JOB, QUEUE, RefreshMaterializedViewsJob } from '../shared/contracts';

const ALL_VIEWS = ['mv_revenue_daily', 'mv_ai_accuracy_daily'];

/**
 * Lam moi materialized view bao cao (W3 trong so do Phan II) - nua sau cua CQRS-lite
 * o Phan IV.3.
 *
 * Dung REFRESH CONCURRENTLY de man hinh bao cao khong bi khoa trong luc lam moi.
 * Dieu kien de dung duoc CONCURRENTLY la moi view phai co mot UNIQUE index - da tao
 * san trong migration 1785000000000.
 */
@Processor(QUEUE.REPORTING_REFRESH)
export class ReportingProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportingProcessor.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<RefreshMaterializedViewsJob>): Promise<void> {
    if (job.name !== JOB.REFRESH_MATERIALIZED_VIEWS) return;

    const views = job.data.viewNames?.length ? job.data.viewNames : ALL_VIEWS;

    for (const view of views) {
      // Chi cho phep ten nam trong danh sach trang: ten view di thang vao SQL nen
      // khong duoc nhan chuoi tuy y tu payload job.
      if (!ALL_VIEWS.includes(view)) {
        this.logger.warn(`Bo qua ten view khong nam trong danh sach cho phep: ${view}`);
        continue;
      }
      const startedAt = Date.now();
      await this.dataSource.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`);
      this.logger.log(`Da lam moi ${view} trong ${Date.now() - startedAt}ms`);
    }
  }
}

/**
 * Dat lich lam moi dinh ky, va tao truoc partition audit_logs cua thang sau.
 *
 * Tao partition truoc mot thang la co chu dich: neu de den dung ngay dau thang moi
 * tao, mot su co nho cung se lam mat ban ghi kiem toan. (Van con partition DEFAULT
 * lam luoi an toan cuoi cung.)
 */
@Injectable()
export class ReportingScheduler {
  private readonly logger = new Logger(ReportingScheduler.name);

  constructor(
    @InjectQueue(QUEUE.REPORTING_REFRESH) private readonly queue: Queue,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduleRefresh(): Promise<void> {
    await this.queue.add(
      JOB.REFRESH_MATERIALIZED_VIEWS,
      { concurrently: true } satisfies RefreshMaterializedViewsJob,
      { removeOnComplete: 100, removeOnFail: 100 },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async ensureNextMonthAuditPartition(): Promise<void> {
    try {
      await this.dataSource.query(
        `SELECT ensure_audit_log_partition((now() + interval '1 month')::date)`,
      );
    } catch (error) {
      this.logger.error(`Khong tao duoc partition audit_logs: ${(error as Error).message}`);
    }
  }
}
