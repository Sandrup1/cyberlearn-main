"use client";

import { useState } from "react";
import Link from "next/link";
import { useCsrfLab1Solved } from "../../lab-state";
import "./my-account.css";

export default function MyAccountPage() {
  const solved = useCsrfLab1Solved();
  const [email, setEmail] = useState("test1@test.ca");
  const [inputEmail, setInputEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      setMessage("Please enter a valid email address.");
      return;
    }
    setEmail(inputEmail.trim());
    setInputEmail("");
    setMessage("Email updated successfully.");
  };

  return (
    <div className="my-account-container">
      {/* Academy Lab Banner */}
      <header className="lab-banner">
        <div className="lab-banner-wrapper">
          <h1 className="lab-banner-title">
            CSRF vulnerability with no defenses
          </h1>
          <div className="lab-banner-actions">
            <Link href="/learn/csrf/lab1" className="link-back-desc">
              Back to lab description &raquo;
            </Link>
            <Link href="/learn/csrf/lab1/exploit-server" className="btn-exploit-server">
              Go to exploit server
            </Link>
            <div className="status-badge-container">
              <span className="status-badge-label">LAB</span>
              <span className="status-badge-val" style={{ color: solved ? "#166534" : "#9a3412" }}>
                {solved ? "Solved" : "Not solved"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Account Portal */}
      <main className="account-content-wrapper">
        <nav className="account-navbar">
          <Link href="#" className="account-nav-link">Home</Link>
          <span>|</span>
          <Link href="#" className="account-nav-link">My account</Link>
          <span>|</span>
          <Link href="#" className="account-nav-link">Log out</Link>
        </nav>

        <h2 className="account-title">My Account</h2>
        
        <p className="account-info-text">
          Your username is: <strong>wiener</strong>
        </p>
        <p className="account-info-text">
          Your email is: <strong>{email}</strong>
        </p>

        {message && (
          <p style={{ 
            color: message.includes("success") ? "#2d8a6b" : "#b91c1c", 
            fontWeight: "bold",
            marginTop: "1rem",
            marginBottom: "0.5rem"
          }}>
            {message}
          </p>
        )}

        <div className="email-form-card">
          <form onSubmit={handleUpdateEmail}>
            <label className="form-label" htmlFor="email-field">Email</label>
            <input
              id="email-field"
              type="email"
              value={inputEmail}
              placeholder="Enter new email..."
              onChange={(e) => setInputEmail(e.target.value)}
              className="email-input"
            />
            <button type="submit" className="btn-update-email">
              Update email
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
