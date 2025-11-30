export const todayJSTString = () => {
    const d = new Date();
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().split("T")[0];
};

//JSTとして扱うDateをYYYY-MM-DD形式に変換
export const formatJSTDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};