"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F5F2" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 rounded-xl" style={{ background: "#fff", border: "1px solid #E8E7E4" }}>
        <h1 className="font-heading text-xl font-bold mb-1" style={{ color: "#383838" }}>Admin</h1>
        <p className="font-body text-sm mb-6" style={{ color: "#888" }}>Enter the admin password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full h-11 px-4 rounded-lg font-body text-sm mb-3 focus:outline-none focus:ring-2"
          style={{ border: "1px solid #D7DADD", color: "#383838" }}
          autoFocus
        />
        {error && <p className="text-sm mb-3 font-body" style={{ color: "#C4484E" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full h-11 rounded-lg font-body font-semibold text-sm"
          style={{
            background: password && !loading ? "#2A9D8F" : "#E8E7E4",
            color: password && !loading ? "#fff" : "#bcbcbc",
            border: "none",
            cursor: password && !loading ? "pointer" : "default",
          }}
        >
          {loading ? "Checking..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
