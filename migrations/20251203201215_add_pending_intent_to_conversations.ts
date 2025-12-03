import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('conversations', (table) => {
    table.text('pending_intent').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('conversations', (table) => {
    table.dropColumn('pending_intent');
  });
}

