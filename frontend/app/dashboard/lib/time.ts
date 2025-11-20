export const formatTime = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}時間${m}分`;
};

export const formatWeeklyHours = (hours: number) => {
    return `${Math.floor(hours)}時間${Math.round((hours % 1) * 60)}分`;
};