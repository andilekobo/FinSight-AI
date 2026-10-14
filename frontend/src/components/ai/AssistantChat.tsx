import { useState, type FormEvent } from "react";
import {
  ArrowUp,
  Bot,
  ChartNoAxesCombined,
  CircleHelp,
  Lightbulb,
  Plus,
  Sparkles,
} from "lucide-react";
import { getCurrentUserId, postAIChat } from "../../data/api";
import type { ChatMessage } from "../../types";

const suggestions = [
  { icon: ChartNoAxesCombined, text: "How much have we spent this month?" },
  { icon: Lightbulb, text: "What is driving our technology costs?" },
  { icon: CircleHelp, text: "What transactions are recorded in my account?" },
  { icon: Sparkles, text: "Summarise my financial activity." },
  { icon: CircleHelp, text: "What unusual spending can you identify?" },
  { icon: ChartNoAxesCombined, text: "Explain my cash flow." },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    if (!getCurrentUserId()) {
      setError("Please sign in again before using the AI assistant.");
      return;
    }

    const now = () =>
      new Date().toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const question: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: prompt,
      time: now(),
    };

    setMessages((current) => [...current, question]);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const result = await postAIChat(prompt);
      const reply: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.answer,
        time: now(),
      };
      setMessages((current) => [...current, reply]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not get a response from FinSight AI.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <section className="chat-layout">
      <aside className="chat-context-panel">
        <div className="chat-context-heading">
          <div className="assistant-brand-icon"><Bot size={19} /></div>
          <div>
            <strong>Your financial copilot</strong>
            <span>Connected to your financial records</span>
          </div>
        </div>
        <div className="context-divider" />
        <span className="context-label">YOUR WORKSPACE</span>
        <div className="context-item">
          <span>Financial data</span>
          <strong>Database-backed</strong>
        </div>
        <div className="context-item">
          <span>AI provider</span>
          <strong>Gemini</strong>
        </div>
        <div className="context-divider" />
        <div className="context-safety">
          <Sparkles size={15} />
          <span>
            Answers use available financial records. Questions and relevant
            transaction data are sent to the configured AI provider.
          </span>
        </div>
      </aside>

      <div className="chat-main">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon"><Bot size={25} /></div>
            <span className="chat-welcome-kicker">FINSIGHT AI ASSISTANT</span>
            <h2>Your numbers tell a story.<br /><span>Let’s find it together.</span></h2>
            <p>
              Ask about your recorded transactions, spending, or cash flow.
              If records are missing, FinSight will tell you.
            </p>
            <div className="suggestions-grid">
              {suggestions.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  className="suggestion-chip"
                  onClick={() => void sendMessage(text)}
                  disabled={loading}
                >
                  <Icon size={15} />
                  <span>{text}</span>
                  <ArrowUp size={13} className="suggestion-arrow" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                className={`chat-message message-${message.role}`}
                key={message.id}
              >
                {message.role === "assistant" && (
                  <div className="message-avatar"><Bot size={16} /></div>
                )}
                <div className="message-body">
                  <div className="message-meta">
                    {message.role === "assistant" ? "FinSight AI" : "You"}
                    <span>{message.time}</span>
                  </div>
                  <div className="message-bubble">{message.content}</div>
                </div>
                {message.role === "user" && (
                  <div className="message-user-avatar">You</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-message message-assistant">
                <div className="message-avatar"><Bot size={16} /></div>
                <div className="message-body">
                  <div className="message-meta">FinSight AI</div>
                  <div className="message-bubble">Checking your financial records…</div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="empty-state" role="alert">{error}</div>}

        <div className="chat-input-area">
          <form className="chat-input-box" onSubmit={handleSubmit}>
            <button
              type="button"
              className="chat-add-button"
              aria-label="Attachments are not available yet"
              disabled
            >
              <Plus size={17} />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your financial records..."
              aria-label="Message FinSight AI"
              maxLength={2000}
              disabled={loading}
            />
            <span className="chat-input-hint">AI can make mistakes</span>
            <button
              type="submit"
              className="chat-send-button"
              aria-label="Send message"
              disabled={!draft.trim() || loading}
            >
              <ArrowUp size={17} />
            </button>
          </form>
          <div className="chat-disclaimer">
            <Sparkles size={12} />
            Powered by Gemini · Responses depend on available records
          </div>
        </div>
      </div>
    </section>
  );
}
