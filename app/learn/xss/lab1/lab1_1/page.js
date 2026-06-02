"use client";

import { useState } from "react";
import "../../../components/xss-lab.css";

export default function XSSLabPage() {
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [solved, setSolved] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchValue(query);

    // Detect XSS payload
    if (query.trim() === "<script>alert(1)</script>") {
      setSolved(true);
      alert("Lab Solved ✅");
    }
  };

  return (
    <div className="xss-lab-container">
      {/* Top Bar */}
      <div className="xss-top-bar">
        <h1 className="xss-top-bar-title">Web Security Academy</h1>

        <div className="xss-top-bar-badge-area">
          <span className="xss-lab-badge">
            LAB
          </span>

          <span className={`xss-status-badge ${
            solved ? "solved" : "unsolved"
          }`}>
            {solved ? "Solved" : "Not solved"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="xss-content-wrap">
        <div className="xss-main-width">
          {/* Title */}
          <h2 className="xss-lab-title">
            Reflected XSS Lab
          </h2>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="xss-form search-form"
          >
            <input
              type="text"
              placeholder="Search the blog..."
              className="xss-input flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button
              type="submit"
              className="xss-submit-btn search-btn"
            >
              Search
            </button>
          </form>

          {/* Reflected Output (VULNERABLE) */}
          {searchValue && (
            <div className="xss-reflected-box">
              <p className="xss-reflected-label">Search results for:</p>

              {/* ⚠️ Intentionally vulnerable */}
              <div
                dangerouslySetInnerHTML={{ __html: searchValue }}
              />
            </div>
          )}

          {/* Blog Post */}
          <div className="xss-blog-preview-card">
            <h3 className="xss-preview-card-title">Identity Theft</h3>
            <p className="xss-preview-card-text">
              I&apos;m guessing all the people that used to steal people&apos;s identities
              are probably very lazy now...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
