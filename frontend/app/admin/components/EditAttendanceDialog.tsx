// components/admin/EditAttendanceDialog.tsx
/*
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayAttendance } from "@/types/DayAttendance";
import { User } from "@/types/User";
import { EditSession } from "@/types/EditSession";

interface Props {
    editingDay: { user: User, dayData: DayAttendance } | null;
    editFormData: EditSession[];
    setEditFormData: (data: EditSession[]) => void;
    onClose: () => void;
    onSave: () => void;
}

export const EditAttendanceDialog = ({
    editingDay,
    editFormData,
    setEditFormData,
    onClose,
    onSave
}: Props) => {

    const updateFormSession = (
        index: number,
        field: "clockIn" | "clockOut",
        value: string
    ) => {
        const newSessions = [...editFormData];
        newSessions[index] = { ...newSessions[index], [field]: value };
        setEditFormData(newSessions);
    };

    return (
        <Dialog open={!!editingDay} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>勤怠データを編集</DialogTitle>
                    <DialogDescription>
                        {editingDay && (
                            <>
                                {editingDay.user.name} -{" "}
                                {new Date(editingDay.dayData.date).toLocaleDateString(
                                    "ja-JP",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        weekday: "long"
                                    }
                                )}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {editFormData.map((session, index) => (
                        <div key={index} className="space-y-3 p-4 border rounded-lg">
                            <h4 className="text-sm">セッション {index + 1}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`clockIn-${index}`}>出勤時刻</Label>
                                    <Input
                                        id={`clockIn-${index}`}
                                        type="time"
                                        value={session.clockIn}
                                        onChange={(e) =>
                                            updateFormSession(index, "clockIn", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`clockOut-${index}`}>退勤時刻</Label>
                                    <Input
                                        id={`clockOut-${index}`}
                                        type="time"
                                        value={session.clockOut}
                                        onChange={(e) =>
                                            updateFormSession(index, "clockOut", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button onClick={onSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
*/