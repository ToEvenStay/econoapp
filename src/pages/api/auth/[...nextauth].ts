// src/pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code: string, ...message: any[])  { console.error("NextAuth error:", code, ...message); },
    warn(code: string, ...message: any[])   { console.warn("NextAuth warn:",  code, ...message); },
    debug(code: string, ...message: any[])  { console.debug("NextAuth dbg:",   code, ...message); },
  },
  events: {
    async error(error: any) {
      console.error("NextAuth EVENT error:", error);
    }
  },
};

export { authOptions };

export default NextAuth(authOptions);
