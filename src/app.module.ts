import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE } from './shared/contracts';
import { workerDataSourceOptions } from './shared/data-source';
import { OutboxDispatcherService } from './outbox/outbox-dispatcher.service';
import { NotificationProcessor } from './processors/notification.processor';
import { ReportingProcessor, ReportingScheduler } from './processors/reporting.processor';

/**
 * Tien trinh nen (apps/worker) - W1/W2/W3 trong so do Phan II tai lieu kien truc.
 *
 * Tach khoi apps/veterinary-clinic-backend de:
 *   - mot dot suy luan AI nang khong lam nghen request cua nguoi dung
 *   - deploy lai worker khong lam dut ket noi HTTP dang phuc vu
 *   - scale rieng phan xu ly nen khi hang doi dai
 *
 * Dung chung PostgreSQL va Redis voi backend - day la modular monolith co worker,
 * KHONG phai microservices (xem Phan II: chi tach theo ranh gioi runtime).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Dung chung file .env voi backend: hai tien trinh phai tro cung mot CSDL,
      // cung mot Redis. Hai file .env rieng la nguon sai lech rat kho phat hien.
      envFilePath: ['../veterinary-clinic-backend/.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(workerDataSourceOptions),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: parseInt(config.get<string>('REDIS_PORT') ?? '6379', 10),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE.NOTIFICATION },
      { name: QUEUE.AI_PREDICTION },
      { name: QUEUE.REPORTING_REFRESH },
    ),
  ],
  providers: [
    OutboxDispatcherService,
    NotificationProcessor,
    ReportingProcessor,
    ReportingScheduler,
  ],
})
export class AppModule {}
