import { WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { SendAppointmentReminderJob } from '@vetcare/contracts';
export declare class NotificationProcessor extends WorkerHost {
    private readonly dataSource;
    private readonly configService;
    private readonly logger;
    constructor(dataSource: DataSource, configService: ConfigService);
    process(job: Job<SendAppointmentReminderJob>): Promise<void>;
}
