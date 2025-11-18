import type { Knex } from 'knex';
import path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, './database.sqlite'),
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    useNullAsDefault: true,
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
    },
    useNullAsDefault: true,
  },
};

export default config;