import { describe, expect, it } from "vitest";
import { __testables } from "@/app/pages/databases/postgres";

const {
  stripTrailingSemicolon,
  isPotentiallyDestructiveSql,
  isReadQuery,
  hasMultipleStatements,
} = __testables;

describe("sql guard helpers", () => {
  it("removes trailing semicolons", () => {
    expect(stripTrailingSemicolon("SELECT 1;;;   ")).toBe("SELECT 1");
  });

  it("detects potentially destructive SQL", () => {
    expect(isPotentiallyDestructiveSql("DROP TABLE users")).toBe(true);
    expect(isPotentiallyDestructiveSql("update users set active = false")).toBe(true);
    expect(isPotentiallyDestructiveSql("ALTER TABLE users ADD COLUMN age int")).toBe(true);
    expect(isPotentiallyDestructiveSql("SELECT * FROM users")).toBe(false);
  });

  it("detects read queries", () => {
    expect(isReadQuery("SELECT * FROM users")).toBe(true);
    expect(isReadQuery("   show search_path")).toBe(true);
    expect(isReadQuery("EXPLAIN SELECT 1")).toBe(true);
    expect(isReadQuery("WITH x AS (SELECT 1) SELECT * FROM x")).toBe(true);
    expect(isReadQuery("DELETE FROM users")).toBe(false);
  });

  it("detects multiple statements", () => {
    expect(hasMultipleStatements("SELECT 1; SELECT 2;")).toBe(true);
    expect(hasMultipleStatements("SELECT 1;;")).toBe(false);
    expect(hasMultipleStatements("SELECT 1")).toBe(false);
    expect(hasMultipleStatements(" ; ; ")).toBe(false);
  });

  it("keeps query unchanged if no trailing semicolon", () => {
    expect(stripTrailingSemicolon("SELECT now()")).toBe("SELECT now()");
  });
});
