import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function isTrue(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return value === 'true';
}

function ensureParentDirectory(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function getDatabaseOptions(): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseType = process.env.DB_TYPE || (isProduction ? 'postgres' : 'sqljs');
  const synchronize = isTrue(process.env.DB_SYNCHRONIZE, !isProduction);
  const logging = isTrue(process.env.DB_LOGGING, !isProduction);

  if (databaseType === 'sqljs') {
    const location = resolve(
      process.cwd(),
      process.env.SQLJS_LOCATION || '.data/fastfood-kitchen.sqlite',
    );

    ensureParentDirectory(location);

    return {
      type: 'sqljs',
      location,
      autoSave: true,
      autoLoadEntities: true,
      synchronize,
      logging,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'fastfood_kitchen',
    autoLoadEntities: true,
    synchronize,
    logging,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  };
}
