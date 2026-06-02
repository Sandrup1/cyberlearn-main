"use client";

import { useState } from "react";
import "./login.css";

export default function LabLoginBypass() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [solved, setSolved] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Exact SQLi payload check
    if (username.trim() === "administrator'--") {
      setSolved(true);
      setMessage("Welcome back, administrator");
    } else {
      setMessage("Invalid username or password");
    }
  };

  return (
    <div className="login-lab-container">
      <div className="login-lab-card">

        {/* Header */}
        <div className="login-lab-header">
          <h1 className="login-lab-title">
            SQL injection vulnerability allowing login bypass
          </h1>

          {/* Status */}
          <div className="login-lab-status-row">
            <div className="login-lab-badge">
              LAB
            </div>

            <div
              className={`login-lab-solved-indicator ${
                solved ? "solved" : "unsolved"
              }`}
            >
              {solved ? "Solved" : "Not solved"}
            </div>
          </div>

          {/* Description */}
          <div className="login-lab-description">
            <p>
              This lab contains a SQL injection vulnerability in the login
              function.
            </p>
            <p>
              To solve the lab, log in as the{" "}
              <span className="login-lab-code-inline">
                administrator
              </span>{" "}
              user without knowing the password.
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="login-form-box">
          <h2 className="login-form-title">Login</h2>

          <form onSubmit={handleLogin} className="login-form-fields">
            <div>
              <label className="login-field-label">
                Username
              </label>
              <input
                type="text"
                className="login-field-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="login-field-label">
                Password
              </label>
              <input
                type="password"
                className="login-field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="login-submit-btn"
            >
              Log in
            </button>
          </form>

          {/* Message */}
          {message && (
            <p className="login-status-message">
              {message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="login-lab-footer">
          CyberLearn // SQLi Lab
        </div>

      </div>
    </div>
  );
}
