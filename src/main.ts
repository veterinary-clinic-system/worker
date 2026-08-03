import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Worker khong mo cong HTTP - no chi ket noi Redis/PostgreSQL va tieu thu hang doi.
 * Dung `createApplicationContext` thay vi `create` de khong dung len HTTP server thua.
 */
async function bootstrap(): Promise<void> {
  // KHONG dung bufferLogs: khong co buoc flushLogs() thi toan bo log khoi dong bi
  // giu lai trong bo dem va khong bao gio hien ra - worker se trong nhu da chet.
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();

  Logger.log('VetCare worker da khoi dong', 'Bootstrap');
}

void bootstrap();
