export const todayJSTString = () => {
    const d = new Date();
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().split("T")[0];
};
