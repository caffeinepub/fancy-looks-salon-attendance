import {
  AlertCircle,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Scissors,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { AttendanceRecord } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLocalStaff } from "../hooks/useLocalStaff";
import {
  getAllMonthlyAttendance,
  getMonthlyAttendanceForStaff,
} from "../hooks/useQueries";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getDayName(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

// ── Individual Staff Monthly Report ───────────────────────────────────────────

function IndividualReport() {
  const { staff, isLoading } = useLocalStaff();
  const today = new Date();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const yearOptions = [
    today.getFullYear() - 1,
    today.getFullYear(),
    today.getFullYear() + 1,
  ];

  const selectedStaff = staff?.find((s) => String(s.id) === selectedStaffId);

  const attendanceData = selectedStaffId
    ? getMonthlyAttendanceForStaff(BigInt(selectedStaffId), year, month)
    : {};

  const daysInMonth = getDaysInMonth(year, month);
  const rows = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record: AttendanceRecord | undefined = attendanceData[dateStr];
    return { day, dateStr, record };
  });

  const totalPresent = rows.filter((r) => r.record?.isPresent).length;
  const totalAbsent = rows.filter(
    (r) => r.record && !r.record.isPresent,
  ).length;
  const totalLateIn = rows.filter((r) => r.record?.lateForIn).length;
  const totalLateOut = rows.filter((r) => r.record?.lateForOut).length;
  const totalDaysMarked = rows.filter((r) => r.record).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-xs">
        <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
          Filter Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">
              Staff Member
            </span>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staff?.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Month</span>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Year</span>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedStaffId ? (
        <div className="bg-white rounded-2xl border border-dashed border-salon-rose-light/60 p-12 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-salon-rose-light/50 flex items-center justify-center">
            <BarChart2 size={24} className="text-salon-rose opacity-60" />
          </div>
          <p className="text-muted-foreground text-sm">
            Select a staff member to view their monthly report.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Present",
                value: totalPresent,
                color: "text-present-text",
                bg: "bg-present-bg border-present-bg/40",
              },
              {
                label: "Absent",
                value: totalAbsent,
                color: "text-muted-foreground",
                bg: "bg-muted/40 border-border",
              },
              {
                label: "Late In",
                value: totalLateIn,
                color: "text-late-text",
                bg: "bg-late-bg border-late-border",
              },
              {
                label: "Late Out",
                value: totalLateOut,
                color: "text-late-text",
                bg: "bg-late-bg border-late-border",
              },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className={`rounded-xl border p-3 text-center ${bg}`}
              >
                <div className={`text-2xl font-bold font-display ${color}`}>
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Staff Info Bar */}
          {selectedStaff && (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-border p-3 shadow-xs">
              <div className="h-10 w-10 rounded-full bg-salon-rose-light font-display font-bold text-salon-rose-deep text-sm flex items-center justify-center">
                {selectedStaff.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{selectedStaff.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock size={11} className="text-salon-gold" />
                  Schedule:{" "}
                  {padTime(
                    Number(selectedStaff.scheduledInTime.hour),
                    Number(selectedStaff.scheduledInTime.minute),
                  )}
                  {" → "}
                  {padTime(
                    Number(selectedStaff.scheduledOutTime.hour),
                    Number(selectedStaff.scheduledOutTime.minute),
                  )}
                  <span className="text-border">|</span>
                  {MONTHS[month - 1]} {year}
                  <span className="text-border">|</span>
                  {totalDaysMarked} days recorded
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="salon-table">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Day</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">In Time</th>
                    <th className="text-center">Out Time</th>
                    <th className="text-center">Late In</th>
                    <th className="text-center">Late Out</th>
                    <th className="text-center">Late Mins</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ day, dateStr, record }) => {
                    const isLateRow = record?.lateForIn || record?.lateForOut;
                    return (
                      <tr key={dateStr} className={isLateRow ? "row-late" : ""}>
                        <td className="font-medium text-sm">
                          {String(day).padStart(2, "0")}
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {getDayName(dateStr)}
                        </td>
                        <td className="text-center">
                          {!record ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : record.isPresent ? (
                            <span className="pill-present">Present</span>
                          ) : (
                            <span className="pill-absent">Absent</span>
                          )}
                        </td>
                        <td className="text-center text-sm">
                          {record?.actualInTime ? (
                            <span
                              className={
                                record.lateForIn
                                  ? "text-late-text font-semibold"
                                  : "text-foreground"
                              }
                            >
                              {padTime(
                                Number(record.actualInTime.hour),
                                Number(record.actualInTime.minute),
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="text-center text-sm">
                          {record?.actualOutTime ? (
                            <span
                              className={
                                record.lateForOut
                                  ? "text-late-text font-semibold"
                                  : "text-foreground"
                              }
                            >
                              {padTime(
                                Number(record.actualOutTime.hour),
                                Number(record.actualOutTime.minute),
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          {record?.lateForIn ? (
                            <CheckCircle2
                              size={14}
                              className="text-late-text mx-auto"
                            />
                          ) : (
                            <XCircle
                              size={14}
                              className="text-muted-foreground/30 mx-auto"
                            />
                          )}
                        </td>
                        <td className="text-center">
                          {record?.lateForOut ? (
                            <CheckCircle2
                              size={14}
                              className="text-late-text mx-auto"
                            />
                          ) : (
                            <XCircle
                              size={14}
                              className="text-muted-foreground/30 mx-auto"
                            />
                          )}
                        </td>
                        <td className="text-center text-sm">
                          {record && (record.lateForIn || record.lateForOut) ? (
                            <span className="pill-late">
                              {Number(record.lateMinutesIn) +
                                Number(record.lateMinutesOut)}
                              m
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="border-t border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Summary for{" "}
                  <strong className="text-foreground">
                    {selectedStaff?.name}
                  </strong>{" "}
                  — {MONTHS[month - 1]} {year}:
                </span>
                <span className="flex items-center gap-1 text-present-text font-medium">
                  <CheckCircle2 size={12} />
                  {totalPresent} Present
                </span>
                <span className="text-muted-foreground">
                  {totalAbsent} Absent
                </span>
                <span className="flex items-center gap-1 text-late-text font-medium">
                  <AlertCircle size={12} />
                  {totalLateIn + totalLateOut} Late Events
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── All Staff Monthly Summary ──────────────────────────────────────────────────

function AllStaffSummary() {
  const { staff, isLoading } = useLocalStaff();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const yearOptions = [
    today.getFullYear() - 1,
    today.getFullYear(),
    today.getFullYear() + 1,
  ];

  // Aggregate from cache
  const allData = getAllMonthlyAttendance(year, month);

  const staffSummaries = (staff || []).map((s) => {
    const staffData = allData[String(s.id)] || {};
    const records = Object.values(staffData);
    const totalPresent = records.filter((r) => r.isPresent).length;
    const totalLateIn = records.filter((r) => r.lateForIn).length;
    const totalLateOut = records.filter((r) => r.lateForOut).length;
    const totalLateMinutes = records.reduce(
      (sum, r) => sum + Number(r.lateMinutesIn) + Number(r.lateMinutesOut),
      0,
    );
    return {
      id: s.id,
      name: s.name,
      scheduledIn: padTime(
        Number(s.scheduledInTime.hour),
        Number(s.scheduledInTime.minute),
      ),
      scheduledOut: padTime(
        Number(s.scheduledOutTime.hour),
        Number(s.scheduledOutTime.minute),
      ),
      totalPresent,
      totalLateIn,
      totalLateOut,
      totalLateMinutes,
      daysRecorded: records.length,
    };
  });

  const maxLate = Math.max(
    ...staffSummaries.map((s) => s.totalLateIn + s.totalLateOut),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-xs">
        <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
          Filter Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Month</span>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">Year</span>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : !staff || staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-salon-rose-light/60 p-12 text-center">
          <p className="text-muted-foreground text-sm">No staff found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-salon-rose" />
              <span className="text-sm font-medium">
                {MONTHS[month - 1]} {year} — All Staff Summary
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {staff.length} staff
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="salon-table">
              <thead>
                <tr>
                  <th className="text-left">Staff Name</th>
                  <th className="text-center">Schedule</th>
                  <th className="text-center">Days Recorded</th>
                  <th className="text-center">Total Present</th>
                  <th className="text-center">Late In</th>
                  <th className="text-center">Late Out</th>
                  <th className="text-center">Total Late Mins</th>
                </tr>
              </thead>
              <tbody>
                {staffSummaries.map((s) => {
                  const totalLate = s.totalLateIn + s.totalLateOut;
                  const isMostLate = totalLate === maxLate && maxLate > 0;
                  return (
                    <tr
                      key={String(s.id)}
                      className={isMostLate ? "row-late" : ""}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-salon-rose-light text-salon-rose-deep font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div
                              className={`font-medium text-sm ${isMostLate ? "text-late-text" : "text-foreground"}`}
                            >
                              {s.name}
                            </div>
                            {isMostLate && (
                              <div className="text-xs text-late-text">
                                Most late this month
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-xs text-muted-foreground">
                        {s.scheduledIn} – {s.scheduledOut}
                      </td>
                      <td className="text-center">
                        <span className="text-sm font-medium">
                          {s.daysRecorded}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="pill-present">{s.totalPresent}</span>
                      </td>
                      <td className="text-center">
                        {s.totalLateIn > 0 ? (
                          <span className="pill-late">{s.totalLateIn}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {s.totalLateOut > 0 ? (
                          <span className="pill-late">{s.totalLateOut}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {s.totalLateMinutes > 0 ? (
                          <span className="pill-late">
                            {s.totalLateMinutes}m
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle size={12} className="text-late-text" />
              <span>
                Staff highlighted in red have the most late arrivals/departures
                for the month.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Reports Page ──────────────────────────────────────────────────────────

export function ReportsPage() {
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
              <BarChart2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Attendance Reports
              </h1>
              <p className="text-white/60 text-sm">
                Monthly analysis & summaries for all staff
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gold-shimmer" />
      </div>

      {/* Report Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="individual">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-white border border-salon-rose-light/40 shadow-salon p-1 h-12">
            <TabsTrigger
              value="individual"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-salon-hero data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Scissors size={14} className="rotate-45" />
              Individual Report
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex items-center gap-2 text-sm data-[state=active]:bg-salon-hero data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <Users size={14} />
              Monthly Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="animate-fade-in-up">
            <IndividualReport />
          </TabsContent>
          <TabsContent value="summary" className="animate-fade-in-up">
            <AllStaffSummary />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
