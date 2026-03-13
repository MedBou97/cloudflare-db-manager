import { RequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { AppShell } from "@/app/shared/AppShell";
import { RecordFilters } from "./RecordFilters";
import { RecordList } from "./RecordList";
import { ROLES, RECORDS_PER_PAGE, AUDIT_ACTIONS } from "@/app/shared/constants";
import { logAction } from "./actions";

export async function RecordsPage({ ctx, request }: RequestInfo) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const search = url.searchParams.get("search") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const allowedSortFields = ["createdAt", "updatedAt", "label", "numericValue", "confidence", "category"] as const;
  type SortField = (typeof allowedSortFields)[number];
  const rawSort = url.searchParams.get("sort") ?? "createdAt";
  const sort: SortField = allowedSortFields.includes(rawSort as SortField)
    ? (rawSort as SortField)
    : "createdAt";
  const order = url.searchParams.get("order") === "asc" ? ("asc" as const) : ("desc" as const);

  const where = {
    AND: [
      search
        ? {
            OR: [
              { label: { contains: search } },
              { description: { contains: search } },
              { category: { contains: search } },
              { source: { contains: search } },
            ],
          }
        : {},
      category ? { category: { equals: category } } : {},
      status ? { status: { equals: status } } : {},
    ],
  };

  const [records, total, allCategories] = await Promise.all([
    db.vectorRecord.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * RECORDS_PER_PAGE,
      take: RECORDS_PER_PAGE,
      include: { createdBy: { select: { username: true } } },
    }),
    db.vectorRecord.count({ where }),
    db.vectorRecord.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = allCategories.map((c) => c.category);
  const totalPages = Math.ceil(total / RECORDS_PER_PAGE);
  const isAdmin = ctx.user?.role === ROLES.ADMIN;

  // Log the view action
  if (ctx.user) {
    await logAction(
      ctx.user.id,
      ctx.user.username,
      AUDIT_ACTIONS.VIEW_RECORDS,
      null,
      `${ctx.user.username} browsed records (page ${page}${search ? `, search: "${search}"` : ""}${category ? `, category: "${category}"` : ""}${status ? `, status: "${status}"` : ""})`,
    );
  }

  const buildUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const current: Record<string, string> = {
      search,
      category,
      status,
      sort,
      order,
      page: String(page),
    };
    Object.assign(current, Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, String(v)])));
    Object.entries(current).forEach(([k, v]) => {
      if (v && !(k === "page" && v === "1")) params.set(k, v);
    });
    return `/records?${params.toString()}`;
  };

  return (
    <AppShell user={ctx.user} currentPath="/records">
      <div className="mb-7">
        <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">Vector Records</h1>
        <p className="m-0 text-[#5f5044] text-[0.95rem]">
          {total.toLocaleString()} record{total !== 1 ? "s" : ""} total
          {search || category || status ? " (filtered)" : ""}
        </p>
      </div>

      <RecordFilters
        search={search}
        category={category}
        status={status}
        sort={sort}
        order={order}
        categories={categories}
        userRole={ctx.user?.role ?? "USER"}
      />

      <RecordList
        initialRecords={records}
        isAdmin={isAdmin}
      />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-[rgba(86,67,48,0.12)]" aria-label="Records pagination">
          <a
            href={buildUrl({ page: page - 1 })}
            className={`px-[18px] py-2 rounded-xl border border-[rgba(92,73,56,0.16)] bg-[rgba(255,252,247,0.82)] text-[#5f5044] text-sm font-semibold no-underline inline-flex items-center gap-1.5 transition-colors hover:bg-[rgba(31,106,82,0.08)] hover:border-[rgba(31,106,82,0.25)] hover:text-accent-strong${page <= 1 ? " opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
            aria-disabled={page <= 1}
          >
            ← Previous
          </a>
          <span className="text-sm text-[#8a7767]">
            Page {page} of {totalPages}
          </span>
          <a
            href={buildUrl({ page: page + 1 })}
            className={`px-[18px] py-2 rounded-xl border border-[rgba(92,73,56,0.16)] bg-[rgba(255,252,247,0.82)] text-[#5f5044] text-sm font-semibold no-underline inline-flex items-center gap-1.5 transition-colors hover:bg-[rgba(31,106,82,0.08)] hover:border-[rgba(31,106,82,0.25)] hover:text-accent-strong${page >= totalPages ? " opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
            aria-disabled={page >= totalPages}
          >
            Next →
          </a>
        </nav>
      )}
    </AppShell>
  );
}
