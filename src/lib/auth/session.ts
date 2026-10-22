import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import "server-only";

const SESSION_COOKIE_NAME = 'chat_session_id';

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  const newSessionId = uuidv4();
  // Set the cookie for 30 days
  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return newSessionId;
}
