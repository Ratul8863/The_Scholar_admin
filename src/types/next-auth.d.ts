import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      sessionVersion: number;
      roleKey: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    sessionVersion?: number;
    roleKey?: string;
    permissions?: string[];
    remember?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    sessionVersion?: number;
    roleKey?: string;
    permissions?: string[];
    remember?: boolean;
    expiresAt?: number;
  }
}
