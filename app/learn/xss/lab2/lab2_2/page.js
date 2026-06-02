"use client";

import { useState } from "react";
import "../../../components/xss-lab.css";

export default function StoredXSSLab() {
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  const [solved, setSolved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // STRICT website validation
    const websiteRegex = /^http:\/\/www\.[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;

    if (!websiteRegex.test(website)) {
      setError("Website must be in format: http://www.example.com");
      return;
    }

    setError("");

    const newComment = {
      text: comment,
      name,
      email,
      website,
    };

    setComments([...comments, newComment]);

    // Solve immediately after posting payload
    if (comment.trim() === "<script>alert(1)</script>") {
      setSolved(true);
    }

    // Reset fields
    setComment("");
    setName("");
    setEmail("");
    setWebsite("");
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

          <span
            className={`xss-status-badge ${
              solved ? "solved" : "unsolved"
            }`}
          >
            {solved ? "Solved" : "Not solved"}
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {solved && (
        <div className="xss-success-banner">
          Congratulations, you solved the lab!
        </div>
      )}

      {/* Content */}
      <div className="xss-content-wrap">
        <div className="xss-main-width">
          {/* Blog Image */}
          <div className="xss-blog-img-placeholder">
            <span className="xss-blog-img-text">Blog Image</span>
          </div>

          {/* Title */}
          <h2 className="xss-blog-title">A Perfect World</h2>
          <p className="xss-blog-meta">
            Fred Time | 08 April 2026
          </p>

          {/* Content */}
          <p className="xss-blog-text">
            As the fight against crime is failing miserably, experiments are being conducted...
          </p>

          {/* Comments */}
          <h3 className="xss-section-title">Comments</h3>

          <div className="comments-list">
            {comments.map((c, index) => (
              <div key={index} className="comment-card">
                {/* ⚠️ Stored XSS vulnerability */}
                <div
                  dangerouslySetInnerHTML={{ __html: c.text }}
                />

                <p className="comment-author-meta">
                  — {c.name}
                </p>
              </div>
            ))}
          </div>

          {/* Comment Form */}
          <h3 className="xss-section-title">Leave a comment</h3>

          <form onSubmit={handleSubmit} className="xss-form">
            <textarea
              placeholder="Comment"
              className="xss-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <input
              type="text"
              placeholder="Name"
              className="xss-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Email"
              className="xss-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="text"
              placeholder="Website"
              className="xss-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            {/* Error Message */}
            {error && (
              <p className="xss-error-text">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="xss-submit-btn"
            >
              Post Comment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
