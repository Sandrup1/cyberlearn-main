"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import "../../../components/shop.css";

const products = [
  {
    id: 1,
    name: "Paddling Pool Shoes",
    price: "₹9.89",
  },
  {
    id: 2,
    name: "First Impression Costumes",
    price: "₹49.64",
  },
  {
    id: 3,
    name: "Dancing In The Dark",
    price: "₹50.45",
  },
  {
    id: 4,
    name: "The Alternative Christmas Tree",
    price: "₹83.81",
  },
];

function UnionLabInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category =
    searchParams.get("category") ||
    "Clothing, shoes and accessories";

  // Normalize payload
  const normalizedCategory = decodeURIComponent(category)
    .replace(/\+/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

  // Correct payload = 3 columns
  const solved =
    normalizedCategory ===
    "'unionselectnull,null,null--";

  // Detect UNION attempts
  const attemptedUnion =
    normalizedCategory.includes("unionselect");

  // Wrong UNION payload = Internal Server Error
  if (attemptedUnion && !solved) {
    return (
      <div className="server-error-container">
        <div className="server-error-box">
          <h1 className="server-error-title">
            Internal Server Error
          </h1>
          <p className="server-error-text">
            The UNION query returned an incorrect number of columns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container bg-gray">
      {/* Header */}
      <div className="shop-header border-orange">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between px-8 py-5" style={{ padding: 0 }}>
          {/* Left */}
          <div>
            <h2 className="header-title-text">
              SQL injection UNION attack, determining the number of columns returned by the query
            </h2>

            <div className="flex items-center gap-4 mt-5" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button 
                onClick={() => router.push("/learn/sqli/lab3")}
                className="header-back-btn-orange"
              >
                Back to lab home
              </button>

              <span className="header-desc-link-orange" style={{ cursor: "pointer" }} onClick={() => router.push("/learn/sqli/lab3")}>
                Back to lab description &raquo;
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="header-status-badge-outline">
            <div className="badge-label">
              Lab
            </div>
            <div className="badge-val">
              {solved ? "Solved" : "Not solved"}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="shop-main" style={{ maxWidth: "1200px", paddingLeft: "2rem", paddingRight: "2rem" }}>
        {/* Top Nav */}
        <div className="shop-top-nav">
          <Link href="#" className="shop-top-nav-link">
            Home
          </Link>
          <span>|</span>
          <Link href="#" className="shop-top-nav-link">
            My account
          </Link>
        </div>

        {/* Shop Logo */}
        <div className="shop-logo-section">
          <div className="shop-logo-subtitle">
            WE LIKE TO
          </div>
          <div className="shop-logo-title-wrap">
            <h1 className="shop-logo-title blue-theme">
              SHOP
            </h1>
            <div className="shop-logo-decor-char">
              ⌐
            </div>
          </div>
        </div>

        {/* Category */}
        <h1 className="shop-page-title">
          {category}
        </h1>

        {/* Filters */}
        <div className="refine-bar blue-border">
          <h3 className="refine-label dark-gray">
            Refine your search:
          </h3>

          <div className="refine-links-wrapper white-btn-theme">
            {[
              "All",
              "Clothing, shoes and accessories",
              "Corporate gifts",
              "Lifestyle",
              "Pets",
              "Toys & Games",
            ].map((item) => (
              <Link
                key={item}
                href={`?category=${encodeURIComponent(item)}`}
                className="white-box-link"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="union-list-container">
          {products.map((product) => (
            <div
              key={product.id}
              className="union-list-row"
            >
              <div className="union-item-name">
                {product.name}
              </div>

              <div className="union-item-price">
                {product.price}
              </div>

              <div className="union-btn-cell">
                <button className="union-details-btn">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UnionLab() {
  return (
    <Suspense fallback={<div className="shop-container bg-gray" style={{ padding: "2rem", color: "#ccc" }}>Loading Shop...</div>}>
      <UnionLabInner />
    </Suspense>
  );
}
