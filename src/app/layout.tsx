import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavHeader from "@/components/NavHeader";
import ThemeScript from "@/components/ThemeScript";
import FontSizeScript from "@/components/FontSizeScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BNI ENISHIチャプター メンバー管理",
  description: "BNIメンバー登録・グループ編成ツール",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BNI ENISHI",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

// スマホでホーム画面に追加した際、アドレスバーのない standalone 表示になるよう
// manifest.json 側の display 設定と合わせてテーマカラーもここで明示する。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#18181b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeScript />
        <FontSizeScript />
        <NavHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
