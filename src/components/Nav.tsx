"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "New Invoice" },
  { href: "/invoices", label: "Invoices" },
  { href: "/expenses", label: "Expenses" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4">
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
    </nav>
  );
}
