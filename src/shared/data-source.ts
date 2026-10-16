import { config as loadDotenv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

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
