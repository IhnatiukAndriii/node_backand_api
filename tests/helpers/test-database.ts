import knex from 'knex';
import path from 'path';

type KnexInstance = ReturnType<typeof knex>;

export function createTestDatabase(dbName: string): KnexInstance {
	const config = {
		client: 'better-sqlite3',
		connection: {
			filename: path.join(process.cwd(), 'db', dbName),
		},
		useNullAsDefault: true,
	};

	return knex(config);
}

export async function setupTestDatabase(db: KnexInstance): Promise<void> {
	await db.migrate.latest();
}

export async function cleanupTestDatabase(db: KnexInstance): Promise<void> {
	await db('conversations').del();
	await db('habits').del();
	await db('users').del();
}

export async function destroyTestDatabase(db: KnexInstance): Promise<void> {
	await db.destroy();
}
