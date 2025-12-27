import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { SignOutButton } from "@/components/sign-out-button";
import { TimelineMemoryCard } from "@/components/timeline-memory-card";
import { auth } from "@/lib/auth";
import { getMemoriesForToday, type MemoryItem } from "@/lib/memories";

export const runtime = "nodejs";

const YEARS_BACK = 8;

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatMonthDay(date: Date) {
  const month = monthNames[date.getMonth()] ?? "Jan";
  return `${month} ${date.getDate()}`;
}

function extractEmail(value: string) {
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    return angleMatch[1].trim();
  }
  const emailMatch = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return emailMatch?.[0] ?? "";
}

function getRecipientLabel(value: string) {
  const email = extractEmail(value);
  if (email) {
    return email;
  }
  const trimmed = value.replace(/"/g, "").trim();
  if (!trimmed) {
    return "";
  }
  const commaIndex = trimmed.indexOf(",");
  return commaIndex === -1 ? trimmed : trimmed.slice(0, commaIndex).trim();
}

function getRecipientDomain(value: string) {
  const email = extractEmail(value);
  if (!email) {
    return "";
  }
  const atIndex = email.lastIndexOf("@");
  return atIndex === -1 ? "" : email.slice(atIndex + 1).toLowerCase();
}

function buildTimelineHref(params: {
  to?: string;
  subject?: string;
  yearA?: string;
  yearB?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.to) {
    searchParams.set("to", params.to);
  }
  if (params.subject) {
    searchParams.set("subject", params.subject);
  }
  if (params.yearA) {
    searchParams.set("yearA", params.yearA);
  }
  if (params.yearB) {
    searchParams.set("yearB", params.yearB);
  }
  const query = searchParams.toString();
  return query ? `/timeline?${query}` : "/timeline";
}

function buildYearRange(startYear: number) {
  return Array.from(
    { length: YEARS_BACK },
    (_, index) => startYear - index - 1
  );
}

function groupMemoriesByYear(memories: MemoryItem[]) {
  const grouped = new Map<string, MemoryItem[]>();

  memories.forEach((memory) => {
    const existing = grouped.get(memory.year) ?? [];
    existing.push(memory);
    grouped.set(memory.year, existing);
  });

  return grouped;
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  });

  if (!session) {
    redirect("/login");
  }

  const today = new Date();
  const monthDay = formatMonthDay(today);
  const memoriesResult = await getMemoriesForToday(session.user.id);
  const memories = memoriesResult.status === "ok" ? memoriesResult.items : [];
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const recipientFilter =
    typeof resolvedSearchParams.to === "string"
      ? resolvedSearchParams.to.trim()
      : "";
  const subjectFilter =
    typeof resolvedSearchParams.subject === "string"
      ? resolvedSearchParams.subject.trim()
      : "";
  const recipientQuery = recipientFilter.toLowerCase();
  const subjectQuery = subjectFilter.toLowerCase();
  const filteredMemories = memories.filter((memory) => {
    const recipientMatch = recipientQuery
      ? memory.to.toLowerCase().includes(recipientQuery)
      : true;
    const subjectTarget = `${memory.subject} ${memory.snippet}`.toLowerCase();
    const subjectMatch = subjectQuery
      ? subjectTarget.includes(subjectQuery)
      : true;
    return recipientMatch && subjectMatch;
  });
  const grouped = groupMemoriesByYear(filteredMemories);
  const yearRange = buildYearRange(today.getFullYear());
  const yearOptions = yearRange.map((year) => String(year));
  const requestedYearA =
    typeof resolvedSearchParams.yearA === "string"
      ? resolvedSearchParams.yearA
      : "";
  const requestedYearB =
    typeof resolvedSearchParams.yearB === "string"
      ? resolvedSearchParams.yearB
      : "";
  const defaultYearA = yearOptions[0] ?? "";
  const defaultYearB = yearOptions[1] ?? defaultYearA;
  const compareYearA = yearOptions.includes(requestedYearA)
    ? requestedYearA
    : defaultYearA;
  const compareYearB = yearOptions.includes(requestedYearB)
    ? requestedYearB
    : defaultYearB;
  const yearSummaries = yearRange.map((year) => {
    const items = grouped.get(String(year)) ?? [];
    return {
      year,
      count: items.length,
      items,
    };
  });
  const yearsWithMemories = yearSummaries.filter(
    (summary) => summary.count > 0
  );
  const hasMemories = filteredMemories.length > 0;
  const hasFilters = Boolean(recipientFilter || subjectFilter);
  const filterSummary = hasFilters
    ? `Filtered results`
    : "No filters applied";
  const compareSummaryA = yearSummaries.find(
    (summary) => String(summary.year) === compareYearA
  );
  const compareSummaryB = yearSummaries.find(
    (summary) => String(summary.year) === compareYearB
  );
  const compareDelta =
    (compareSummaryA?.count ?? 0) - (compareSummaryB?.count ?? 0);
  const compareDeltaLabel =
    compareYearA && compareYearB
      ? compareDelta === 0
        ? "Even activity between the selected years."
        : compareDelta > 0
          ? `${compareYearA} has ${compareDelta} more memories than ${compareYearB}.`
          : `${compareYearB} has ${Math.abs(compareDelta)} more memories than ${compareYearA}.`
      : "Select two years to compare.";
  const maxCount = Math.max(
    1,
    ...yearSummaries.map((summary) => summary.count)
  );
  const highlightYears = [...yearSummaries]
    .filter((summary) => summary.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const highlightMemory = filteredMemories[0];

  const recipientCounts = new Map<string, { label: string; count: number }>();
  const domainCounts = new Map<string, number>();

  memories.forEach((memory) => {
    const recipientLabel = getRecipientLabel(memory.to);
    if (recipientLabel) {
      const key = recipientLabel.toLowerCase();
      const existing = recipientCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        recipientCounts.set(key, { label: recipientLabel, count: 1 });
      }
    }

    const domain = getRecipientDomain(memory.to);
    if (domain) {
      const existingCount = domainCounts.get(domain) ?? 0;
      domainCounts.set(domain, existingCount + 1);
    }
  });

  const topRecipients = [...recipientCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const topDomains = [...domainCounts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statusLine =
    memoriesResult.status === "ok"
      ? hasMemories
        ? `Found ${filteredMemories.length} sent emails from ${monthDay} across ${yearsWithMemories.length} years.`
        : `No sent emails from ${monthDay} in the last ${YEARS_BACK} years.`
      : memoriesResult.message;

  return (
    <div className="min-h-screen px-6 pb-24 pt-12 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Navigation */}
        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-black/10 bg-white/80 px-4 py-2 shadow-[0_10px_30px_-24px_rgba(28,16,6,0.6)]">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-black/40">
            Mail Memories
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              Home
            </Link>
            <Link
              href="/memories"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              Memories
            </Link>
            <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Timeline
            </span>
          </div>
        </nav>

        {/* Header */}
        <header className="flex flex-col gap-6 rounded-[28px] border border-black/10 bg-white/70 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
              Timeline
            </p>
            <h1 className="font-display mt-3 text-3xl text-black sm:text-4xl">
              This day across years
            </h1>
            <p className="mt-2 text-sm text-black/70">{statusLine}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              <span>{monthDay}</span>
              <Link href="/memories" className="transition hover:text-black">
                Back to feed
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {yearRange.map((year) => {
                const summary = yearSummaries.find((s) => s.year === year);
                const hasItems = (summary?.count ?? 0) > 0;
                return (
                  <a
                    key={year}
                    href={`#year-${year}`}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                      hasItems
                        ? "border-black bg-black text-white hover:bg-black/80"
                        : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
                    }`}
                  >
                    {year}
                    {hasItems && ` · ${summary?.count}`}
                  </a>
                );
              })}
            </div>
          </div>
          <SignOutButton />
        </header>

        {memoriesResult.status !== "ok" ? (
          <section className="rounded-[28px] border border-black/10 bg-white/80 p-8">
            <p className="text-sm text-black/70">{memoriesResult.message}</p>
            {memoriesResult.status === "needs-connection" && (
              <div className="mt-6">
                <GoogleSignInButton label="Reconnect Gmail" />
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Filters & Stats Grid */}
            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                {/* Filter Card */}
                <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_16px_45px_-38px_rgba(28,16,6,0.6)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                      Filter timeline
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                      {filterSummary}
                    </span>
                  </div>
                  <form
                    className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
                    method="get"
                  >
                    {compareYearA && (
                      <input type="hidden" name="yearA" value={compareYearA} />
                    )}
                    {compareYearB && (
                      <input type="hidden" name="yearB" value={compareYearB} />
                    )}
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      Recipient
                      <input
                        name="to"
                        defaultValue={recipientFilter}
                        placeholder="alex@company.com"
                        className="h-11 rounded-full border border-black/10 bg-white/80 px-4 text-sm font-medium text-black/70 transition focus:border-black/30 focus:outline-none"
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      Subject / keywords
                      <input
                        name="subject"
                        defaultValue={subjectFilter}
                        placeholder="launch plan"
                        className="h-11 rounded-full border border-black/10 bg-white/80 px-4 text-sm font-medium text-black/70 transition focus:border-black/30 focus:outline-none"
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
                      >
                        Apply
                      </button>
                      {hasFilters && (
                        <Link
                          href={buildTimelineHref({
                            yearA: compareYearA,
                            yearB: compareYearB,
                          })}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:border-black/30 hover:text-black"
                        >
                          Clear
                        </Link>
                      )}
                    </div>
                  </form>

                  {topRecipients.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                        Top recipients
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topRecipients.map((recipient) => {
                          const isActive =
                            recipientFilter.toLowerCase() ===
                            recipient.label.toLowerCase();
                          return (
                            <Link
                              key={recipient.label}
                              href={buildTimelineHref({
                                to: recipient.label,
                                subject: subjectFilter,
                                yearA: compareYearA,
                                yearB: compareYearB,
                              })}
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                isActive
                                  ? "border-black bg-black text-white"
                                  : "border-black/10 text-black/60 hover:border-black/30 hover:text-black"
                              }`}
                            >
                              {recipient.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {topDomains.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                        Top domains
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topDomains.map((domain) => {
                          const value = `@${domain.domain}`;
                          const isActive = recipientFilter
                            .toLowerCase()
                            .includes(domain.domain.toLowerCase());
                          return (
                            <Link
                              key={domain.domain}
                              href={buildTimelineHref({
                                to: value,
                                subject: subjectFilter,
                                yearA: compareYearA,
                                yearB: compareYearB,
                              })}
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                isActive
                                  ? "border-black bg-black text-white"
                                  : "border-black/10 text-black/60 hover:border-black/30 hover:text-black"
                              }`}
                            >
                              {value}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured Memory Card */}
                {highlightMemory && (
                  <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[var(--ink)] p-6 text-white shadow-[0_20px_55px_-40px_rgba(28,16,6,0.8)]">
                    <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[color:var(--glow-peach)]/70 blur-[80px]" />
                    <div className="absolute -left-8 bottom-0 h-44 w-44 rounded-full bg-[color:var(--glow-mint)]/50 blur-[90px]" />
                    <div className="relative space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                        Share highlight
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                        <span className="rounded-full border border-white/20 px-3 py-1 text-[11px]">
                          {highlightMemory.date}
                        </span>
                        <span>{monthDay}</span>
                      </div>
                      <h2 className="font-display text-2xl text-white">
                        {highlightMemory.subject}
                      </h2>
                      <p className="text-sm text-white/70">
                        {highlightMemory.snippet}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        {highlightMemory.to}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/80"
                        >
                          Share card
                        </button>
                        <a
                          href={highlightMemory.gmailLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                        >
                          Open in Gmail
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Year Comparison Card */}
                <div className="rounded-[28px] border border-black/10 bg-[var(--ink)] p-6 text-white shadow-[0_20px_55px_-40px_rgba(28,16,6,0.8)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                      Compare years
                    </p>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                      {compareDeltaLabel}
                    </span>
                  </div>
                  <form
                    className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                    method="get"
                  >
                    {recipientFilter && (
                      <input type="hidden" name="to" value={recipientFilter} />
                    )}
                    {subjectFilter && (
                      <input
                        type="hidden"
                        name="subject"
                        value={subjectFilter}
                      />
                    )}
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      Year A
                      <select
                        name="yearA"
                        defaultValue={compareYearA}
                        className="h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition focus:border-white/40 focus:outline-none"
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year} className="text-black">
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      Year B
                      <select
                        name="yearB"
                        defaultValue={compareYearB}
                        className="h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition focus:border-white/40 focus:outline-none"
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year} className="text-black">
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center self-end rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/80"
                    >
                      Compare
                    </button>
                  </form>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[compareSummaryA, compareSummaryB].map((summary) => {
                      const topMemory = summary?.items[0];
                      const year = summary?.year
                        ? String(summary.year)
                        : "Year";
                      return (
                        <div
                          key={year}
                          className="rounded-2xl border border-white/10 bg-white/10 p-4"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                            <span>{year}</span>
                            <span>
                              {summary?.count ?? 0}{" "}
                              {(summary?.count ?? 0) === 1
                                ? "memory"
                                : "memories"}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-white">
                            {topMemory?.subject ?? "No memories yet"}
                          </p>
                          <p className="mt-2 text-xs text-white/70">
                            {topMemory?.snippet ||
                              "Pick this year to compare activity."}
                          </p>
                          {summary?.year && (
                            <a
                              href={`#year-${summary.year}`}
                              className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
                            >
                              Jump to year
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      Busiest years
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {highlightYears.length === 0 ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                          No matches yet
                        </span>
                      ) : (
                        highlightYears.map((summary) => (
                          <a
                            key={summary.year}
                            href={`#year-${summary.year}`}
                            className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                          >
                            {summary.year} · {summary.count}
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Year Activity */}
                <div className="rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-[0_16px_45px_-38px_rgba(28,16,6,0.6)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                    Year activity
                  </p>
                  <div className="mt-4 grid gap-3">
                    {yearSummaries.map((summary) => (
                      <div
                        key={summary.year}
                        className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/50"
                      >
                        <span className="w-12">{summary.year}</span>
                        <div className="h-2 flex-1 rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full bg-black/70"
                            style={{
                              width: `${Math.round(
                                (summary.count / maxCount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-right">{summary.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline Section */}
            <section className="relative rounded-[32px] border border-black/10 bg-white/70 p-8">
              <div className="absolute left-10 top-10 h-[calc(100%-5rem)] w-px bg-black/10" />
              <div className="space-y-8">
                {yearRange.map((year) => {
                  const items = grouped.get(String(year)) ?? [];
                  const countLabel =
                    items.length === 1
                      ? "1 memory"
                      : `${items.length} memories`;

                  return (
                    <div
                      key={year}
                      id={`year-${year}`}
                      className="relative scroll-mt-24 pl-16"
                    >
                      <div className="absolute left-8 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-black/20 bg-white text-[9px] font-bold text-black/50 shadow-[0_8px_20px_-14px_rgba(28,16,6,0.8)]">
                        {items.length > 0 ? items.length : "·"}
                      </div>
                      <div className="rounded-[24px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_50px_-40px_rgba(28,16,6,0.6)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-lg text-black">
                              {year}
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-[11px]">
                              {monthDay}
                            </span>
                          </div>
                          <span>{countLabel}</span>
                        </div>
                        {items.length === 0 ? (
                          <p className="mt-4 text-sm text-black/60">
                            No sent memories on this date.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {items.map((memory, index) => (
                              <TimelineMemoryCard
                                key={memory.id}
                                memory={memory}
                                index={index}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
