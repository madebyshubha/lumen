import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    providerSub: text("provider_sub").notNull(),
    email: text("email"),
    name: text("name"),
    diet: text("diet"),
    homeCountry: text("home_country"),
    energy: integer("energy"),
    lastPeriodIso: text("last_period_iso"),
    cycleLength: integer("cycle_length"),
    sessionVersion: integer("session_version").notNull().default(1),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    providerSubUniq: uniqueIndex("users_provider_provider_sub_uniq").on(
      t.provider,
      t.providerSub,
    ),
  }),
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
