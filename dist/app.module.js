"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const contracts_1 = require("@vetcare/contracts");
const data_source_1 = require("./shared/data-source");
const outbox_dispatcher_service_1 = require("./outbox/outbox-dispatcher.service");
const notification_processor_1 = require("./processors/notification.processor");
const reporting_processor_1 = require("./processors/reporting.processor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../veterinary-clinic-backend/.env', '.env'],
            }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot(data_source_1.workerDataSourceOptions),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: config.get('REDIS_HOST') ?? 'localhost',
                        port: parseInt(config.get('REDIS_PORT') ?? '6379', 10),
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({ name: contracts_1.QUEUE.NOTIFICATION }, { name: contracts_1.QUEUE.AI_PREDICTION }, { name: contracts_1.QUEUE.REPORTING_REFRESH }),
        ],
        providers: [
            outbox_dispatcher_service_1.OutboxDispatcherService,
            notification_processor_1.NotificationProcessor,
            reporting_processor_1.ReportingProcessor,
            reporting_processor_1.ReportingScheduler,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map