import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account } from "@/db/schema";

const YEARS_BACK = 8;
const MAX_RESULTS_PER_YEAR = 6;
const REFRESH_BUFFER_MS = 60_000;

type GmailMessageHeader = {
  name: string;
  value: string;
};

type GmailMessageList = {
  messages?: Array<{
    id: string;
    threadId: string;
  }>;
};

type GmailMessage = {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: {
    headers?: GmailMessageHeader[];
  };
};

export type MemoryItem = {
  id: string;
  subject: string;
  snippet: string;
  to: string;
  date: string;
  year: string;
  gmailLink: string;
};

export type MemoriesResult =
  | { status: "ok"; items: MemoryItem[] }
  | { status: "needs-connection"; message: string }
  | { status: "error"; message: string };

type AccountRow = typeof account.$inferSelect;

function formatGmailDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatDisplayDate(date: Date) {
  const months = [
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
  const month = months[date.getMonth()] ?? "Jan";
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function getHeaderValue(headers: GmailMessageHeader[] | undefined, name: string) {
  const match = headers?.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.value ?? "";
}

async function gmailJson<T>(
  accessToken: string,
  input: string | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = new Error(`Gmail API request failed (${response.status})`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

async function listMessages(accessToken: string, query: string) {
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("maxResults", String(MAX_RESULTS_PER_YEAR));
  url.searchParams.set("q", query);
  url.searchParams.set("includeSpamTrash", "false");
  return gmailJson<GmailMessageList>(accessToken, url);
}

async function getMessage(accessToken: string, messageId: string) {
  const url = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
  );
  url.searchParams.set("format", "metadata");
  ["Subject", "To", "From", "Date"].forEach((header) => {
    url.searchParams.append("metadataHeaders", header);
  });
  return gmailJson<GmailMessage>(accessToken, url);
}

async function refreshAccessToken(googleAccount: AccountRow) {
  if (!googleAccount.refreshToken) {
    return null;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: googleAccount.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await db
    .update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: expiresAt,
      refreshToken: data.refresh_token ?? googleAccount.refreshToken,
      scope: data.scope ?? googleAccount.scope,
      updatedAt: new Date(),
    })
    .where(eq(account.id, googleAccount.id));

  return data.access_token;
}

async function ensureAccessToken(googleAccount: AccountRow) {
  const accessToken = googleAccount.accessToken;

  if (!accessToken) {
    return null;
  }

  if (!googleAccount.accessTokenExpiresAt) {
    return accessToken;
  }

  const expiresAt = googleAccount.accessTokenExpiresAt.getTime();
  if (expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return accessToken;
  }

  return refreshAccessToken(googleAccount);
}

async function fetchMemories(accessToken: string) {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();
  const memories: Array<{ memory: MemoryItem; sortKey: number }> = [];

  for (let offset = 1; offset <= YEARS_BACK; offset += 1) {
    const year = today.getFullYear() - offset;
    const start = new Date(year, month, day);
    const end = new Date(year, month, day + 1);
    const query = `from:me after:${formatGmailDate(
      start,
    )} before:${formatGmailDate(end)}`;

    const list = await listMessages(accessToken, query);
    if (!list.messages?.length) {
      continue;
    }

    const details = await Promise.all(
      list.messages.map((message) => getMessage(accessToken, message.id)),
    );

    for (const detail of details) {
      const headers = detail.payload?.headers ?? [];
      const subject = getHeaderValue(headers, "Subject") || "(No subject)";
      const to = getHeaderValue(headers, "To") || "Unknown recipient";
      const dateHeader = getHeaderValue(headers, "Date");
      const internalDate = detail.internalDate
        ? new Date(Number(detail.internalDate))
        : dateHeader
          ? new Date(dateHeader)
          : start;
      const formattedDate = formatDisplayDate(internalDate);
      const threadId = detail.threadId || detail.id;

      memories.push({
        sortKey: internalDate.getTime(),
        memory: {
          id: detail.id,
          subject,
          snippet: detail.snippet ?? "",
          to,
          date: formattedDate,
          year: String(internalDate.getFullYear()),
          gmailLink: `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
        },
      });
    }
  }

  return memories
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((entry) => entry.memory);
}

export async function getMemoriesForToday(
  userId: string,
): Promise<MemoriesResult> {
  const [googleAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);

  if (!googleAccount) {
    return {
      status: "needs-connection",
      message: "Reconnect Gmail to load your memories.",
    };
  }

  const accessToken = await ensureAccessToken(googleAccount);

  if (!accessToken) {
    return {
      status: "needs-connection",
      message: "Reconnect Gmail to refresh access.",
    };
  }

  try {
    const items = await fetchMemories(accessToken);
    return { status: "ok", items };
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: number }).status === "number"
        ? (error as { status?: number }).status
        : undefined;

    if (status === 401) {
      const refreshed = await refreshAccessToken(googleAccount);
      if (refreshed) {
        const items = await fetchMemories(refreshed);
        return { status: "ok", items };
      }
      return {
        status: "needs-connection",
        message: "Reconnect Gmail to refresh access.",
      };
    }

    return {
      status: "error",
      message: "We could not reach Gmail right now.",
    };
  }
}
