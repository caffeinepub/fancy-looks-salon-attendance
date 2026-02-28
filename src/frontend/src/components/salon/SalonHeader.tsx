import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart2,
  ClipboardList,
  LogIn,
  LogOut,
  Menu,
  Scissors,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

interface SalonHeaderProps {
  isAdmin: boolean;
  onLogout: () => void;
}

export function SalonHeader({ isAdmin, onLogout }: SalonHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    {
      to: "/staff-entry",
      label: "Staff Entry",
      icon: <ClipboardList size={16} />,
      alwaysShow: true,
    },
    {
      to: "/reports",
      label: "Reports",
      icon: <BarChart2 size={16} />,
      alwaysShow: true,
    },
    {
      to: "/admin",
      label: "Dashboard",
      icon: <Users size={16} />,
      alwaysShow: isAdmin,
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-salon-rose-light/30 bg-white/80 backdrop-blur-md">
      {/* Gold top bar */}
      <div className="h-0.5 w-full bg-gold-shimmer" />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-salon-hero shadow-salon">
              <Scissors size={18} className="text-white rotate-45" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold text-salon-rose-deep sm:text-base">
                Fancy Looks Salon
              </div>
              <div className="font-body text-[10px] tracking-widest text-salon-gold uppercase">
                Attendance · by SUMIT
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((l) => l.alwaysShow)
              .map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? "bg-salon-rose-light text-salon-rose-deep"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

            {/* Admin link/logout */}
            {isAdmin ? (
              <div className="flex items-center gap-1 ml-2">
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/admin")
                      ? "bg-salon-rose-light text-salon-rose-deep"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Users size={16} />
                  Dashboard
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/admin-login" className="ml-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-salon-hero text-white hover:opacity-90 shadow-salon"
                >
                  <LogIn size={16} />
                  Admin Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Nav Toggle */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-salon-hero">
                  <div className="flex items-center gap-2">
                    <Scissors size={18} className="text-white rotate-45" />
                    <span className="font-display text-white font-semibold">
                      Fancy Looks
                    </span>
                  </div>
                  <button type="button" onClick={() => setMobileOpen(false)}>
                    <X size={20} className="text-white/80" />
                  </button>
                </div>

                {/* Links */}
                <nav className="flex-1 p-4 space-y-1">
                  {navLinks
                    .filter((l) => l.alwaysShow)
                    .map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                          isActive(link.to)
                            ? "bg-salon-rose-light text-salon-rose-deep"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                        isActive("/admin")
                          ? "bg-salon-rose-light text-salon-rose-deep"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Users size={16} />
                      Admin Dashboard
                    </Link>
                  )}
                </nav>

                {/* Bottom */}
                <div className="p-4 border-t">
                  {isAdmin ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => {
                        onLogout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut size={16} />
                      Logout
                    </Button>
                  ) : (
                    <Link
                      to="/admin-login"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button className="w-full gap-2 bg-salon-hero text-white">
                        <LogIn size={16} />
                        Admin Login
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
