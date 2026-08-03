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
var ReportingProcessor_1, ReportingScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingScheduler = exports.ReportingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_2 = require("@nestjs/bullmq");
const bullmq_3 = require("bullmq");
const typeorm_1 = require("typeorm");
const contracts_1 = require("@vetcare/contracts");
const ALL_VIEWS = ['mv_revenue_daily', 'mv_ai_accuracy_daily'];
let ReportingProcessor = ReportingProcessor_1 = class ReportingProcessor extends bullmq_1.WorkerHost {
    constructor(dataSource) {
        super();
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ReportingProcessor_1.name);
    }
    async process(job) {
        if (job.name !== contracts_1.JOB.REFRESH_MATERIALIZED_VIEWS)
            return;
        const views = job.data.viewNames?.length ? job.data.viewNames : ALL_VIEWS;
        for (const view of views) {
            if (!ALL_VIEWS.includes(view)) {
                this.logger.warn(`Bo qua ten view khong nam trong danh sach cho phep: ${view}`);
                continue;
            }
            const startedAt = Date.now();
            await this.dataSource.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`);
            this.logger.log(`Da lam moi ${view} trong ${Date.now() - startedAt}ms`);
        }
    }
};
exports.ReportingProcessor = ReportingProcessor;
exports.ReportingProcessor = ReportingProcessor = ReportingProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(contracts_1.QUEUE.REPORTING_REFRESH),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ReportingProcessor);
let ReportingScheduler = ReportingScheduler_1 = class ReportingScheduler {
    constructor(queue, dataSource) {
        this.queue = queue;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ReportingScheduler_1.name);
    }
    async scheduleRefresh() {
        await this.queue.add(contracts_1.JOB.REFRESH_MATERIALIZED_VIEWS, { concurrently: true }, { removeOnComplete: 100, removeOnFail: 100 });
    }
    async ensureNextMonthAuditPartition() {
        try {
            await this.dataSource.query(`SELECT ensure_audit_log_partition((now() + interval '1 month')::date)`);
        }
        catch (error) {
            this.logger.error(`Khong tao duoc partition audit_logs: ${error.message}`);
        }
    }
};
exports.ReportingScheduler = ReportingScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingScheduler.prototype, "scheduleRefresh", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingScheduler.prototype, "ensureNextMonthAuditPartition", null);
exports.ReportingScheduler = ReportingScheduler = ReportingScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_2.InjectQueue)(contracts_1.QUEUE.REPORTING_REFRESH)),
    __metadata("design:paramtypes", [bullmq_3.Queue,
        typeorm_1.DataSource])
], ReportingScheduler);
//# sourceMappingURL=reporting.processor.js.map