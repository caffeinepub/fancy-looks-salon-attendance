import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { AttendanceRecord } from "../../backend.d";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { useLocalStaff } from "../../hooks/useLocalStaff";
import {
  getFromAttendanceCache,
  useMarkAttendance,
} from "../../hooks/useQueries";

function getTodayStr() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDayName(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface StaffAttendanceRow {
  staffId: bigint;
  name: string;
  scheduledIn: string;
  scheduledOut: string;
  record: AttendanceRecord | null;
  loading: boolean;
}

export function DailyAttendanceTab() {
  const { staff, isLoading: staffLoading } = useLocalStaff();
  const markAttendance = useMarkAttendance();
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // Build rows from staff + cache
  const rows: StaffAttendanceRow[] = (staff || []).map((s) => ({
    staffId: s.id,
    name: s.name,
    scheduledIn: padTime(
      Number(s.scheduledInTime.hour),
      Number(s.scheduledInTime.minute),
    ),
    scheduledOut: padTime(
      Number(s.scheduledOutTime.hour),
      Number(s.scheduledOutTime.minute),
    ),
    record: getFromAttendanceCache(s.id, selectedDate),
    loading: false,
  }));

  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [localRecords, setLocalRecords] = useState<
    Record<string, AttendanceRecord>
  >({});

  const getRecord = useCallback(
    (staffId: bigint): AttendanceRecord | null => {
      const key = `${staffId}-${selectedDate}`;
      return localRecords[key] || getFromAttendanceCache(staffId, selectedDate);
    },
    [localRecords, selectedDate],
  );

  const handleTogglePresent = async (
    staffId: bigint,
    currentIsPresent: boolean,
  ) => {
    const key = `${staffId}-${selectedDate}`;
    setMarkingIds((prev) => new Set(prev).add(key));
    try {
      const record = await markAttendance.mutateAsync({
        staffId,
        date: selectedDate,
        isPresent: !currentIsPresent,
      });
      setLocalRecords((prev) => ({ ...prev, [key]: record }));
    } catch (err) {
      console.error("Failed to mark attendance:", err);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleMarkAllPresent = async () => {
    if (!staff) return;
    for (const s of staff) {
      const rec = getRecord(s.id);
      if (!rec?.isPresent) {
        const key = `${s.id}-${selectedDate}`;
        setMarkingIds((prev) => new Set(prev).add(key));
        try {
          const record = await markAttendance.mutateAsync({
            staffId: s.id,
            date: selectedDate,
            isPresent: true,
          });
          setLocalRecords((prev) => ({ ...prev, [key]: record }));
        } catch (err) {
          console.error(err);
        } finally {
          setMarkingIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      }
    }
  };

  const isLate = (record: AttendanceRecord | null) =>
    record && (record.lateForIn || record.lateForOut);

  const presentCount = rows.filter(
    (r) => getRecord(r.staffId)?.isPresent,
  ).length;
  const lateCount = rows.filter((r) => isLate(getRecord(r.staffId))).length;

  return (
    <div className="space-y-6">
      {/* Date Picker + Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-salon-charcoal">
            Daily Attendance
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDayName(selectedDate)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-border px-3 py-2 shadow-xs">
            <CalendarDays size={15} className="text-salon-rose" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 text-sm w-36"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllPresent}
            disabled={!staff || staff.length === 0}
            className="gap-1.5 text-sm border-salon-rose-light text-salon-rose hover:bg-salon-rose-light/50"
          >
            <CheckCircle2 size={14} />
            Mark All Present
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-3 text-center shadow-xs">
          <div className="text-2xl font-bold font-display text-salon-charcoal">
            {staff?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Total Staff</div>
        </div>
        <div className="bg-white rounded-xl border border-present-bg p-3 text-center shadow-xs">
          <div className="text-2xl font-bold font-display text-present-text">
            {presentCount}
          </div>
          <div className="text-xs text-muted-foreground">Present</div>
        </div>
        <div className="bg-white rounded-xl border border-late-border p-3 text-center shadow-xs">
          <div className="text-2xl font-bold font-display text-late-text">
            {lateCount}
          </div>
          <div className="text-xs text-muted-foreground">Late</div>
        </div>
      </div>

      {/* Attendance List */}
      {staffLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white rounded-xl border p-4"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      ) : !staff || staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-salon-rose-light/60 p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No staff added yet. Go to Staff Management to add staff.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row, idx) => {
            const record = getRecord(row.staffId);
            const isPresent = record?.isPresent || false;
            const isLateIn = record?.lateForIn;
            const isLateOut = record?.lateForOut;
            const isAnyLate = isLateIn || isLateOut;
            const key = `${row.staffId}-${selectedDate}`;
            const isMarking = markingIds.has(key);

            return (
              <div
                key={String(row.staffId)}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover-lift animate-fade-in-up ${
                  isAnyLate
                    ? "bg-late-bg border-late-border"
                    : isPresent
                      ? "bg-present-bg border-present-bg/40"
                      : "bg-white border-border"
                }`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Staff Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-display font-bold text-sm flex-shrink-0 ${
                      isAnyLate
                        ? "bg-late-border/30 text-late-text"
                        : isPresent
                          ? "bg-present-text/20 text-present-text"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-medium truncate flex items-center gap-2 ${
                        isAnyLate ? "text-late-text" : "text-foreground"
                      }`}
                    >
                      {row.name}
                      {isAnyLate && (
                        <span className="flex items-center gap-1 text-xs font-normal">
                          <AlertCircle size={12} className="text-late-text" />
                          {isLateIn && record && (
                            <span className="pill-late">
                              +{Number(record.lateMinutesIn)}m late in
                            </span>
                          )}
                          {isLateOut && record && (
                            <span className="pill-late">
                              +{Number(record.lateMinutesOut)}m late out
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-salon-gold" />
                        Sched: {row.scheduledIn} – {row.scheduledOut}
                      </span>
                      {record?.actualInTime && (
                        <span
                          className={`flex items-center gap-1 ${isLateIn ? "text-late-text font-medium" : "text-present-text"}`}
                        >
                          | In:{" "}
                          {padTime(
                            Number(record.actualInTime.hour),
                            Number(record.actualInTime.minute),
                          )}
                        </span>
                      )}
                      {record?.actualOutTime && (
                        <span
                          className={`flex items-center gap-1 ${isLateOut ? "text-late-text font-medium" : "text-present-text"}`}
                        >
                          Out:{" "}
                          {padTime(
                            Number(record.actualOutTime.hour),
                            Number(record.actualOutTime.minute),
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge + Toggle */}
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {isPresent ? (
                    <Badge className="bg-present-text/15 text-present-text border-0 text-xs">
                      <CheckCircle2 size={11} className="mr-1" />
                      Present
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground border-border text-xs"
                    >
                      <XCircle size={11} className="mr-1" />
                      Absent
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleTogglePresent(row.staffId, isPresent)}
                    disabled={isMarking}
                    className={`h-8 text-xs font-medium ${
                      isPresent
                        ? "bg-white border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        : "bg-salon-hero text-white hover:opacity-90"
                    }`}
                  >
                    {isMarking ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : isPresent ? (
                      "Mark Absent"
                    ) : (
                      "Mark Present"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Late Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-white rounded-lg border border-border p-3">
        <AlertCircle size={13} className="text-late-text flex-shrink-0" />
        <span>
          <strong className="text-late-text">Red rows</strong> indicate staff
          who are late (in-time or out-time past their schedule). Actual times
          are submitted by staff from the Staff Entry page.
        </span>
      </div>
    </div>
  );
}
