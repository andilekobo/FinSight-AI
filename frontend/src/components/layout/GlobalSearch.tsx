import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAccounts,
  getCurrentUserId,
  getFinancialSummary,
  getSavedInsights,
  getTransactions,
  type Account,
  type FinancialSummary,
  type SavedInsight,
  type Transaction,
} from "../../data/api";
import { formatCurrency } from "../../utils/currency";

type Destination = { label: string; path: string };
type SearchResult = {
  id: string;
  title: string;
  detail: string;
  path: string;
  kind: string;
};

type SearchData = {
  accounts: Account[];
  summary: FinancialSummary | null;
  transactions: Transaction[];
  insights: SavedInsight[];
  loading: boolean;
  unavailable: string[];
};

const emptySearchData: SearchData = {
  accounts: [],
  summary: null,
  transactions: [],
  insights: [],
  loading: true,
  unavailable: [],
};

function matchesQuery(value: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const searchable = value.toLowerCase();
  return words.every((word) => searchable.includes(word));
}

export function GlobalSearch({ destinations }: { destinations: Destination[] }) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchData>(emptySearchData);

  useEffect(() => {
    let active = true;

    async function loadSearchData() {
      const userId = getCurrentUserId();
      if (!userId) {
        if (active) setData({ ...emptySearchData, loading: false, unavailable: ["account records"] });
        return;
      }

      const sources = await Promise.allSettled([
        getAccounts(userId),
        getFinancialSummary(userId),
        getTransactions(userId, 500),
        getSavedInsights(),
      ]);
      if (!active) return;

      const unavailable: string[] = [];
      const [accountsResult, summaryResult, transactionsResult, insightsResult] = sources;
      const accounts = accountsResult.status === "fulfilled" && Array.isArray(accountsResult.value)
        ? accountsResult.value
        : (unavailable.push("account records"), []);
      const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
      if (!summary) unavailable.push("financial summary");
      const transactions = transactionsResult.status === "fulfilled" && Array.isArray(transactionsResult.value)
        ? transactionsResult.value
        : (unavailable.push("transactions"), []);
      const insights = insightsResult.status === "fulfilled" && Array.isArray(insightsResult.value?.insights)
        ? insightsResult.value.insights
        : (unavailable.push("saved insights"), []);

      setData({ accounts, summary, transactions, insights, loading: false, unavailable });
    }

    void loadSearchData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const results = useMemo(() => {
    const term = query.trim();
    if (!term) return [];
    const found: SearchResult[] = destinations
      .filter((destination) => matchesQuery(destination.label, term))
      .map((destination) => ({
        id: `page:${destination.path}`,
        title: destination.label,
        detail: "Go to page",
        path: destination.path,
        kind: "Page",
      }));

    data.accounts.forEach((account) => {
      const searchable = `${account.account_name} ${account.account_type} ${account.currency} ${account.balance}`;
      if (matchesQuery(searchable, term)) {
        found.push({
          id: `account:${account.id}`,
          title: account.account_name,
          detail: `${account.account_type} · ${formatCurrency(Number(account.balance), account.currency)}`,
          path: "/financial",
          kind: "Account",
        });
      }
    });

    data.transactions.forEach((transaction) => {
      const searchable = [
        transaction.description,
        transaction.category,
        transaction.account_id,
        transaction.transaction_date,
        transaction.transaction_type,
        transaction.currency,
        transaction.amount,
      ].join(" ");
      if (matchesQuery(searchable, term)) {
        found.push({
          id: `transaction:${transaction.id}`,
          title: transaction.description || "Transaction",
          detail: `${transaction.category} · ${transaction.transaction_type} · ${formatCurrency(Number(transaction.amount), transaction.currency)} · ${transaction.transaction_date}`,
          path: "/transactions",
          kind: "Transaction",
        });
      }
    });

    data.insights.forEach((insight) => {
      const searchable = `${insight.title ?? ""} ${insight.description ?? ""} ${insight.insight_type ?? ""} ${insight.category ?? ""} ${insight.message ?? ""} ${insight.severity ?? ""}`;
      if (matchesQuery(searchable, term)) {
        found.push({
          id: `insight:${insight.id}`,
          title: insight.title || insight.insight_type || "Saved insight",
          detail: insight.description || insight.message || insight.category || "Saved financial insight",
          path: "/ai-insights",
          kind: "Insight",
        });
      }
    });

    if (data.summary) {
      const summary = data.summary;
      const searchable = `financial summary total income ${summary.total_income} expenses ${summary.total_expenses} fees ${summary.total_fees} net cash flow ${summary.net_cash_flow} transaction count ${summary.transaction_count}`;
      if (matchesQuery(searchable, term)) {
        found.push({
          id: "financial-summary",
          title: "Financial summary",
          detail: `Income ${summary.total_income} · Expenses ${summary.total_expenses} · Net cash flow ${summary.net_cash_flow} · Currency not supplied`,
          path: "/financial",
          kind: "Financial",
        });
      }
    }

    return found.slice(0, 8);
  }, [data, destinations, query]);

  function selectResult(result: SearchResult) {
    navigate(result.path);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
    } else if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      selectResult(results[0]);
    }
  }

  return (
    <div className="global-search" ref={rootRef}>
      <label className="topbar-search" htmlFor="global-search-input">
        <Search size={16} aria-hidden="true" />
        <input
          id="global-search-input"
          type="search"
          value={query}
          placeholder="Search anything..."
          aria-label="Search pages and available financial data"
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        {!query && <kbd>⌘ K</kbd>}
        {query && (
          <button
            type="button"
            className="global-search-clear"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => { setQuery(""); setOpen(false); }}
          >
            <X size={14} />
          </button>
        )}
      </label>
      {open && query.trim() && (
        <div className="global-search-dropdown" id="global-search-results" role="listbox" aria-label="Search results">
          {data.loading ? (
            <div className="global-search-state" role="status">Searching available account data…</div>
          ) : results.length ? (
            <>
              <div className="global-search-caption">RESULTS</div>
              {results.map((result) => (
                <button
                  className="global-search-result"
                  id={`global-search-option-${result.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectResult(result)}
                >
                  <span className="global-search-result-copy">
                    <strong>{result.title}</strong>
                    <small>{result.detail}</small>
                  </span>
                  <span className="global-search-kind">{result.kind}</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              ))}
              {data.unavailable.length > 0 && (
                <div className="global-search-limitation">Some account data could not be loaded: {data.unavailable.join(", ")}.</div>
              )}
            </>
          ) : (
            <>
              <div className="global-search-state">No results match “{query.trim()}”.</div>
              {data.unavailable.length > 0 && (
                <div className="global-search-limitation">Some account data could not be searched: {data.unavailable.join(", ")}.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
