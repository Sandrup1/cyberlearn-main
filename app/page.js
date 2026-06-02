"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("cyberlearn:user-profile");
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        if (profile && profile.email && profile.email !== "student@cyberlearn.local") {
          setTimeout(() => {
            setIsLoggedIn(true);
            if (profile.role === "Admin") {
              setIsAdmin(true);
            }
          }, 0);
        }
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <h1 className={styles.logo}>CyberLearn AI</h1>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href={isLoggedIn ? "/learn" : "#learn"} className={styles.navLink}>Learn</Link>

          {isLoggedIn ? (
            <Link href={isAdmin ? "/admin" : "/dashboard"}>
              <button className={styles.signupButton}>
                {isAdmin ? "Admin Panel" : "Go to Dashboard"}
              </button>
            </Link>
          ) : (
            <Link href="/signup">
              <button className={styles.signupButton}>
                Sign Up
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>
            Master Cybersecurity Through Practical Learning
          </h1>

          <p className={styles.heroText}>
            Build real-world cybersecurity skills through structured theory and
            hands-on labs. Learn at your own pace with AI-powered insights and
            personalized recommendations.
          </p>

          <Link href={isLoggedIn ? (isAdmin ? "/admin" : "/dashboard") : "/signup"}>
            <button className={styles.getStartedButton}>
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
            </button>
          </Link>
        </div>
      </section>

      {/* Learning Section */}
      <section id="learn" className={styles.learningSection}>
        <h2 className={styles.learningTitle}>What you will learn</h2>

        <div className={styles.cardContainer}>
          {[
            {
              title: "SQL Injection",
              desc: "Database security and SQL injection prevention",
            },
            {
              title: "XSS",
              desc: "Cross-Site Scripting attacks and prevention",
            },
            {
              title: "CSRF",
              desc: "Cross-Site Request Forgery protection",
            },
            {
              title: "XXE",
              desc: "XML External Entity vulnerability handling",
            },
          ].map((item, index) => (
            <div key={index} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
