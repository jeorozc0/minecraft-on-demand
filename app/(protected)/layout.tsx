"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { DoorOpenIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/theme-toggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import logo from "@/public/raw-removebg-preview.png";

function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="relative hidden h-10 w-10 md:block">
          <Image src={logo} alt="Logo" fill className="object-contain" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button variant="outline" size="icon" onClick={handleLogout}>
          <DoorOpenIcon className="size-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
