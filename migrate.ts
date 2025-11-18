import knex from 'knex';
import knexConfig from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

async function runMigrations() {
  try {
    console.log('Running migrations...');
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('Already up to date');
    } else {
      console.log(`Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach((migration: string) => console.log(`- ${migration}`));
    }
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function rollbackMigrations() {
  try {
    console.log('Rolling back last batch...');
    
    const [batchNo, log] = await db.migrate.rollback();

    if (log.length === 0) {
      console.log('Already at the base migration');
    } else {
      console.log(`Batch ${batchNo} rolled back: ${log.length} migrations`);
      log.forEach((migration: string) => console.log(`- ${migration}`));
    }
    
    console.log('Rollback completed successfully!');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

const command = process.argv[2];

if (command === 'rollback') {
  rollbackMigrations();
} else {
  runMigrations();
}
