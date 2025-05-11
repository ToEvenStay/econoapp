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
  logger: {
    error(code, metadata) {
      console.error('NextAuth ERROR', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth WARN', code)
    },
    debug(code, metadata) {
      console.debug('NextAuth DEBUG', code, metadata)
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
  }
}

export default NextAuth(authOptions)
