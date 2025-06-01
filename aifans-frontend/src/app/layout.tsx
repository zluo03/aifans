import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { NavMenu } from "@/components/nav-menu";
import { UserAvatar } from "@/components/user-avatar";
import { Toaster } from 'sonner';
import { SocialMediaFooter } from "@/components/social-media/social-media-footer";

import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen bg-background overflow-hidden`}
      >
          <AuthProvider>
              <div className="h-screen flex flex-col">
              <header className="sticky top-0 z-[9999] bg-black text-white flex-shrink-0">
                <div className="container mx-auto px-4 flex items-center justify-between h-28">
                  <div className="flex items-center">
                    <Link href="/" className="flex items-center">
                      <Image
                        src="/icon/logo.svg"
                        alt="AI灵感社"
                        width={30}
                        height={30}
                        className="w-[30px] h-[30px]"
                      />
                    </Link>
                  </div>
                  <nav className="flex-1 flex items-center justify-center">
                    <NavMenu />
                  </nav>
                  <div className="flex items-center">
                    <UserAvatar />
                  </div>
                </div>
              </header>
            <main className="flex-1 container mx-auto px-4 py-1 overflow-y-auto">
                {children}
              </main>
            <footer className="h-14 bg-black text-white flex-shrink-0">
                <div className="container mx-auto px-4 h-full flex justify-between items-center">
                  <div className="text-gray-400 text-sm">
                    © {new Date().getFullYear()} AI灵感社 (aifans) - 分享AI创作的灵感
                  </div>
                  <div className="flex items-center" style={{ height: '100%' }}>
                    <SocialMediaFooter />
                  </div>
                </div>
              </footer>
              </div>
          <Toaster position="top-center" />
          </AuthProvider>
      </body>
    </html>
  );
}
