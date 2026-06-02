"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./admin-sidebar.css";

function isActive(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    match: (pathname) => isActive(pathname, "/admin"),
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    match: (pathname) => isActive(pathname, "/admin/users"),
  },
  {
    label: "Manage Quizzes",
    href: "/admin/quizzes",
    match: (pathname) => isActive(pathname, "/admin/quizzes"),
  },
  {
    label: "Manage Courses",
    href: "/admin/courses",
    match: (pathname) => isActive(pathname, "/admin/courses"),
  },
  {
    label: "Manage Labs",
    href: "/admin/labs",
    match: (pathname) => isActive(pathname, "/admin/labs"),
  },
  {
    label: "Settings",
    href: "/settings",
    match: (pathname) => isActive(pathname, "/settings"),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          CyberLearn AI
        </div>
        <div className="admin-sidebar-tag">
          Admin Panel
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-list">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-item ${active ? "active" : "inactive"}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
