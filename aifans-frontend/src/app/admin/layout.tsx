import { Metadata } from "next";
import React from "react";
import AdminGuard from "./components/admin-guard";

export const metadata: Metadata = {
  title: "管理后台 - AI灵感社",
  description: "AI灵感社管理后台",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <AdminGuard>
        {children}
      </AdminGuard>
    </div>
  );
} 