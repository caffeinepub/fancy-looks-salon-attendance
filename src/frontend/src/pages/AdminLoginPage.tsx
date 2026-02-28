import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Scissors, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const ADMIN_PASSWORD = "fancy0308";

interface AdminLoginPageProps {
  onLogin: () => void;
}

export function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate slight delay for UX polish
    await new Promise((r) => setTimeout(r, 600));

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdminLoggedIn", "true");
      onLogin();
      navigate({ to: "/admin" });
    } else {
      setError("Incorrect password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-salon-pattern">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: "oklch(0.52 0.22 10)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "oklch(0.72 0.14 75)" }}
        />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-salon-lg overflow-hidden border border-salon-rose-light/40">
          {/* Header Banner */}
          <div className="bg-salon-hero p-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

            <div className="relative z-10">
              <div className="flex justify-center mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 border border-white/20">
                  <Scissors size={24} className="text-white rotate-45" />
                </div>
              </div>
              <h1 className="font-display text-2xl font-bold text-white">
                Fancy Looks Salon
              </h1>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-white/70 text-xs tracking-widest uppercase">
                <Sparkles size={10} />
                Attendance System · by SUMIT
                <Sparkles size={10} />
              </div>
            </div>
          </div>

          {/* Gold ornament */}
          <div className="h-1 w-full bg-gold-shimmer" />

          {/* Form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="font-display text-xl font-semibold text-salon-charcoal">
                Admin Access
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your password to manage attendance
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="pl-9 pr-10 h-11 border-border focus:border-salon-rose"
                    placeholder="Enter admin password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 animate-fade-in-up">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full h-11 bg-salon-hero text-white font-medium hover:opacity-90 transition-opacity shadow-salon"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock size={16} />
                    Login as Admin
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="ornament-divider text-xs text-muted-foreground">
                <span>Fancy Looks Salon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
