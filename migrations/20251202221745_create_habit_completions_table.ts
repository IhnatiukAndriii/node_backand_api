import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
return knex.schema.createTable('Habit completions', (table) =>{
table.increments('id').primary();
table.integer('habit_id').notNullable()
 .references('id').inTable('habbits').onDelete('CASCADE');
 table.integer('user_id').notNullable()
 .references('id').inTable('users').onDelete('CASCADE');
 table.timestamp('completed_at').defaultTo(knex.fn.now());
 table.time('scheduled_time').nullable();
 table.text('note').nullable();

    table.index(['habit_id', 'completed_at']);
    table.index(['user_id', 'completed_at']);
 });
}


export async function down(knex: Knex): Promise<void> {

return knex.schema.dropTable('habit_completions');
}

