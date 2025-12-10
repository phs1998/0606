import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import ConditionalNavbar from '@/components/layout/ConditionalNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AOI - 个人介绍与轻社区',
  description: '个人介绍与轻社区平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <ConditionalNavbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
