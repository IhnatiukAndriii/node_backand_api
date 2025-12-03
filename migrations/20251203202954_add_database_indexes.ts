import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.index('phone_number', 'idx_users_phone');
  });

  await knex.schema.table('habits', (table) => {
    table.index('user_id', 'idx_habits_user');
    table.index(['user_id', 'status'], 'idx_habits_user_status');
    table.index('created_at', 'idx_habits_created');
  });

  await knex.schema.table('conversations', (table) => {
    table.index('user_id', 'idx_conversations_user');
    table.index('updated_at', 'idx_conversations_updated');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.dropIndex('phone_number', 'idx_users_phone');
  });

  await knex.schema.table('habits', (table) => {
    table.dropIndex('user_id', 'idx_habits_user');
    table.dropIndex(['user_id', 'status'], 'idx_habits_user_status');
    table.dropIndex('created_at', 'idx_habits_created');
  });

  await knex.schema.table('conversations', (table) => {
    table.dropIndex('user_id', 'idx_conversations_user');
    table.dropIndex('updated_at', 'idx_conversations_updated');
  });
}

