import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./currency";
import type {
  Account,
  FinancialSummary,
  SavedInsight,
  Transaction,
} from "../data/api";
import type { Forecast } from "../types";

type FinancialReportData = {
  accounts: Account[] | null;
  summary: FinancialSummary | null;
  transactions: Transaction[] | null;
  insights: SavedInsight[] | null;
  cashFlow: Forecast[] | null;
};

const green: [number, number, number] = [17, 151, 106];
const ink: [number, number, number] = [33, 49, 40];
const muted: [number, number, number] = [111, 127, 117];

function formatAmount(value: number | string, currency?: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Unavailable";

  const formatted = new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!currency) return formatted;
  return formatCurrency(amount, currency);
}

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function localDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  y: number,
  subtitle?: string,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text(title, 42, y);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(subtitle, 42, y + 13);
    return y + 24;
  }
  return y + 12;
}

function addTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: (string | number)[][],
): number {
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    margin: { left: 42, right: 42, top: 42, bottom: 44 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 7,
      textColor: ink,
      overflow: "linebreak",
      lineColor: [231, 237, 232],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [237, 246, 240],
      textColor: [39, 91, 62],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [249, 251, 249] },
    didDrawPage: () => {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...green);
      doc.text("FINSIGHT AI  /  FINANCIAL REPORT", 42, 25);
      doc.setDrawColor(230, 237, 232);
      doc.line(42, 32, pageWidth - 42, 32);
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 19;
}

function addUnavailable(doc: jsPDF, message: string, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const lines = doc.splitTextToSize(message, doc.internal.pageSize.getWidth() - 84);
  doc.text(lines, 42, y);
  return y + lines.length * 12 + 10;
}

function ensureSpace(doc: jsPDF, y: number, height: number): number {
  if (y + height <= doc.internal.pageSize.getHeight() - 48) return y;
  doc.addPage();
  return 52;
}

export function createFinancialReport(
  data: FinancialReportData,
): { blob: Blob; filename: string } {
  const generatedAt = new Date();
  const dateStamp = localDateStamp(generatedAt);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 84;

  doc.setFillColor(...green);
  doc.rect(0, 0, pageWidth, 105, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(219, 247, 230);
  doc.text("FINSIGHT AI", 42, 34);
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Financial Report", 42, 63);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(231, 248, 237);
  doc.text(
    `Generated ${generatedAt.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    42,
    82,
  );

  let y = 132;
  y = drawSectionTitle(
    doc,
    "Financial overview",
    y,
    data.summary
      ? `Reporting period: ${formatDate(data.summary.period.start_date)} to ${formatDate(data.summary.period.end_date)}`
      : "Financial summary is unavailable.",
  );

  if (data.summary) {
    const metrics = [
      ["Total income", data.summary.total_income],
      ["Total expenses", data.summary.total_expenses],
      ["Total fees", data.summary.total_fees],
      ["Net cash flow", data.summary.net_cash_flow],
    ];
    const gap = 10;
    const cardWidth = (contentWidth - gap) / 2;
    const cardHeight = 52;
    metrics.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 42 + col * (cardWidth + gap);
      const cardY = y + row * (cardHeight + 8);
      doc.setFillColor(247, 250, 247);
      doc.setDrawColor(230, 237, 232);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 6, 6, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text(String(label), x + 12, cardY + 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...ink);
      doc.text(formatAmount(value as string), x + 12, cardY + 39);
    });
    y += cardHeight * 2 + 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(
      `Recorded transactions: ${data.summary.transaction_count}. Currency is not supplied for these summary totals.`,
      42,
      y,
    );
    y += 22;
  } else {
    y = addUnavailable(doc, "Financial summary totals are unavailable.", y);
  }

  y = ensureSpace(doc, y, 50);
  y = drawSectionTitle(doc, "Account balances", y);
  if (data.accounts?.length) {
    y = addTable(
      doc,
      y,
      ["Account", "Type", "Currency", "Balance"],
      data.accounts.map((account) => [
        account.account_name,
        account.account_type,
        account.currency,
        formatAmount(account.balance, account.currency),
      ]),
    );
  } else {
    y = addUnavailable(doc, "No account balance data is available.", y);
  }

  y = ensureSpace(doc, y, 55);
  y = drawSectionTitle(
    doc,
    "Monthly cash flow",
    y,
    "Amounts are shown as returned; the financial summary does not provide a currency code.",
  );
  if (data.cashFlow?.length) {
    y = addTable(
      doc,
      y,
      ["Month", "Income", "Expenses"],
      data.cashFlow.map((period) => [
        period.month,
        period.income === undefined ? "Unavailable" : formatAmount(period.income),
        period.expenses === undefined ? "Unavailable" : formatAmount(period.expenses),
      ]),
    );
  } else {
    y = addUnavailable(doc, "Monthly cash-flow history is unavailable.", y);
  }

  const transactionRows = data.transactions ?? [];
  const categoryTotals = new Map<string, { category: string; type: string; currency: string; count: number; total: number }>();
  for (const transaction of transactionRows) {
    const key = `${transaction.category}\u0000${transaction.transaction_type}\u0000${transaction.currency}`;
    const existing = categoryTotals.get(key);
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount)) continue;
    if (existing) {
      existing.count += 1;
      existing.total += amount;
    } else {
      categoryTotals.set(key, {
        category: transaction.category,
        type: transaction.transaction_type,
        currency: transaction.currency,
        count: 1,
        total: amount,
      });
    }
  }

  if (categoryTotals.size) {
    y = ensureSpace(doc, y, 60);
    y = drawSectionTitle(
      doc,
      "Spending categories",
      y,
      "Based only on the transactions currently loaded in the dashboard.",
    );
    y = addTable(
      doc,
      y,
      ["Category", "Type", "Transactions", "Reported amount total"],
      [...categoryTotals.values()].map((entry) => [
        entry.category,
        entry.type,
        entry.count,
        formatAmount(entry.total, entry.currency),
      ]),
    );
  }

  if (transactionRows.length) {
    y = ensureSpace(doc, y, 60);
    y = drawSectionTitle(
      doc,
      "Recent transactions",
      y,
      `${transactionRows.length} transaction${transactionRows.length === 1 ? "" : "s"} returned for the dashboard.`,
    );
    y = addTable(
      doc,
      y,
      ["Date", "Description", "Category", "Type", "Amount"],
      transactionRows.map((transaction) => [
        formatDate(transaction.transaction_date),
        transaction.description,
        transaction.category,
        transaction.transaction_type,
        formatAmount(transaction.amount, transaction.currency),
      ]),
    );
  }

  if (data.insights?.length) {
    y = ensureSpace(doc, y, 50);
    y = drawSectionTitle(doc, "Saved financial insights", y);
    for (const insight of data.insights) {
      const title = insight.title ?? insight.message ?? "Saved insight";
      const description = insight.description ?? "";
      const lines = doc.splitTextToSize(
        `${title}${description ? ` - ${description}` : ""}`,
        contentWidth,
      ) as string[];
      const entryHeight = lines.length * 12 + 10;
      if (y + entryHeight > pageHeight - 48) {
        doc.addPage();
        y = 52;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...ink);
      doc.text(lines[0], 42, y);
      if (lines.length > 1) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(lines.slice(1), 42, y + 12);
      }
      y += entryHeight;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(
      `Generated from dashboard data - ${dateStamp}`,
      42,
      pageHeight - 24,
    );
    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 42,
      pageHeight - 24,
      { align: "right" },
    );
  }

  return {
    blob: doc.output("blob"),
    filename: `FinSight-AI-Financial-Report-${dateStamp}.pdf`,
  };
}
