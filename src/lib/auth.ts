import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export function isAuthenticatedClient() {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;
    // Vérifie que le token n'est pas expiré
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUserFromToken(token: string) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export function verifyTokenServer(req: any) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
} 