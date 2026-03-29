import { env } from "cloudflare:workers";

export const Constants = Object.freeze({
  BASE_URL: env.APP_BASE_URL || "http://localhost:5173",
  VERIFICATION_EXPIRES: 1000 * 60 * 60 * 24,
});

export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const AUDIT_ACTIONS = Object.freeze({
  CREATE_RECORD: "CREATE_RECORD",
  EDIT_RECORD: "EDIT_RECORD",
  DELETE_RECORD: "DELETE_RECORD",
  VIEW_LOGS: "VIEW_LOGS",
  CREATE_DB_CONNECTION: "CREATE_DB_CONNECTION",
  TEST_DB_CONNECTION: "TEST_DB_CONNECTION",
  VIEW_DB_TABLES: "VIEW_DB_TABLES",
  INSERT_TABLE_ROW: "INSERT_TABLE_ROW",
  UPDATE_TABLE_ROW: "UPDATE_TABLE_ROW",
  DELETE_TABLE_ROW: "DELETE_TABLE_ROW",
  EXECUTE_SQL_QUERY: "EXECUTE_SQL_QUERY",
} as const);

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const LOGS_PER_PAGE = 20;
