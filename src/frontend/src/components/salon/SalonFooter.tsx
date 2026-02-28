import { Heart, Scissors } from "lucide-react";

export function SalonFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-salon-rose-light/30">
      {/* Gold accent */}
      <div className="h-0.5 w-full bg-gold-shimmer" />

      <div className="bg-salon-charcoal">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Scissors size={14} className="text-salon-gold rotate-45" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-white">
                  Fancy Looks Salon
                </div>
                <div className="font-body text-[10px] tracking-widest text-salon-gold uppercase">
                  Attendance System · by SUMIT
                </div>
              </div>
            </div>

            {/* Attribution */}
            <p className="text-sm text-white/50 flex items-center gap-1.5">
              © {year}. Built by{" "}
              <Heart size={13} className="text-salon-gold fill-salon-gold" />{" "}
              <span className="text-salon-gold font-semibold">SUMIT</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
