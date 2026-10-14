import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { connectDB } from "@/server/db/mongoose";
import { Role, User } from "@/models";
import { assertRateLimit } from "@/server/services/rate-limit";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_login";
}

class RateLimitedLogin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) throw new InvalidLogin();
        try {
          await assertRateLimit(`login:${email}`, 8, 15 * 60 * 1000);
        } catch {
          throw new RateLimitedLogin();
        }
        await connectDB();
        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user?.active || !user.passwordHash) throw new InvalidLogin();
        const matches = await compare(password, user.passwordHash);
        if (!matches) throw new InvalidLogin();
        const role = await Role.findById(user.roleId).lean();
        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          sessionVersion: user.sessionVersion,
          roleKey: role?.key ?? "",
          permissions: role?.permissions ?? [],
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
        token.roleKey = user.roleKey ?? "";
        token.permissions = user.permissions ?? [];
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.uid ?? "");
      session.user.sessionVersion = Number(token.sessionVersion ?? 0);
      session.user.roleKey = String(token.roleKey ?? "");
      session.user.permissions = Array.isArray(token.permissions) ? token.permissions.map(String) : [];
      return session;
    },
  },
});
