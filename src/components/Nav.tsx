"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "New Invoice" },
  { href: "/invoices", label: "Invoices" },
  { href: "/expenses", label: "Expenses" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide nav on login page
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="flex items-center gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm px-3 py-1 rounded-md transition ${
            pathname === link.href
              ? "bg-white/20 text-white font-medium"
              : "text-blue-200 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="text-sm px-3 py-1 rounded-md text-blue-200 hover:text-white hover:bg-white/10 transition ml-2"
      >
        Logout
      </button>
    </nav>
  );
}
