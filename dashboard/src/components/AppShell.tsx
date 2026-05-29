"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AgentM } from "./AgentM";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
      <AgentM />
    </>
  );
}
