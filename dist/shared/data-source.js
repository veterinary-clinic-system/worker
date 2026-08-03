"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerDataSource = exports.workerDataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
exports.workerDataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'vetclinic',
    password: process.env.DB_PASSWORD ?? 'vetclinic',
    database: process.env.DB_DATABASE ?? 'veterinary_clinic',
    entities: [],
    migrationsRun: false,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
};
exports.WorkerDataSource = new typeorm_1.DataSource(exports.workerDataSourceOptions);
//# sourceMappingURL=data-source.js.map