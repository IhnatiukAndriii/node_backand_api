import db from '../src/config/database';

async function main() {
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    console.error('Usage: ts-node ./scripts/resetUser.ts <phone_number>');
    process.exit(1);
  }

  try {
    const user = await db('users')
      .select('id')
      .where({ phone_number: phoneNumber })
      .first();

    if (!user) {
      console.log(`No user found for phone_number=${phoneNumber}. Nothing to reset.`);
      return;
    }

    const userId = user.id;

    await db('habits').where({ user_id: userId }).del();
    await db('conversations').where({ user_id: userId }).del();

    console.log(`Reset completed for phone_number=${phoneNumber} (user_id=${userId}).`);
  } catch (error) {
    console.error('Failed to reset user data:', error);
  } finally {
    await db.destroy();
  }
}

main();
