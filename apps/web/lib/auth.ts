import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { TestMode, TEST_USERS, type TestUser } from "./test-mode"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
import Kakao from "next-auth/providers/kakao"
import Naver from "next-auth/providers/naver"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID!,
      clientSecret: process.env.AUTH_NAVER_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id

        // 테스트 모드에서 추가 정보 설정
        if (TestMode.isEnabled()) {
          const testUser = TestMode.getUserByEmail(session.user.email || '')
          if (testUser) {
            session.user.role = testUser.role
            session.user.status = testUser.status === 'INACTIVE' ? 'SUSPENDED' : testUser.status
          }
        } else {
          // 일반 모드에서 데이터베이스에서 정보 가져오기
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, status: true }
          })
          if (dbUser) {
            session.user.role = dbUser.role
            session.user.status = dbUser.status
          }
        }
      }
      return session
    },
    signIn: async ({ user, account, profile }) => {
      // 테스트 모드에서는 모든 로그인 허용
      if (TestMode.isEnabled()) {
        return true
      }

      // 일반적인 OAuth 로그인 검증
      return true
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
