"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIInsightsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/performance-insights");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "2.5rem", color: "#374151" }}>
      Redirecting to Performance Insights…
    </div>
  );
}
