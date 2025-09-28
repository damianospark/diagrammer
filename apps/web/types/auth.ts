import { DefaultSession } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: 'USER' | 'ADMIN' | 'OWNER'
      status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    role: 'USER' | 'ADMIN' | 'OWNER'
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: 'USER' | 'ADMIN' | 'OWNER'
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  }
}

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role: 'USER' | 'ADMIN' | 'OWNER'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: AuthUser
  expires: string
}

export type UserRole = 'USER' | 'ADMIN' | 'OWNER'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
