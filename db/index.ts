import dns from "dns";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Agent } from "undici";
import { schema } from "./schema";

const connectionString = process.env.DATABASE_URL;
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!connectionString && !isBuild) {
  throw new Error("DATABASE_URL is not set");
}

const useNeonHttp = Boolean(
  connectionString && connectionString.includes(".neon.tech")
);

if (connectionString) {
  dns.setDefaultResultOrder("ipv4first");
}

if (useNeonHttp) {
  const neonAgent = new Agent({
    connect: {
      lookup: (hostname, options, callback) => {
        const cb = typeof options === "function" ? options : callback;
        const wantsAll = typeof options === "object" && options?.all;
        dns.lookup(hostname, { family: 4, all: Boolean(wantsAll) }, cb);
      },
    },
  });

  neonConfig.fetchFunction = (input, init) =>
    fetch(input, { ...init, dispatcher: neonAgent });
}

const pool = useNeonHttp
  ? null
  : new Pool({
      ...(connectionString ? { connectionString } : {}),
      ...(connectionString ? { ssl: { rejectUnauthorized: false } } : {}),
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    });

const db = useNeonHttp
  ? drizzleNeon(neon(connectionString ?? ""), { schema })
  : drizzleNode(pool as Pool, { schema });

export { db };
