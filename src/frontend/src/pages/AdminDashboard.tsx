import { CalendarCheck, Scissors, Users } from "lucide-react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { DailyAttendanceTab } from "./admin/DailyAttendanceTab";
import { StaffManagementTab } from "./admin/StaffManagementTab";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("attendance");

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-salon-pattern">
      {/* Hero Banner */}
      <div className="bg-salon-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-16 -translate-x-16" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 border border-white/20">
              <Scissors size={20} className="text-white rotate-45" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-white/60 text-sm">
                Fancy Looks Salon · Attendance Management
              </p>
            </div>
          </div>
        </div>
        {/* Gold bottom border */}
        <div className="h-0.5 w-full bg-gold-shimmer" />
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-white border border-salon-rose-light/40 shadow-salon p-1 h-12">
            <TabsTrigger
              value="attendance"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-salon-hero data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <CalendarCheck size={15} />
              Daily Attendance
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-salon-hero data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Users size={15} />
              Staff Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="animate-fade-in-up">
            <DailyAttendanceTab />
          </TabsContent>
          <TabsContent value="staff" className="animate-fade-in-up">
            <StaffManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
