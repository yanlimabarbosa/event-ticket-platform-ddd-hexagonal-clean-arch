import { Migration } from '@mikro-orm/migrations';

export class Migration20260411183609 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "orders" ("id" varchar(255) not null, "total" numeric(10,0) not null, "event_id" varchar(255) not null, "attendee_id" varchar(255) not null, "status" text not null, "created_at" timestamptz not null, "paid_at" timestamptz null, "cancelled_at" timestamptz null, "cancel_reason" varchar(255) null, "expires_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "orders" add constraint "orders_status_check" check ("status" in ('reserved', 'paid', 'cancelled', 'expired'));`);

    this.addSql(`create table "order_items" ("id" varchar(255) not null, "order_id" varchar(255) not null, "quantity" int not null, "unit_price" numeric(10,0) not null, "ticket_type_id" varchar(255) not null, primary key ("id"));`);

    this.addSql(`alter table "order_items" add constraint "order_items_order_id_foreign" foreign key ("order_id") references "orders" ("id");`);
  }

}
