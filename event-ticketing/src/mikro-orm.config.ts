import 'dotenv/config'
import { Migrator } from '@mikro-orm/migrations'
import { defineConfig } from '@mikro-orm/postgresql'

export default defineConfig({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  dbName: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  entities: ['dist/**/infrastructure/persistence/entities/*.js'],
  entitiesTs: ['src/**/infrastructure/persistence/entities/*.ts'],
  migrations: {
    path: './src/migrations',
  },
  extensions: [Migrator],
  debug: true,
})
