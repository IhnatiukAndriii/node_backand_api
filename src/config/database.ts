import knex from 'knex';
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
	development: {
		client: 'better-sqlite3',
		connection: {
			filename: './database.sqlite',
		},
		useNullAsDefault: true,
	},
	test: {
		client: 'better-sqlite3',
		connection: {
			filename: process.env.TEST_DB_PATH || './db/test_integration.db',
		},
		useNullAsDefault: true,
	},
};

const environment = process.env.NODE_ENV || 'development';

const db = knex(config[environment]);

export default db;