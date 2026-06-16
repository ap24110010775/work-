export type AuthProvider = 'google' | 'linkedin' | 'microsoft' | 'email';

export type AuthRole = 'candidate' | 'employer' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  role: AuthRole;
  avatar?: string;
};

const SESSION_KEY = 'workyaar.auth.user';

export const saveAuthUser = (user: AuthUser, token?: string) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) {
    window.localStorage.setItem('workyaar.auth.token', token);
  }
  window.dispatchEvent(new Event('workyaar-auth-change'));
};

export const getAuthUser = (): AuthUser | null => {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearAuthUser = () => {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('workyaar.auth.token');
  window.dispatchEvent(new Event('workyaar-auth-change'));
};

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();