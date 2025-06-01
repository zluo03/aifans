import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI灵感社 - aifans",
  description: "AI爱好者的社区平台，分享AI创作的图片、视频、提示词及学习笔记",
  keywords: ["AI", "人工智能", "AI绘画", "AI视频", "提示词", "学习笔记"],
  authors: [{ name: "AI灵感社" }],
  creator: "AI灵感社",
  publisher: "AI灵感社",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://aifans.pro",
    siteName: "AI灵感社",
    title: "AI灵感社 - aifans",
    description: "AI爱好者的社区平台，分享AI创作的图片、视频、提示词及学习笔记",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI灵感社 - aifans",
    description: "AI爱好者的社区平台，分享AI创作的图片、视频、提示词及学习笔记",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  icons: {
    icon: "/icon/favicon.ico",
    apple: "/icon/apple-touch-icon.png",
  },
  themeColor: "#00d9b8",
}; 