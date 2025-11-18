import knex, { Knex } from 'knex';

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
			filename: ':memory:',
		},
		useNullAsDefault: true,
	},
};

const environment = process.env.NODE_ENV || 'development';

const db = knex(config[environment]);

export default db;