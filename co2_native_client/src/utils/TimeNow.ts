
export function timeNowAsString(): string {
    const now = Date.now();
    const nowS = new Date(now).toUTCString();
    return nowS;
}