"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { markModuleLabSolved } from "../../../progress-state";
import "../../../components/shop.css";

const allProducts = [
  { id: 1, name: "Professional Football", price: "₹29.99", category: "Football", released: 1, img: "" },
  { id: 2, name: "Training Cones", price: "₹15.00", category: "Football", released: 1, img: "" },
  { id: 3, name: "Hidden Prototype Boot", price: "₹199.99", category: "Football", released: 0, img: "" },
  { id: 4, name: "Referee Whistle", price: "₹5.50", category: "Football", released: 1, img: "" },
  { id: 5, name: "Goalkeeper Gloves", price: "₹45.00", category: "Football", released: 0, img: "" },
  { id: 6, name: "Standard Shinguards", price: "₹12.00", category: "Other", released: 1, img: "" },
  { id: 7, name: "Lifestyle Hoodie", price: "₹55.00", category: "Lifestyle", released: 1, img: "" },
  { id: 8, name: "Pet Jersey", price: "₹25.00", category: "Pets", released: 1, img: "" },
];

function ShopLabInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category") || "";

  // Logic to determine if lab is solved
  const isSolved = categoryParam.toLowerCase().includes("' or 1=1") || categoryParam.includes("1=1");

  useEffect(() => {
    if (isSolved) {
      markModuleLabSolved("sqli", "lab1");
    }
  }, [isSolved]);

  const getFilteredProducts = () => {
    if (!categoryParam) return allProducts.filter(p => p.released === 1);
    
    if (isSolved) return allProducts; // Show everything if injected

    return allProducts.filter(p => 
      p.category.toLowerCase() === categoryParam.toLowerCase() && p.released === 1
    );
  };

  const filteredProducts = getFilteredProducts();

  // Helper to change category via URL
  const setCategory = (cat) => {
    if (cat === "All") {
      router.push("/learn/sqli/lab1/shop");
    } else {
      router.push(`/learn/sqli/lab1/shop?category=${cat}`);
    }
  };

  return (
    <div className="shop-container">
      {/* Header */}
      <div className="shop-header">
        <div className="shop-header-left">
          <button 
            onClick={() => router.back()}
            className="header-back-btn"
          >
            ← Back
          </button>
          <span className="header-brand">
            CyberLearn
          </span>
          <Link href="/learn/sqli/lab1" className="header-brand-desc-link">
            Back to lab description
          </Link>
        </div>
        
        <div className={`header-status-badge ${
          isSolved ? 'solved' : 'unsolved'
        }`}>
          LAB: {isSolved ? "SOLVED" : "NOT SOLVED"}
        </div>
      </div>

      {/* Success Banner */}
      {isSolved && (
        <div className="success-banner">
          Congratulations, you solved the lab!
        </div>
      )}

      <main className="shop-main">
        {/* Logo */}
        <div className="shop-logo-section">
          <h1 className="shop-logo-subtitle">WE LIKE TO</h1>
          <h2 className="shop-logo-title">SHOP</h2>
        </div>

        {/* Refine Search Bar */}
        <div className="refine-bar">
          <span className="refine-label">Refine search:</span>
          <div className="refine-links-wrapper">
            {["All", "Football", "Lifestyle", "Pets"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`refine-tab-btn ${
                  (categoryParam === cat || (cat === "All" && !categoryParam)) 
                    ? "active" 
                    : "inactive"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="product-grid-gallery">
          {filteredProducts.map((product) => (
            <div key={product.id} className="shop-product-card">
              <div className="product-img-box">
                {product.img}
              </div>
              <div className="product-card-body">
                <div className="product-card-header-row">
                  <h3 className="product-card-name">{product.name}</h3>
                  {product.released === 0 && (
                    <span className="hidden-badge">HIDDEN</span>
                  )}
                </div>
                <div className="stars-rating">★★★★★</div>
                <p className="product-price">{product.price}</p>
              </div>
              <button className="view-details-btn">
                View details
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ShopLab() {
  return (
    <Suspense fallback={<div className="shop-container" style={{ padding: "2rem", color: "#ccc" }}>Loading Shop...</div>}>
      <ShopLabInner />
    </Suspense>
  );
}
