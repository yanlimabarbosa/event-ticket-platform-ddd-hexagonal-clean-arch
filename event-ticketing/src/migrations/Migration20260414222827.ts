import { Migration } from '@mikro-orm/migrations';

export class Migration20260414222827 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "orders" alter column "total" type int using ("total"::int);`);

    this.addSql(`alter table "order_items" alter column "unit_price" type int using ("unit_price"::int);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "order_items" alter column "unit_price" type numeric(10,0) using ("unit_price"::numeric(10,0));`);

    this.addSql(`alter table "orders" alter column "total" type numeric(10,0) using ("total"::numeric(10,0));`);
  }

}
