import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  LogIn,
  LogOut,
  Scissors,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AttendanceRecord } from "../backend.d";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { type LocalStaff, useLocalStaff } from "../hooks/useLocalStaff";
import { useSubmitInTime, useSubmitOutTime } from "../hooks/useQueries";

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateFull(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getLiveTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function parseTimeInput(val: string): { hour: number; minute: number } {
  const [h, m] = val.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function timeToMinutes(h: number, m: number) {
  return h * 60 + m;
}

function isLateForSchedule(
  currentTime: string,
  scheduledHour: number,
  scheduledMinute: number,
) {
  const { hour, minute } = parseTimeInput(currentTime);
  return (
    timeToMinutes(hour, minute) > timeToMinutes(scheduledHour, scheduledMinute)
  );
}

type EntryType = "in" | "out";

export function StaffEntryPage() {
  const { staff, isLoading } = useLocalStaff();
  const submitIn = useSubmitInTime();
  const submitOut = useSubmitOutTime();

  const today = getTodayStr();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [entryType, setEntryType] = useState<EntryType>("in");
  const [liveTime, setLiveTime] = useState(getLiveTime);
  const [manualTime, setManualTime] = useState("");
  const [result, setResult] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const regularStaff = staff?.filter((s) => !s.isPremium) ?? [];

  // Update live clock every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(getLiveTime());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedStaff = regularStaff.find(
    (s) => String(s.id) === selectedStaffId,
  ) as LocalStaff | undefined;

  // Determine if current time is late based on entry type
  const isCurrentlyLate = selectedStaff
    ? entryType === "in"
      ? isLateForSchedule(
          liveTime,
          Number(selectedStaff.scheduledInTime.hour),
          Number(selectedStaff.scheduledInTime.minute),
        )
      : isLateForSchedule(
          liveTime,
          Number(selectedStaff.scheduledOutTime.hour),
          Number(selectedStaff.scheduledOutTime.minute),
        )
    : false;

  // The time that will actually be submitted
  const submissionTime = isCurrentlyLate && manualTime ? manualTime : liveTime;

  const handleStaffChange = (id: string) => {
    setSelectedStaffId(id);
    setManualTime("");
    setError("");
  };

  const handleEntryTypeChange = (type: EntryType) => {
    setEntryType(type);
    setManualTime("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedStaff) return;
    setError("");
    setResult(null);

    try {
      const { hour, minute } = parseTimeInput(submissionTime);
      let record: AttendanceRecord;

      if (entryType === "in") {
        record = await submitIn.mutateAsync({
          staffId: selectedStaff.id,
          date: today,
          hour,
          minute,
        });
      } else {
        record = await submitOut.mutateAsync({
          staffId: selectedStaff.id,
          date: today,
          hour,
          minute,
        });
      }

      setResult(record);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
      console.error(err);
    }
  };

  const handleReset = () => {
    setSelectedStaffId("");
    setEntryType("in");
    setLiveTime(getLiveTime());
    setManualTime("");
    setResult(null);
    setError("");
    setSubmitted(false);
  };

  const isLate =
    result &&
    ((entryType === "in" && result.lateForIn) ||
      (entryType === "out" && result.lateForOut));
  const lateMinutes =
    result && entryType === "in"
      ? Number(result.lateMinutesIn)
      : Number(result?.lateMinutesOut || 0);

  const isPending = submitIn.isPending || submitOut.isPending;

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-salon-pattern">
      {/* Banner */}
      <div className="bg-salon-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-16 -translate-x-16" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 border border-white/20">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Staff Time Entry
                </h1>
                <p className="text-white/60 text-sm">
                  Submit your daily attendance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/20 self-start sm:self-auto">
              <CalendarDays size={15} className="text-salon-gold" />
              <span className="text-white/80 text-sm font-medium">
                {formatDateFull(today)}
              </span>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gold-shimmer" />
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-lg">
          {!submitted ? (
            <div className="bg-white rounded-2xl shadow-salon-lg border border-salon-rose-light/40 overflow-hidden animate-fade-in-up">
              {/* Card Header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/30">
                <Scissors size={16} className="text-salon-rose rotate-45" />
                <span className="font-display text-sm font-semibold text-foreground">
                  Fancy Looks Salon
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Time Entry
                </span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Staff Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select Your Name
                  </Label>
                  {isLoading ? (
                    <Skeleton className="h-11 w-full rounded-lg" />
                  ) : (
                    <Select
                      value={selectedStaffId}
                      onValueChange={handleStaffChange}
                    >
                      <SelectTrigger className="h-11 border-border focus:border-salon-rose">
                        <SelectValue placeholder="Choose your name..." />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="max-h-60 overflow-y-auto"
                      >
                        {regularStaff.length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            No staff found. Contact admin.
                          </div>
                        ) : (
                          regularStaff.map((s) => (
                            <SelectItem key={String(s.id)} value={String(s.id)}>
                              <span className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-salon-rose-light text-salon-rose-deep text-xs font-bold inline-flex items-center justify-center">
                                  {s.name.slice(0, 1)}
                                </span>
                                {s.name}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Show scheduled time */}
                  {selectedStaff && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 animate-fade-in-up">
                      <Clock size={11} className="text-salon-gold" />
                      Scheduled:{" "}
                      <strong className="text-foreground">
                        {padTime(
                          Number(selectedStaff.scheduledInTime.hour),
                          Number(selectedStaff.scheduledInTime.minute),
                        )}
                      </strong>
                      <span>→</span>
                      <strong className="text-foreground">
                        {padTime(
                          Number(selectedStaff.scheduledOutTime.hour),
                          Number(selectedStaff.scheduledOutTime.minute),
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Entry Type -- staff selects but cannot change time freely */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Entry Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEntryTypeChange("in")}
                      className={`flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-medium transition-all ${
                        entryType === "in"
                          ? "border-salon-rose bg-salon-rose-light/50 text-salon-rose-deep"
                          : "border-border text-muted-foreground hover:border-salon-rose-light hover:bg-muted/50"
                      }`}
                    >
                      <LogIn size={15} />
                      Check In
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEntryTypeChange("out")}
                      className={`flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-medium transition-all ${
                        entryType === "out"
                          ? "border-salon-rose bg-salon-rose-light/50 text-salon-rose-deep"
                          : "border-border text-muted-foreground hover:border-salon-rose-light hover:bg-muted/50"
                      }`}
                    >
                      <LogOut size={15} />
                      Check Out
                    </button>
                  </div>
                </div>

                {/* Time display / input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-salon-gold" />
                    {entryType === "in" ? "Check-In Time" : "Check-Out Time"}
                  </Label>

                  {/* Always show live time (locked) */}
                  <div
                    className={`flex items-center gap-3 h-11 rounded-lg px-4 border-2 ${
                      isCurrentlyLate
                        ? "border-late-border bg-late-bg"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <Clock
                      size={15}
                      className={
                        isCurrentlyLate ? "text-late-text" : "text-salon-gold"
                      }
                    />
                    <span
                      className={`text-base font-bold flex-1 ${
                        isCurrentlyLate ? "text-late-text" : "text-foreground"
                      }`}
                    >
                      {liveTime}
                    </span>
                    {!isCurrentlyLate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock size={11} />
                        <span>Live time</span>
                      </div>
                    )}
                    {isCurrentlyLate && selectedStaff && (
                      <span className="text-xs font-semibold text-late-text bg-late-border/20 rounded px-2 py-0.5">
                        LATE
                      </span>
                    )}
                  </div>

                  {/* Manual time input -- only shown when late */}
                  {isCurrentlyLate && selectedStaff && (
                    <div className="space-y-1.5 animate-fade-in-up">
                      <p className="text-xs text-late-text flex items-center gap-1.5">
                        <AlertCircle size={11} />
                        You are late. Enter your actual{" "}
                        {entryType === "in" ? "check-in" : "check-out"} time:
                      </p>
                      <Input
                        type="time"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="h-11 text-base border-late-border focus:border-late-text bg-late-bg"
                        placeholder={liveTime}
                      />
                      {!manualTime && (
                        <p className="text-xs text-muted-foreground">
                          Leave blank to use current time ({liveTime})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isPending || !selectedStaffId}
                  className="w-full h-11 bg-salon-hero text-white font-medium hover:opacity-90 shadow-salon"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {entryType === "in" ? (
                        <LogIn size={16} />
                      ) : (
                        <LogOut size={16} />
                      )}
                      Submit {entryType === "in" ? "Check-In" : "Check-Out"}{" "}
                      Time
                    </span>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* Success Card */
            <div
              className="bg-white rounded-2xl shadow-salon-lg border overflow-hidden animate-fade-in-up"
              style={{
                borderColor: isLate
                  ? "oklch(0.8 0.12 20)"
                  : "oklch(0.6 0.14 155 / 0.3)",
              }}
            >
              {/* Success/Late banner */}
              <div
                className={`p-6 text-center ${isLate ? "bg-late-bg" : "bg-present-bg"}`}
              >
                <div
                  className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                    isLate ? "bg-late-border/30" : "bg-present-text/20"
                  }`}
                >
                  {isLate ? (
                    <AlertCircle size={30} className="text-late-text" />
                  ) : (
                    <CheckCircle2 size={30} className="text-present-text" />
                  )}
                </div>
                <h2
                  className={`font-display text-xl font-bold ${isLate ? "text-late-text" : "text-present-text"}`}
                >
                  {isLate ? "Late Arrival Recorded" : "Time Submitted!"}
                </h2>
                <p
                  className={`text-sm mt-1 ${isLate ? "text-late-text/80" : "text-present-text/80"}`}
                >
                  {entryType === "in" ? "Check-in" : "Check-out"} time has been
                  recorded
                </p>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      Staff Name
                    </div>
                    <div className="font-semibold text-foreground truncate">
                      {selectedStaff?.name}
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      Date
                    </div>
                    <div className="font-semibold text-foreground">{today}</div>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      {entryType === "in" ? "Scheduled In" : "Scheduled Out"}
                    </div>
                    <div className="font-semibold text-foreground">
                      {entryType === "in"
                        ? padTime(
                            Number(selectedStaff?.scheduledInTime.hour || 0),
                            Number(selectedStaff?.scheduledInTime.minute || 0),
                          )
                        : padTime(
                            Number(selectedStaff?.scheduledOutTime.hour || 0),
                            Number(selectedStaff?.scheduledOutTime.minute || 0),
                          )}
                    </div>
                  </div>
                  <div
                    className={`rounded-xl p-3 ${isLate ? "bg-late-bg border border-late-border" : "bg-present-bg"}`}
                  >
                    <div
                      className={`text-xs mb-1 ${isLate ? "text-late-text/70" : "text-present-text/70"}`}
                    >
                      Actual Time
                    </div>
                    <div
                      className={`font-bold ${isLate ? "text-late-text" : "text-present-text"}`}
                    >
                      {submissionTime}
                    </div>
                  </div>
                </div>

                {isLate && (
                  <div className="flex items-center gap-2 rounded-xl bg-late-bg border border-late-border p-3">
                    <AlertCircle
                      size={16}
                      className="text-late-text flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-late-text">
                        {lateMinutes} minute{lateMinutes !== 1 ? "s" : ""} late
                      </p>
                      <p className="text-xs text-late-text/70">
                        Please ensure timely{" "}
                        {entryType === "in" ? "arrival" : "departure"} tomorrow.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReset}
                  className="w-full h-10 bg-salon-hero text-white hover:opacity-90"
                >
                  Submit Another Entry
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
