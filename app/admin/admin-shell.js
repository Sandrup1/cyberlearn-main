"use client";

import AdminSidebar from "./components/admin-sidebar";
import AdminTopbar from "./components/admin-topbar";
import "./admin-shell.css";

export default function AdminShell({ children }) {
  return (
    <div className="admin-shell-container">
      <AdminSidebar />
      <div className="admin-main-wrapper">
        <AdminTopbar />
        <div className="admin-content-area">{children}</div>
      </div>
    </div>
  );
}
