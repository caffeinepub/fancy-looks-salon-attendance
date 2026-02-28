import { Link } from "@tanstack/react-router";
import {
  BarChart2,
  CalendarCheck,
  ChevronRight,
  Clock,
  Scissors,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useGetAllStaff } from "../hooks/useQueries";

function getTodayStr() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HomePage() {
  const { data: staff } = useGetAllStaff();

  const features = [
    {
      icon: <Clock size={22} className="text-salon-gold" />,
      title: "Time Entry",
      description:
        "Staff can quickly log their daily check-in and check-out times",
      to: "/staff-entry",
      cta: "Log Your Time",
      color: "from-salon-gold/10 to-salon-gold-light/20",
    },
    {
      icon: <CalendarCheck size={22} className="text-salon-rose" />,
      title: "Daily Attendance",
      description:
        "Admin marks present/absent for each staff member with a simple checkbox",
      to: "/admin",
      cta: "View Attendance",
      color: "from-salon-rose-light/60 to-salon-cream",
      adminOnly: true,
    },
    {
      icon: <BarChart2 size={22} className="text-present-text" />,
      title: "Monthly Reports",
      description:
        "Detailed attendance history with late detection and monthly summaries",
      to: "/reports",
      cta: "View Reports",
      color: "from-present-bg to-salon-cream",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="bg-salon-hero relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.03] -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/[0.04] translate-y-24 -translate-x-24" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/20">
                <Scissors size={16} className="text-white rotate-45" />
              </div>
              <span className="text-white/60 text-sm tracking-widest uppercase">
                Attendance System
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
              Fancy Looks <span className="shimmer-text">Salon</span>
            </h1>
            <p className="font-display text-xl text-white/60 mt-1 italic">
              by SUMIT
            </p>

            <p className="mt-4 text-white/70 text-base leading-relaxed max-w-lg">
              A complete attendance management solution for your salon team.
              Track daily attendance, manage staff schedules, detect late
              arrivals, and generate monthly reports.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
              <Sparkles size={12} className="text-salon-gold" />
              <span>Today is {getTodayStr()}</span>
              {staff && staff.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <Users size={12} />
                  <span>{staff.length} staff registered</span>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/staff-entry">
                <Button className="gap-2 bg-white text-salon-charcoal hover:bg-white/90 font-medium shadow-salon-lg h-11 px-5">
                  <Clock size={16} />
                  Log My Attendance
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 h-11 px-5"
                >
                  <BarChart2 size={16} />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gold bottom border */}
        <div className="h-0.5 w-full bg-gold-shimmer" />
      </section>

      {/* Quick Access Cards */}
      <section className="bg-salon-pattern py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="ornament-divider text-sm text-muted-foreground mb-3">
              <span className="font-display italic text-salon-charcoal/60">
                Quick Access
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-salon-charcoal">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Navigate to any section from here
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className={`group bg-gradient-to-br ${feature.color} rounded-2xl border border-border p-5 hover-lift shadow-xs animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-xs">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-salon-charcoal">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <Link to={feature.to}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between gap-1.5 text-salon-rose-deep hover:bg-white/80 hover:text-salon-rose group-hover:bg-white/60"
                  >
                    {feature.cta}
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin CTA */}
      <section className="py-10 bg-salon-charcoal">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10">
                <Shield size={18} className="text-salon-gold" />
              </div>
              <div>
                <h3 className="font-display text-white font-semibold">
                  Admin Access
                </h3>
                <p className="text-white/50 text-xs">
                  Manage staff and mark daily attendance
                </p>
              </div>
            </div>
            <Link to="/admin-login">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
              >
                <Shield size={15} />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
