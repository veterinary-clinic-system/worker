import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { RefreshMaterializedViewsJob } from '@vetcare/contracts';
export declare class ReportingProcessor extends WorkerHost {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    process(job: Job<RefreshMaterializedViewsJob>): Promise<void>;
}
export declare class ReportingScheduler {
    private readonly queue;
    private readonly dataSource;
    private readonly logger;
    constructor(queue: Queue, dataSource: DataSource);
    scheduleRefresh(): Promise<void>;
    ensureNextMonthAuditPartition(): Promise<void>;
}
