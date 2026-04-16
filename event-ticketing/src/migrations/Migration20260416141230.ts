import { Migration } from '@mikro-orm/migrations';

export class Migration20260416141230 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "orders" add "version" int not null default 1;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "orders" drop column "version";`);
  }

}
