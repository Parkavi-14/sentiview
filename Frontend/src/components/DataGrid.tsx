import { useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  User,
  Database,
  Star,
  Filter,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface DataGridReview {
  id: number | string;

  source?: "dataset" | "user" | string;

  user?: string;

  rating?: number;

  title?: string;

  body?: string;

  sentiment?: string;

  is_fake?: boolean | null;

  fake_confidence?: number | null;

  created_at?: string;

  country?: string;

  verified?: boolean;

  [key: string]: unknown;
}

type SortDirection = "asc" | "desc";

type SortKey =
  | "user"
  | "rating"
  | "sentiment"
  | "is_fake"
  | "fake_confidence"
  | "created_at";

interface DataGridProps {
  data: DataGridReview[];

  pageSize?: number;

  searchable?: boolean;

  showFilters?: boolean;

  title?: string;

  emptyMessage?: string;

  className?: string;
}

// ─────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────

const getSentimentClass = (sentiment?: string) => {
  switch (sentiment) {
    case "Positive":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";

    case "Negative":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";

    case "Neutral":
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

    default:
      return "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300";
  }
};

const formatDate = (date?: string) => {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const clampPercentage = (value: number) => {
  return Math.min(100, Math.max(0, value));
};

// ─────────────────────────────────────────────────────────────
// SORT BUTTON
// ─────────────────────────────────────────────────────────────

interface SortButtonProps {
  label: string;

  column: SortKey;

  sortKey: SortKey | null;

  sortDirection: SortDirection;

  onSort: (column: SortKey) => void;
}

const SortButton = ({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: SortButtonProps) => {
  const active = sortKey === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
    >
      {label}

      {active ? (
        sortDirection === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ChevronsUpDown size={14} />
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────

const Rating = ({ value }: { value?: number }) => {
  const rating = Number(value ?? 0);

  return (
    <div className="flex items-center gap-1">
      <Star
        size={14}
        className="fill-amber-400 text-amber-400"
      />

      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {rating > 0 ? rating.toFixed(1) : "—"}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SENTIMENT BADGE
// ─────────────────────────────────────────────────────────────

const SentimentBadge = ({
  sentiment,
}: {
  sentiment?: string;
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getSentimentClass(
        sentiment
      )}`}
    >
      {sentiment || "Unknown"}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// AUTHENTICITY BADGE
// ─────────────────────────────────────────────────────────────

const AuthenticityBadge = ({
  isFake,
}: {
  isFake?: boolean | null;
}) => {
  if (isFake === true) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <ShieldAlert size={13} />
        Suspected Fake
      </span>
    );
  }

  if (isFake === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <ShieldCheck size={13} />
        Genuine
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
      Unknown
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// SOURCE BADGE
// ─────────────────────────────────────────────────────────────

const SourceBadge = ({
  source,
}: {
  source?: string;
}) => {
  if (source === "user") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
        <User size={12} />
        User
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
      <Database size={12} />
      Dataset
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// CONFIDENCE BAR
// ─────────────────────────────────────────────────────────────

const ConfidenceBar = ({
  confidence,
}: {
  confidence?: number | null;
}) => {
  if (confidence === null || confidence === undefined) {
    return (
      <span className="text-xs text-gray-400">
        —
      </span>
    );
  }

  const percentage = clampPercentage(
    confidence <= 1 ? confidence * 100 : confidence
  );

  let barClass = "bg-emerald-500";

  if (percentage >= 70) {
    barClass = "bg-rose-500";
  } else if (percentage >= 40) {
    barClass = "bg-amber-500";
  }

  return (
    <div className="w-24">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Confidence
        </span>

        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN DATAGRID
// ─────────────────────────────────────────────────────────────

export default function DataGrid({
  data,
  pageSize = 10,
  searchable = true,
  showFilters = true,
  title = "Review Data",
  emptyMessage = "No reviews found.",
  className = "",
}: DataGridProps) {
  const [search, setSearch] = useState("");

  const [sentimentFilter, setSentimentFilter] =
    useState("all");

  const [authFilter, setAuthFilter] =
    useState("all");

  const [ratingFilter, setRatingFilter] =
    useState("all");

  const [sourceFilter, setSourceFilter] =
    useState("all");

  const [sortKey, setSortKey] =
    useState<SortKey | null>(null);

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [currentPage, setCurrentPage] = useState(1);

  // ─────────────────────────────────────────────────────────
  // FILTER DATA
  // ─────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((review) => {
      // Search
      if (query) {
        const searchableText = [
          review.user,
          review.title,
          review.body,
          review.sentiment,
          review.country,
          review.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Sentiment
      if (
        sentimentFilter !== "all" &&
        review.sentiment !== sentimentFilter
      ) {
        return false;
      }

      // Authenticity
      if (authFilter !== "all") {
        if (
          authFilter === "fake" &&
          review.is_fake !== true
        ) {
          return false;
        }

        if (
          authFilter === "genuine" &&
          review.is_fake !== false
        ) {
          return false;
        }
      }

      // Rating
      if (ratingFilter !== "all") {
        const rating = Number(review.rating);

        if (rating !== Number(ratingFilter)) {
          return false;
        }
      }

      // Source
      if (
        sourceFilter !== "all" &&
        review.source !== sourceFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    data,
    search,
    sentimentFilter,
    authFilter,
    ratingFilter,
    sourceFilter,
  ]);

  // ─────────────────────────────────────────────────────────
  // SORT
  // ─────────────────────────────────────────────────────────

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      let first: any;
      let second: any;

      switch (sortKey) {
        case "user":
          first = String(a.user ?? "");
          second = String(b.user ?? "");
          break;

        case "rating":
          first = Number(a.rating ?? 0);
          second = Number(b.rating ?? 0);
          break;

        case "sentiment":
          first = String(a.sentiment ?? "");
          second = String(b.sentiment ?? "");
          break;

        case "is_fake":
          first = a.is_fake === true ? 1 : 0;
          second = b.is_fake === true ? 1 : 0;
          break;

        case "fake_confidence":
          first = Number(a.fake_confidence ?? 0);
          second = Number(b.fake_confidence ?? 0);
          break;

        case "created_at":
          first = new Date(
            a.created_at ?? 0
          ).getTime();

          second = new Date(
            b.created_at ?? 0
          ).getTime();

          break;

        default:
          return 0;
      }

      if (typeof first === "string") {
        const result = first.localeCompare(second);

        return sortDirection === "asc"
          ? result
          : -result;
      }

      if (first < second) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (first > second) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [
    filteredData,
    sortKey,
    sortDirection,
  ]);

  // ─────────────────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────────────────

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / pageSize)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * pageSize;

  const endIndex = startIndex + pageSize;

  const paginatedData = sortedData.slice(
    startIndex,
    endIndex
  );

  // ─────────────────────────────────────────────────────────
  // SORT HANDLER
  // ─────────────────────────────────────────────────────────

  const handleSort = (column: SortKey) => {
    if (sortKey === column) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(column);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  };

  // ─────────────────────────────────────────────────────────
  // FILTER CHANGE
  // ─────────────────────────────────────────────────────────

  const resetFilters = () => {
    setSearch("");
    setSentimentFilter("all");
    setAuthFilter("all");
    setRatingFilter("all");
    setSourceFilter("all");
    setCurrentPage(1);
  };

  const hasFilters =
    search ||
    sentimentFilter !== "all" ||
    authFilter !== "all" ||
    ratingFilter !== "all" ||
    sourceFilter !== "all";

  // ─────────────────────────────────────────────────────────
  // PAGE CHANGE
  // ─────────────────────────────────────────────────────────

  const goToPage = (page: number) => {
    const safePage = Math.max(
      1,
      Math.min(page, totalPages)
    );

    setCurrentPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ─────────────────────────────────────────────────────────
  // PAGE NUMBERS
  // ─────────────────────────────────────────────────────────

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    const maxVisible = 5;

    let start = Math.max(
      1,
      safeCurrentPage - 2
    );

    let end = Math.min(
      totalPages,
      start + maxVisible - 1
    );

    if (end - start < maxVisible - 1) {
      start = Math.max(
        1,
        end - maxVisible + 1
      );
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}
    >

      {/* ───────────────────────────────────────────────
          HEADER
      ─────────────────────────────────────────────── */}

      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Showing {sortedData.length} of{" "}
              {data.length} reviews
            </p>
          </div>

          {/* SEARCH */}
          {searchable && (
            <div className="relative w-full lg:w-72">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search reviews..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />

            </div>
          )}

        </div>

      </div>

      {/* ───────────────────────────────────────────────
          FILTERS
      ─────────────────────────────────────────────── */}

      {showFilters && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">

          <div className="flex flex-wrap items-center gap-2">

            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
              <Filter size={13} />
              Filters
            </div>

            {/* SENTIMENT */}
            <select
              value={sentimentFilter}
              onChange={(event) => {
                setSentimentFilter(
                  event.target.value
                );
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="all">
                All Sentiments
              </option>
              <option value="Positive">
                Positive
              </option>
              <option value="Neutral">
                Neutral
              </option>
              <option value="Negative">
                Negative
              </option>
            </select>

            {/* AUTHENTICITY */}
            <select
              value={authFilter}
              onChange={(event) => {
                setAuthFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="all">
                All Authenticity
              </option>
              <option value="genuine">
                Genuine
              </option>
              <option value="fake">
                Suspected Fake
              </option>
            </select>

            {/* RATING */}
            <select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="all">
                All Ratings
              </option>

              <option value="5">
                5 Stars
              </option>

              <option value="4">
                4 Stars
              </option>

              <option value="3">
                3 Stars
              </option>

              <option value="2">
                2 Stars
              </option>

              <option value="1">
                1 Star
              </option>
            </select>

            {/* SOURCE */}
            <select
              value={sourceFilter}
              onChange={(event) => {
                setSourceFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="all">
                All Sources
              </option>

              <option value="dataset">
                Dataset
              </option>

              <option value="user">
                User
              </option>
            </select>

            {/* RESET */}
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────
          TABLE
      ─────────────────────────────────────────────── */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px]">

          <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">

            <tr>

              {/* REVIEWER */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Reviewer"
                  column="user"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

              {/* REVIEW */}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Review
                </span>
              </th>

              {/* RATING */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Rating"
                  column="rating"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

              {/* SENTIMENT */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Sentiment"
                  column="sentiment"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

              {/* AUTHENTICITY */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Authenticity"
                  column="is_fake"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

              {/* CONFIDENCE */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Confidence"
                  column="fake_confidence"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

              {/* SOURCE */}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Source
                </span>
              </th>

              {/* DATE */}
              <th className="px-5 py-3 text-left">
                <SortButton
                  label="Date"
                  column="created_at"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">

            {paginatedData.length === 0 ? (

              <tr>

                <td
                  colSpan={8}
                  className="px-5 py-16 text-center"
                >

                  <div className="flex flex-col items-center">

                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                      <Search
                        size={20}
                        className="text-gray-400"
                      />
                    </div>

                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      {emptyMessage}
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}

                  </div>

                </td>

              </tr>

            ) : (

              paginatedData.map((review) => (

                <tr
                  key={String(review.id)}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition"
                >

                  {/* REVIEWER */}
                  <td className="px-5 py-4 align-top">

                    <div className="flex items-start gap-2.5">

                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <User
                          size={14}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
                          {review.user || "Anonymous"}
                        </p>

                        {review.country && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {review.country}
                          </p>
                        )}

                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                            <ShieldCheck size={10} />
                            Verified
                          </span>
                        )}

                      </div>

                    </div>

                  </td>

                  {/* REVIEW */}
                  <td className="px-5 py-4 align-top max-w-[350px]">

                    <div>

                      {review.title && (
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">
                          {review.title}
                        </p>
                      )}

                      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">
                        {review.body || "No review text available."}
                      </p>

                    </div>

                  </td>

                  {/* RATING */}
                  <td className="px-5 py-4 align-top">
                    <Rating value={review.rating} />
                  </td>

                  {/* SENTIMENT */}
                  <td className="px-5 py-4 align-top">
                    <SentimentBadge
                      sentiment={review.sentiment}
                    />
                  </td>

                  {/* AUTHENTICITY */}
                  <td className="px-5 py-4 align-top">
                    <AuthenticityBadge
                      isFake={review.is_fake}
                    />
                  </td>

                  {/* CONFIDENCE */}
                  <td className="px-5 py-4 align-top">
                    <ConfidenceBar
                      confidence={
                        review.fake_confidence
                      }
                    />
                  </td>

                  {/* SOURCE */}
                  <td className="px-5 py-4 align-top">
                    <SourceBadge
                      source={review.source}
                    />
                  </td>

                  {/* DATE */}
                  <td className="px-5 py-4 align-top">

                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(
                        review.created_at
                      )}
                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* ───────────────────────────────────────────────
          PAGINATION
      ─────────────────────────────────────────────── */}

      {sortedData.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-xs text-gray-500 dark:text-gray-400">

            Showing{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {Math.min(
                endIndex,
                sortedData.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {sortedData.length}
            </span>

          </p>

          <div className="flex items-center gap-1">

            {/* PREVIOUS */}
            <button
              type="button"
              onClick={() =>
                goToPage(safeCurrentPage - 1)
              }
              disabled={safeCurrentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* PAGE NUMBERS */}
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                  page === safeCurrentPage
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}
            <button
              type="button"
              onClick={() =>
                goToPage(safeCurrentPage + 1)
              }
              disabled={
                safeCurrentPage === totalPages
              }
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}