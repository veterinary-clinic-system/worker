import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Worker dung CHUNG mot CSDL voi backend nhung KHONG dung chung file entity.
 *
 * Ly do: worker chi can doc/ghi mot vai bang (outbox_events, notifications,
 * pre_screening_results). Keo toan bo 26 entity cua api sang day se buoc hai tien
 * trinh phai deploy cung nhau moi khi doi mot entity bat ky - dung thu ma viec tach
 * tien trinh nham tranh.
 *
 * Vi vay worker truy van bang SQL tho co kieu ro rang. Doi lai, khi schema doi thi
 * phai sua ca hai noi - danh doi duoc ghi nhan trong bao cao.
 */
export const workerDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'vetclinic',
  password: process.env.DB_PASSWORD ?? 'vetclinic',
  database: process.env.DB_DATABASE ?? 'veterinary_clinic',
  entities: [],
  // Worker KHONG BAO GIO chay migration: chi backend duoc phep doi schema, neu khong
  // hai tien trinh se dua nhau chay migration luc khoi dong.
  migrationsRun: false,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

export const WorkerDataSource = new DataSource(workerDataSourceOptions);
