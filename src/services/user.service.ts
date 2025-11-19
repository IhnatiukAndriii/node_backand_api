import db from '../config/database';

export interface User {
  id: number;
  phone_number: string;
  created_at: string;
}
export async function getUserByPhoneNumber(
  phoneNumber: string,
): Promise<User | null> {
  const user = await db<User>('users')
    .where({ phone_number: phoneNumber })
    .first();
  return user || null;
}
export async function createUser(
  phoneNumber: string,
): Promise<User> {
  const inserted = await db<User>('users')
    .insert({ phone_number: phoneNumber })
    .returning('*');

  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  return row as User;
}
export async function findOrCreateUser(
  phoneNumber: string,
): Promise<User> {
  const existing = await getUserByPhoneNumber(phoneNumber);
  if (existing) {
    return existing;
  }

  const created = await createUser(phoneNumber);
  return created;
}