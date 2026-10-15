import { FormEvent, useState } from "react";
import { ArrowUp, Bot, ChartNoAxesCombined, CircleHelp, Lightbulb, Plus, Sparkles } from "lucide-react";
import { postAIChat } from "../../data/mockApi";
import type { ChatMessage } from "../../types";

const suggestions = [
  { icon: ChartNoAxesCombined, text: "How much have we spent this month?" },
  { icon: Lightbulb, text: "What is driving our API costs?" },
  { icon: CircleHelp, text: "What will our bill look like at the end of the month?" },
  { icon: Sparkles, text: "How much of our quota have we used?" },
  { icon: CircleHelp, text: "What unusual spending have you detected?" },
  { icon: ChartNoAxesCombined, text: "How does technology spending affect our cash flow?" },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  function sendMessage(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const reply: ChatMessage = { id: `${Date.now()}-assistant`, role: "assistant", content: postAIChat(prompt), time: now };
    const question: ChatMessage = { id: `${Date.now()}-user`, role: "user", content: prompt, time: now };
    setMessages((current) => [...current, question, reply]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  return (
    <section className="chat-layout">
      <div className="chat-context-panel">
        <div className="chat-context-heading"><div className="assistant-brand-icon"><Bot size={19} /></div><div><strong>Your financial copilot</strong><span>Context-aware intelligence</span></div></div>
        <div className="context-divider" />
        <span className="context-label">YOUR WORKSPACE</span>
        <div className="context-item"><span>Current billing</span><strong>$1,248.64</strong></div>
        <div className="context-item"><span>Monthly quota used</span><strong>41.2%</strong></div>
        <div className="context-item"><span>Net cash flow</span><strong className="green-text">+$16,135.50</strong></div>
        <div className="context-divider" />
        <div className="context-safety"><Sparkles size={15} /><span>Mock AI responses. No financial data is sent externally.</span></div>
      </div>
      <div className="chat-main">
        {messages.length === 0 ? <div className="chat-welcome">
          <div className="chat-welcome-icon"><Bot size={25} /></div><span className="chat-welcome-kicker">FINSIGHT AI ASSISTANT</span><h2>Your numbers tell a story.<br /><span>Let’s find it together.</span></h2><p>Ask about your spending, usage, or cash flow. I’ll help you make sense of it.</p>
          <div className="suggestions-grid">{suggestions.map(({ icon: Icon, text }) => <button key={text} className="suggestion-chip" onClick={() => sendMessage(text)}><Icon size={15} /><span>{text}</span><ArrowUp size={13} className="suggestion-arrow" /></button>)}</div>
        </div> : <div className="chat-messages">
          {messages.map((message) => <div className={`chat-message message-${message.role}`} key={message.id}>
            {message.role === "assistant" && <div className="message-avatar"><Bot size={16} /></div>}
            <div className="message-body"><div className="message-meta">{message.role === "assistant" ? "FinSight AI" : "You"} <span>{message.time}</span></div><div className="message-bubble">{message.content}</div></div>
            {message.role === "user" && <div className="message-user-avatar">JD</div>}
          </div>)}
        </div>}
        <div className="chat-input-area"><form className="chat-input-box" onSubmit={handleSubmit}><button type="button" className="chat-add-button" aria-label="Add attachment"><Plus size={17} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask anything about your business..." aria-label="Message FinSight AI" /><span className="chat-input-hint">AI can make mistakes</span><button type="submit" className="chat-send-button" aria-label="Send message" disabled={!draft.trim()}><ArrowUp size={17} /></button></form><div className="chat-disclaimer"><Sparkles size={12} /> Powered by mock responses · Your data stays in this prototype</div></div>
      </div>
    </section>
  );
}
