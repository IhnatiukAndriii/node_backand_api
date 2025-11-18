import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('conversations', (table) => {
       table.increments('id').primary();


       table.integer('user_id').notNullable()
          .references('id').inTable('users').onDelete('CASCADE');
        table.json('messages').notNullable();
         table.integer('total_tokens').defaultTo(0);
         table.timestamp('created_at').defaultTo(knex.fn.now());
         table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('conversations');
} 