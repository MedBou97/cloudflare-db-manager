import type { RequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { AppShell } from "@/app/shared/AppShell";
import { RecordFilters } from "../records/RecordFilters";
import { RecordList } from "../records/RecordList";
import { DeleteDatasetButton } from "./DeleteDatasetButton";
import { ROLES, RECORDS_PER_PAGE } from "@/app/shared/constants";

export async function DatabaseDetailPage({ ctx, request }: RequestInfo) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const datasetId = pathParts[pathParts.length - 1];

  const dataset = await db.dataset.findUnique({
    where: { id: datasetId },
    include: {
      importedBy: { select: { username: true } },
      _count: { select: { records: true } },
    },
  });

  if (!dataset) {
    return new Response("Dataset not found", { status: 404 });
  }

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
      { datasetId },
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
      where: { datasetId },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = allCategories.map((c) => c.category);
  const totalPages = Math.ceil(total / RECORDS_PER_PAGE);
  const isAdmin = ctx.user?.role === ROLES.ADMIN;
  const basePath = `/databases/${datasetId}`;

  const buildUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const current: Record<string, string> = { search, category, status, sort, order, page: String(page) };
    Object.assign(current, Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, String(v)])));
    Object.entries(current).forEach(([k, v]) => {
      if (v && !(k === "page" && v === "1")) params.set(k, v);
    });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-7">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <div className="border rounded-full font-semibold text-sm text-[#8a7767] hover:text-accent-strong inline-block">
            <a href="/databases" className="block px-4 py-1">← Databases</a>
          </div>
          {isAdmin && (
            <DeleteDatasetButton datasetId={datasetId} datasetName={dataset.name} />
          )}
        </div>
        <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">
          {dataset.name}
        </h1>
        {dataset.description && (
          <p className="m-0 mb-1 text-[#5f5044] text-[0.95rem]">{dataset.description}</p>
        )}
        <p className="m-0 text-[#8a7767] text-[0.85rem]">
          {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          {search || category || status ? " (filtered)" : ""}
          {" · "}
          {dataset.importedBy
            ? `Imported by ${dataset.importedBy.username}`
            : "System dataset"}
          {" · "}
          {new Date(dataset.importedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
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
        datasetId={datasetId}
      />

      <RecordList initialRecords={records} isAdmin={isAdmin} />

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-[rgba(86,67,48,0.12)]"
          aria-label="Records pagination"
        >
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
