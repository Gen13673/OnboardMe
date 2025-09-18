export function gcalAllDayUrl(opts: {
    title: string;
    date: Date;            // día del evento (all-day)
    details?: string;
    location?: string;
    timezone?: string;
}) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyymmdd = (d: Date) =>
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

    const start = yyyymmdd(opts.date);
    const end = yyyymmdd(new Date(opts.date.getFullYear(), opts.date.getMonth(), opts.date.getDate() + 1));

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: opts.title,
        dates: `${start}/${end}`,
        details: opts.details ?? "",
    });

    if (opts.location) params.set("location", opts.location);
    if (opts.timezone) params.set("ctz", opts.timezone);

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
