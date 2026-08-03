import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
export declare class OutboxDispatcherService {
    private readonly dataSource;
    private readonly notificationQueue;
    private readonly logger;
    constructor(dataSource: DataSource, notificationQueue: Queue);
    dispatchPending(): Promise<void>;
}
