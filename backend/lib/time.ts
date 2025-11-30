export function toJST(dateString: string): number {
    const utc = new Date(dateString).getTime();
    return utc + 9 * 60 * 60 * 1000; // UTC → JST (+9h)
}