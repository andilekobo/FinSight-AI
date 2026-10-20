import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  Bot,
  ChartNoAxesCombined,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getCurrentUserId, postAIChat } from "../../data/api";
import type { ChatMessage } from "../../types";

const suggestions = [
  { icon: ChartNoAxesCombined, text: "Analyse my financial overview." },
  { icon: ChartNoAxesCombined, text: "Where does most of my money go?" },
  { icon: Lightbulb, text: "Help me create a savings plan." },
  { icon: Sparkles, text: "Identify my largest expenses." },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const scrollAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function requestAnswer(prompt: string) {
    try {
      const result = await postAIChat(prompt);
      const reply: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.answer,
        time: new Date().toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((current) => [...current, reply]);
      setFailedPrompt(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not get a response from FinSight AI.",
      );
      setFailedPrompt(prompt);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    if (!getCurrentUserId()) {
      setError("Please sign in again before using the AI assistant.");
      setFailedPrompt(null);
      return;
    }

    const question: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: prompt,
      time: new Date().toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((current) => [...current, question]);
    setDraft("");
    setError("");
    setFailedPrompt(null);
    setLoading(true);
    await requestAnswer(prompt);
  }

  async function retryLastMessage() {
    if (!failedPrompt || loading) return;

    if (!getCurrentUserId()) {
      setError("Please sign in again before using the AI assistant.");
      setFailedPrompt(null);
      return;
    }

    setError("");
    setLoading(true);
    await requestAnswer(failedPrompt);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  return (
    <section className="chat-layout">
      <aside className="chat-context-panel">
        <div className="chat-context-heading">
          <div className="assistant-brand-icon"><Bot size={19} /></div>
          <div>
            <strong>Your financial copilot</strong>
            <span>Ask about your finances</span>
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
            <div className="chat-welcome-icon"><Sparkles size={24} /></div>
            <span className="chat-welcome-kicker">FINSIGHT AI ASSISTANT</span>
            <h2>Your finances, in focus.<br /><span>Let’s make sense of them.</span></h2>
            <p>
              Your personal AI partner for understanding spending, planning
              savings, and finding clarity in your financial records.
            </p>
            <div className="suggestions-grid">
              {suggestions.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  className="suggestion-chip"
                  onClick={() => void sendMessage(text)}
                  type="button"
                >
                  <Icon size={15} />
                  <span>{text}</span>
                  <ArrowUp size={13} className="suggestion-arrow" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages" role="log" aria-label="Conversation with FinSight AI" aria-live="polite">
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
                  <div className="message-bubble">
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          table: ({ children }) => (
                            <div className="markdown-table-wrap">
                              <table>{children}</table>
                            </div>
                          ),
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
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
                  <div className="message-bubble message-thinking" role="status" aria-label="FinSight AI is thinking">
                    <span>FinSight AI is thinking</span>
                    <span className="thinking-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollAnchor} />
          </div>
        )}

        {error && (
          <div className="chat-error" role="alert">
            <span>{error}</span>
            {failedPrompt && (
              <button
                type="button"
                className="chat-retry-button"
                onClick={() => void retryLastMessage()}
                disabled={loading}
              >
                <RotateCcw size={14} />
                Retry
              </button>
            )}
          </div>
        )}

        <div className="chat-input-area">
          <form
            className={`chat-input-box${draft.length > 0 ? " chat-input-typed" : ""}`}
            onSubmit={handleSubmit}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Message FinSight AI..."
              aria-label="Message FinSight AI"
              maxLength={2000}
              disabled={loading}
              rows={1}
            />
            <button
              type="submit"
              className="chat-send-button"
              aria-label="Send message"
              disabled={!draft.trim() || loading}
            >
              <ArrowUp size={17} />
            </button>
          </form>
          <div className="chat-input-hint">Press Enter to send · Shift+Enter for a new line</div>
          <div className="chat-disclaimer">
            <Sparkles size={12} />
            AI can make mistakes. Check important financial information.
          </div>
        </div>
      </div>
    </section>
  );
}
