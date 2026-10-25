import { useState } from "react";
import {
  ArrowRight,
  Bot,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  LockKeyhole,
  MessageCircle,
  Phone,
  WalletCards,
} from "lucide-react";
import { PageHeading } from "../components/ui/Primitives";

const faqItems = [
  {
    id: "faq-getting-started",
    question: "What is FinSight AI?",
    answer:
      "FinSight AI brings your available account, transaction, usage, and spending information together so you can review it in one place.",
  },
  {
    id: "faq-accounts",
    question: "How do I view my accounts and transactions?",
    answer:
      "Open Financial to review account balances and financial totals, or Transactions to browse transaction records returned for your account.",
  },
  {
    id: "faq-missing-transactions",
    question: "Why might some transactions be missing?",
    answer:
      "The page can only show transactions currently returned by the service. Data may not yet have been synchronized or imported, or the selected filters may exclude it. Check the available filters and sync status, then contact support if you still need help.",
  },
  {
    id: "faq-spending",
    question: "How does FinSight analyze my spending?",
    answer:
      "Financial summaries group recorded amounts by currency and transaction type. The Insights page also displays the spending comparison returned by the service. The data available can depend on your recorded transactions.",
  },
  {
    id: "faq-copilot",
    question: "What can AI Copilot help me with?",
    answer:
      "AI Copilot can respond to questions about financial information available to it in FinSight AI. Its responses depend on the data provided and may not cover every account or transaction.",
  },
  {
    id: "faq-advice",
    question: "Is AI Copilot professional financial advice?",
    answer:
      "No. AI Copilot provides informational responses, not professional financial, tax, or investment advice. Consider consulting a qualified professional for advice about your circumstances.",
  },
  {
    id: "faq-contact",
    question: "How can I contact support?",
    answer:
      "Call or message our support team on 078 667 7565 using the contact options below.",
  },
];

const quickHelpItems = [
  {
    title: "Getting Started",
    description:
      "Learn how to navigate your dashboard and understand your financial overview.",
    icon: BookOpen,
    faqId: "faq-getting-started",
  },
  {
    title: "Accounts & Transactions",
    description:
      "Learn how synchronized accounts and transaction history work.",
    icon: WalletCards,
    faqId: "faq-accounts",
  },
  {
    title: "Financial Insights",
    description:
      "Understand spending patterns, cash flow, and financial analytics.",
    icon: ChartNoAxesCombined,
    faqId: "faq-spending",
  },
  {
    title: "AI Copilot",
    description:
      "Learn how to ask questions about your available financial data.",
    icon: Bot,
    faqId: "faq-copilot",
  },
];

export function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  function openHelpTopic(faqId: string) {
    setOpenFaq(faqId);
    window.requestAnimationFrame(() => {
      const item = document.getElementById(faqId);
      item?.scrollIntoView({ behavior: "smooth", block: "center" });
      item?.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="help-page">
      <div className="help-heading">
        <PageHeading
          eyebrow="SUPPORT CENTRE"
          title="Help & Support"
          description="Everything you need to understand and get the most out of FinSight AI."
        />
        <div className="help-heading-icon" aria-hidden="true">
          <CircleHelp size={25} strokeWidth={1.7} />
        </div>
      </div>

      <section className="help-section" aria-labelledby="quick-help-heading">
        <div className="help-section-heading">
          <div>
            <span className="help-eyebrow">EXPLORE FIN SIGHT</span>
            <h2 id="quick-help-heading">Quick Help</h2>
            <p>Choose a topic to jump to a helpful answer.</p>
          </div>
          <BookOpen className="help-section-mark" size={19} aria-hidden="true" />
        </div>
        <div className="help-quick-grid">
          {quickHelpItems.map(({ title, description, icon: Icon, faqId }) => (
            <button
              className="help-topic-card"
              key={title}
              type="button"
              onClick={() => openHelpTopic(faqId)}
            >
              <span className="help-topic-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span className="help-topic-copy">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <ArrowRight className="help-topic-arrow" size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="help-section help-faq-section" aria-labelledby="faq-heading">
        <div className="help-section-heading">
          <div>
            <span className="help-eyebrow">ANSWERS AT A GLANCE</span>
            <h2 id="faq-heading">Frequently Asked Questions</h2>
            <p>Find answers to common questions about using FinSight AI.</p>
          </div>
          <MessageCircle className="help-section-mark" size={19} aria-hidden="true" />
        </div>
        <div className="help-faq-list">
          {faqItems.map(({ id, question, answer }, index) => {
            const isOpen = openFaq === id;
            const answerId = `${id}-answer`;
            return (
              <article className={`help-faq-item${isOpen ? " help-faq-item-open" : ""}`} id={id} key={id}>
                <h3>
                  <button
                    className="help-faq-trigger"
                    id={`${id}-question`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? null : id)}
                  >
                    <span className="help-faq-number">{String(index + 1).padStart(2, "0")}</span>
                    <span>{question}</span>
                    <ChevronDown className="help-faq-chevron" size={17} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  className="help-faq-answer"
                  id={answerId}
                  role="region"
                  aria-labelledby={`${id}-question`}
                  hidden={!isOpen}
                >
                  <p>{answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="help-contact-card" aria-labelledby="help-contact-heading">
        <div className="help-contact-icon" aria-hidden="true"><MessageCircle size={21} /></div>
        <div className="help-contact-copy">
          <span className="help-eyebrow">PERSONAL SUPPORT</span>
          <h2 id="help-contact-heading">Still need help?</h2>
          <p>Our team is here to help. Contact us by phone or WhatsApp for assistance.</p>
          <div className="help-contact-number">
            <Phone size={15} aria-hidden="true" />
            <span>Phone / WhatsApp:</span>
            <strong>078 667 7565</strong>
          </div>
        </div>
        <div className="help-contact-actions">
          <a className="button button-secondary" href="tel:+27786677565">
            <Phone size={15} aria-hidden="true" /> Call Us
          </a>
          <a
            className="button button-primary"
            href="https://wa.me/27786677565"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={15} aria-hidden="true" /> Chat on WhatsApp
          </a>
        </div>
      </section>

      <aside className="help-privacy" aria-labelledby="help-privacy-heading">
        <span className="help-privacy-icon" aria-hidden="true"><LockKeyhole size={17} /></span>
        <div>
          <h2 id="help-privacy-heading">Your financial information matters</h2>
          <p>
            FinSight AI helps you understand your financial activity. Avoid sharing
            passwords, PINs, authentication codes, or sensitive banking credentials
            when requesting support.
          </p>
        </div>
      </aside>
    </div>
  );
}
