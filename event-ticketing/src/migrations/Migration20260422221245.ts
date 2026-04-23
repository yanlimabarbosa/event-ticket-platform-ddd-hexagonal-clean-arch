import { Migration } from '@mikro-orm/migrations';

export class Migration20260422221245 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "outbox_events" ("id" varchar(255) not null, "event_type" varchar(255) not null, "payload" jsonb not null, "processed" boolean not null default false, "created_at" timestamptz not null, "processed_at" timestamptz null, "retry_count" int not null default 0, "last_error" varchar(255) null, primary key ("id"));`);

    this.addSql(`create index "idx_outbox_unprocessed" on "outbox_events" ("created_at") where "processed" = false;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "idx_outbox_unprocessed";`);

    this.addSql(`drop table if exists "outbox_events" cascade;`);
  }

}
