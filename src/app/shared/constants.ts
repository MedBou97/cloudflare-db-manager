export const Constants = Object.freeze({
  BASE_URL: "http://localhost:5173",
  VERIFICATION_EXPIRES: 1000 * 60 * 60 * 24,
});

export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const AUDIT_ACTIONS = Object.freeze({
  VIEW_RECORDS: "VIEW_RECORDS",
  VIEW_RECORD: "VIEW_RECORD",
  CREATE_RECORD: "CREATE_RECORD",
  EDIT_RECORD: "EDIT_RECORD",
  DELETE_RECORD: "DELETE_RECORD",
  VIEW_LOGS: "VIEW_LOGS",
  IMPORT_DATASET: "IMPORT_DATASET",
  DELETE_DATASET: "DELETE_DATASET",
} as const);

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const VECTOR_PREVIEW_LENGTH = 5;
export const RECORDS_PER_PAGE = 10;
export const LOGS_PER_PAGE = 20;
