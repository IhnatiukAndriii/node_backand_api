import db from '../src/config/database';

async function main() {
  try {
    await db('habits').del();
    console.log('All habits deleted successfully');
  } catch (error) {
    console.error('Failed to delete habits:', error);
  } finally {
    await db.destroy();
  }
}

main();
