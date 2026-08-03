"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const contracts_1 = require("@vetcare/contracts");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor extends bullmq_1.WorkerHost {
    constructor(dataSource, configService) {
        super();
        this.dataSource = dataSource;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationProcessor_1.name);
    }
    async process(job) {
        if (job.name !== contracts_1.JOB.SEND_APPOINTMENT_REMINDER) {
            this.logger.warn(`Bo qua job khong ro loai: ${job.name}`);
            return;
        }
        const { appointmentId, recipientPhone, message, dedupeKey } = job.data;
        const mode = this.configService.get('NOTIFICATION_PROVIDER') ?? 'log';
        if (mode === 'log') {
            this.logger.log(`[log] -> ${recipientPhone}: ${message}`);
        }
        else {
            throw new Error(`Chua noi nha cung cap "${mode}" trong worker - hien chi ho tro che do log`);
        }
        await this.dataSource.query(`UPDATE notifications
          SET status = 'SENT', sent_at = now()
        WHERE appointment_id = $1 AND status <> 'SENT'`, [appointmentId]);
        this.logger.debug(`Da xu ly ${dedupeKey}`);
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(contracts_1.QUEUE.NOTIFICATION),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.ConfigService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map