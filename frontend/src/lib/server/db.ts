import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgres://486fe2ab108379a10f91f6cdae2da883b96dfea5790350398b6675447380a9d6:sk_d7pA754PQ4EWPQLRVilyl@db.prisma.io:5432/postgres?sslmode=require';

const globalPool = global as unknown as { pgPool?: Pool };

export const pool =
  globalPool.pgPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalPool.pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'rokad_super_secret_jwt_key_2026_romenu';

export interface AuthUser {
  id: string;
  mobile: string;
  role: 'admin' | 'cashier' | 'customer';
  name: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, mobile: user.mobile, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getAuthUser(req: Request): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.sub,
      mobile: decoded.mobile,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}
