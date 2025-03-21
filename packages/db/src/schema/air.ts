import { relations } from "drizzle-orm";
import {
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

import { INTEGRATIONS_ARRAY_FOR_MYSQL } from "@1up/consts/integrations";
import { cloudTypeIdGenerator } from "@1up/utils/typeid";

import { typeIdColumn } from "../customColumnTypes";
import { users } from "./auth";
import { timestamps } from "./helpers";

export const airReadings = mysqlTable("airReadings", {
  id: typeIdColumn("airReading", "id")
    .primaryKey()
    .$default(() => cloudTypeIdGenerator("airReading")),
  ownerId: typeIdColumn("user", "user_id").notNull(),
  rawData: json("rawData"),
  source: mysqlEnum("type", INTEGRATIONS_ARRAY_FOR_MYSQL).notNull(),
  sourceSessionId: varchar("sourceSessionId", { length: 128 }),
  readingTime: timestamp("created_at").notNull(),
  co2: tinyint("co2"),
  temperature: tinyint("temperature"),
  humidity: tinyint("humidity"),
  timezoneOffset: tinyint("timezoneOffset"),
  ...timestamps.createUpdateLogged,
});

export const airReadingsRelations = relations(airReadings, ({ one }) => ({
  owner: one(users, {
    fields: [airReadings.ownerId],
    references: [users.id],
  }),
}));
