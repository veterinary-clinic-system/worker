import { config as loadDotenv } from 'dotenv';
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

// BAT BUOC tu doc .env o day, KHONG dua vao ConfigModule.forRoot() trong app.module.ts:
// object nay la mot `export const` cap module, duoc dung gia tri process.env.DB_* NGAY
// LUC import - tuc la TRUOC KHI dong dau tien cua @Module({ imports: [...] }) trong
// app.module.ts kip chay. Truoc day, `process.env.DB_PORT` van con la `undefined` tai
// thoi diem nay nen worker luon roi vao fallback '5432' - ket noi nham vao PostgreSQL
// khac dang chay tren cong 5432 cua may (vi du ban cai truc tiep tren Windows) thay vi
// dung container Docker cua du an tren cong da remap (5433), roi bao loi sai mat khau vi
// user 'vetclinic' khong ton tai o Postgres kia. Goi loadDotenv() truc tiep o day dam bao
// process.env da san sang truoc khi object ben duoi doc no, bat ke thu tu import nao.
loadDotenv({ path: ['../veterinary-clinic-backend/.env', '.env'] });

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
