import { Crown, Scissors, Star, Users } from "lucide-react";
import { useLocalStaff } from "../hooks/useLocalStaff";

export function PremiumStaffPage() {
  const { staff } = useLocalStaff();
  const premiumStaff = staff.filter((s) => s.isPremium);

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-salon-pattern">
      {/* Banner */}
      <div className="bg-salon-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-16 -translate-x-16" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 border border-white/20">
              <Crown size={20} className="text-salon-gold" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Premium Staff
              </h1>
              <p className="text-white/60 text-sm">
                Staff with no time maintenance required
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gold-shimmer" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-lg">
          <div className="bg-white rounded-2xl shadow-salon-lg border border-salon-rose-light/40 overflow-hidden animate-fade-in-up">
            {/* Card Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-gradient-to-r from-salon-gold/10 to-salon-cream">
              <Crown size={16} className="text-salon-gold" />
              <span className="font-display text-sm font-semibold text-foreground">
                Premium Members
              </span>
              <Scissors
                size={14}
                className="text-muted-foreground ml-auto rotate-45"
              />
              <span className="text-sm text-muted-foreground">
                Fancy Looks Salon
              </span>
            </div>

            {premiumStaff.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-salon-gold/10 flex items-center justify-center">
                  <Users size={28} className="text-salon-gold opacity-60" />
                </div>
                <h3 className="font-display text-lg font-medium text-salon-charcoal">
                  No Premium Staff Yet
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Admin can mark staff as Premium from the Staff Management tab.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {premiumStaff.map((s, idx) => (
                  <div
                    key={String(s.id)}
                    className="flex items-center gap-4 rounded-xl border border-salon-gold/20 bg-gradient-to-r from-salon-gold/5 to-salon-cream p-4 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-salon-gold/20 font-display font-bold text-salon-charcoal text-sm flex-shrink-0 relative">
                      {s.name.slice(0, 2).toUpperCase()}
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-salon-gold flex items-center justify-center">
                        <Crown size={10} className="text-white" />
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {s.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-salon-gold">
                        <Star size={10} fill="currentColor" />
                        <span>Premium Staff · No time tracking required</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {premiumStaff.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              {premiumStaff.length} premium staff member
              {premiumStaff.length !== 1 ? "s" : ""} registered
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
