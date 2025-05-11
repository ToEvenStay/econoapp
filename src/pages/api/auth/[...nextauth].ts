import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider  from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma }         from '../../../lib/prisma'

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from:   process.env.EMAIL_FROM!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  pages: {
    error: '/auth/error',
  },
  logger: {
    error(code, ...rest) {
      console.error('NEXTAUTH ERROR', code, ...rest);
    },
    warn(code, ...rest) {
      console.error('NEXTAUTH WARN', code, ...rest);
    },
    debug(code, ...rest) {
      console.error('NEXTAUTH DEBUG', code, ...rest);
    },
  },
  events: {
    // Par exemple, on loggue quand un utilisateur est créé
    async createUser({ user }) {
      console.log('EVENT createUser:', user)
    },
    // Ou quand on a un signIn (nouveau ou non)
    async signIn({ user, isNewUser }) {
      console.log('EVENT signIn:', user, 'isNewUser?', isNewUser)
    },
    // Tu peux ajouter signOut, updateUser, linkAccount, session si besoin
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.error('CALLBACK signIn:', { user, account, profile });
      return true;
    },
    async session({ session, token, user }) {
      console.error('CALLBACK session:', { session, token, user });
      return session;
    },
    async jwt({ token, user, account }) {
      console.error('CALLBACK jwt:', { token, user, account });
      return token;
    },
  },
}

export default NextAuth(authOptions)
