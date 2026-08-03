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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OutboxDispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("typeorm");
const contracts_1 = require("@vetcare/contracts");
const BATCH_SIZE = 50;
let OutboxDispatcherService = OutboxDispatcherService_1 = class OutboxDispatcherService {
    constructor(dataSource, notificationQueue) {
        this.dataSource = dataSource;
        this.notificationQueue = notificationQueue;
        this.logger = new common_1.Logger(OutboxDispatcherService_1.name);
    }
    async dispatchPending() {
        try {
            await this.dataSource.transaction(async (manager) => {
                const rows = await manager.query(`SELECT id, type, payload, dedupe_key
             FROM outbox_events
            WHERE processed_at IS NULL
            ORDER BY created_at
            LIMIT $1
              FOR UPDATE SKIP LOCKED`, [BATCH_SIZE]);
                if (rows.length === 0)
                    return;
                for (const row of rows) {
                    const job = {
                        appointmentId: String(row.payload.appointmentId ?? ''),
                        recipientPhone: String(row.payload.recipientPhone ?? ''),
                        message: String(row.payload.message ?? ''),
                        dedupeKey: row.dedupe_key,
                    };
                    await this.notificationQueue.add(contracts_1.JOB.SEND_APPOINTMENT_REMINDER, job, {
                        jobId: row.dedupe_key,
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 5000 },
                        removeOnComplete: 1000,
                        removeOnFail: false,
                    });
                }
                await manager.query(`UPDATE outbox_events SET processed_at = now() WHERE id = ANY($1::uuid[])`, [rows.map((r) => r.id)]);
                this.logger.log(`Da day ${rows.length} su kien outbox sang hang doi`);
            });
        }
        catch (error) {
            this.logger.error(`Vong day outbox that bai: ${error.message}`);
        }
    }
};
exports.OutboxDispatcherService = OutboxDispatcherService;
__decorate([
    (0, schedule_1.Interval)(5000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxDispatcherService.prototype, "dispatchPending", null);
exports.OutboxDispatcherService = OutboxDispatcherService = OutboxDispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)(contracts_1.QUEUE.NOTIFICATION)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        bullmq_2.Queue])
], OutboxDispatcherService);
//# sourceMappingURL=outbox-dispatcher.service.js.map