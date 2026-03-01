import {
  ChevronRight,
  Clock,
  Crown,
  Pencil,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import type { LocalStaff } from "../../hooks/useLocalStaff";
import {
  type UpdateStaffTimesParams,
  useLocalStaff,
} from "../../hooks/useLocalStaff";

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeInput(val: string): { hour: number; minute: number } {
  const [h, m] = val.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function EditStaffDialog({
  staff,
  onUpdate,
  onClose,
  isSaving,
}: {
  staff: LocalStaff;
  onUpdate: (params: UpdateStaffTimesParams) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}) {
  const [inTime, setInTime] = useState(
    padTime(
      Number(staff.scheduledInTime.hour),
      Number(staff.scheduledInTime.minute),
    ),
  );
  const [outTime, setOutTime] = useState(
    padTime(
      Number(staff.scheduledOutTime.hour),
      Number(staff.scheduledOutTime.minute),
    ),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const inParsed = parseTimeInput(inTime);
      const outParsed = parseTimeInput(outTime);
      await onUpdate({
        staffId: staff.id,
        inHour: inParsed.hour,
        inMinute: inParsed.minute,
        outHour: outParsed.hour,
        outMinute: outParsed.minute,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update staff times", err);
    } finally {
      setSaving(false);
    }
  };

  const isWorking = saving || isSaving;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-display text-lg flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-salon-rose-light flex items-center justify-center">
            <Clock size={14} className="text-salon-rose" />
          </div>
          Edit Schedule — {staff.name}
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Scheduled In Time</Label>
          <Input
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Scheduled Out Time</Label>
          <Input
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isWorking}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isWorking}
          className="bg-salon-hero text-white hover:opacity-90"
        >
          {isWorking ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function StaffManagementTab() {
  const {
    staff,
    isLoading,
    addStaff,
    removeStaff,
    updateStaffTimes,
    togglePremium,
    isAddingStaff,
    isRemovingStaff,
    isUpdatingStaff,
  } = useLocalStaff();

  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<LocalStaff | null>(null);
  const [newName, setNewName] = useState("");
  const [newInTime, setNewInTime] = useState("09:00");
  const [newOutTime, setNewOutTime] = useState("18:00");
  const [addError, setAddError] = useState("");

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddError("");
    try {
      const inParsed = parseTimeInput(newInTime);
      const outParsed = parseTimeInput(newOutTime);
      await addStaff({
        name: newName.trim(),
        inHour: inParsed.hour,
        inMinute: inParsed.minute,
        outHour: outParsed.hour,
        outMinute: outParsed.minute,
      });
      setNewName("");
      setNewInTime("09:00");
      setNewOutTime("18:00");
      setAddOpen(false);
    } catch (err) {
      console.error("Failed to add staff", err);
      setAddError("Failed to add staff. Please try again.");
    }
  };

  const handleRemove = async (staffId: bigint) => {
    try {
      await removeStaff(staffId);
    } catch (err) {
      console.error("Failed to remove staff", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-salon-charcoal">
            Staff Members
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading..." : `${staff.length} staff registered`}
          </p>
        </div>

        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) setAddError("");
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-salon-hero text-white hover:opacity-90 shadow-salon">
              <UserPlus size={16} />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-salon-rose-light flex items-center justify-center">
                  <UserPlus size={14} className="text-salon-rose" />
                </div>
                Add New Staff Member
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-9 h-10"
                    placeholder="Staff member's name"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-salon-gold" />
                    Scheduled In Time
                  </Label>
                  <Input
                    type="time"
                    value={newInTime}
                    onChange={(e) => setNewInTime(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-salon-rose" />
                    Scheduled Out Time
                  </Label>
                  <Input
                    type="time"
                    value={newOutTime}
                    onChange={(e) => setNewOutTime(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  disabled={isAddingStaff}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingStaff || !newName.trim()}
                  className="bg-salon-hero text-white hover:opacity-90"
                >
                  {isAddingStaff ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus size={15} />
                      Add Staff
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="space-y-3">
          {(["sk1", "sk2", "sk3"] as const).map((skKey) => (
            <div
              key={skKey}
              className="flex items-center gap-4 bg-white rounded-xl border border-border p-4"
            >
              <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-salon-rose-light/60 p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-salon-rose-light/50 flex items-center justify-center">
            <Users size={28} className="text-salon-rose opacity-60" />
          </div>
          <h3 className="font-display text-lg font-medium text-salon-charcoal">
            No Staff Added Yet
          </h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Add your first staff member to get started.
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 bg-salon-hero text-white hover:opacity-90"
          >
            <UserPlus size={15} />
            Add First Staff
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s, idx) => (
            <div
              key={String(s.id)}
              className="group flex items-center gap-4 bg-white rounded-xl border border-border p-4 hover-lift shadow-xs animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Avatar */}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-salon-rose-light font-display font-bold text-salon-rose-deep text-sm flex-shrink-0">
                {s.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-foreground truncate">
                    {s.name}
                  </div>
                  {s.isPremium && (
                    <Badge className="bg-salon-gold/20 text-salon-charcoal border-salon-gold/30 gap-1 text-[10px] px-1.5 py-0">
                      <Crown size={9} className="text-salon-gold" />
                      Premium
                    </Badge>
                  )}
                </div>
                {s.isPremium ? (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-salon-gold">
                    <Crown size={10} />
                    <span>No time tracking required</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-salon-gold" />
                      In:{" "}
                      <strong className="text-foreground">
                        {padTime(
                          Number(s.scheduledInTime.hour),
                          Number(s.scheduledInTime.minute),
                        )}
                      </strong>
                    </span>
                    <ChevronRight size={11} className="text-border" />
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-salon-rose" />
                      Out:{" "}
                      <strong className="text-foreground">
                        {padTime(
                          Number(s.scheduledOutTime.hour),
                          Number(s.scheduledOutTime.minute),
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePremium(s.id)}
                  title={s.isPremium ? "Remove Premium" : "Mark as Premium"}
                  className={`gap-1.5 h-8 ${
                    s.isPremium
                      ? "text-salon-gold hover:text-salon-charcoal hover:bg-salon-gold/10"
                      : "text-muted-foreground hover:text-salon-gold hover:bg-salon-gold/10"
                  }`}
                >
                  <Crown size={13} />
                  <span className="hidden sm:inline">
                    {s.isPremium ? "Unset" : "Premium"}
                  </span>
                </Button>

                {!s.isPremium && (
                  <Dialog
                    open={editStaff?.id === s.id}
                    onOpenChange={(open) => !open && setEditStaff(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditStaff(s)}
                        className="gap-1.5 text-muted-foreground hover:text-salon-rose hover:bg-salon-rose-light/50 h-8"
                      >
                        <Pencil size={13} />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </DialogTrigger>
                    {editStaff?.id === s.id && (
                      <EditStaffDialog
                        staff={editStaff}
                        onUpdate={updateStaffTimes}
                        onClose={() => setEditStaff(null)}
                        isSaving={isUpdatingStaff}
                      />
                    )}
                  </Dialog>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isRemovingStaff}
                      className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                    >
                      <Trash2 size={13} />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display">
                        Remove {s.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove <strong>{s.name}</strong>{" "}
                        from the system. All attendance records for this staff
                        member will be lost. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(s.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
