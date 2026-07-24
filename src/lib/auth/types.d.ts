import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    locale?: string;
    status?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      locale: string;
      status: string;
      /** Epoch ms this JWT was minted — compared against `User.sessionsInvalidatedAt` for "sign out everywhere". */
      loginAt: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    locale?: string;
    status?: string;
    loginAt?: number;
  }
}
