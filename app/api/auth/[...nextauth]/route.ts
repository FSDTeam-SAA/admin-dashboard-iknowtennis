import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          })

          if (res.data.status && res.data.data) {
            const { token, ...user } = res.data.data
            return {
              ...user,
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
            }
          }
          return null
        } catch (error) {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.role = user.role
        token.id = user._id
      }
      return token
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
