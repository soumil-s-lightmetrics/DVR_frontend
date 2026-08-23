"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@lmlabs/ui";
import styles from "./chat.module.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
  usage?: string;
};

type SseEvent =
  | { type: "text_delta"; text: string }
  | { type: "thinking_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_end"; name: string }
  | { type: "done"; usage: Record<string, number> }
  | { type: "error"; message: string };

// Called directly from the browser (not through the Next.js proxy) so a slow
// chat turn can stream past Amplify Hosting's fixed 30s SSR response timeout.
// Auth is a short-lived, conversation-scoped token minted server-side via
// /api/mcp-chat/conversations/[id]/stream-token - see that route and
// mcp-trial/backend/app/stream_token.py.
const BACKEND_URL = process.env.NEXT_PUBLIC_MCP_CHAT_BACKEND_URL;

export default function ChatClient() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!BACKEND_URL) {
      setInitError("NEXT_PUBLIC_MCP_CHAT_BACKEND_URL is not configured.");
      return;
    }
    let cancelled = false;
    fetch("/api/mcp-chat/conversations", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.id) setConversationId(data.id);
        else setInitError(data?.error ?? "Failed to start a conversation.");
      })
      .catch(() => {
        if (!cancelled) setInitError("Failed to reach the chat service.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, toolActivity]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || busy || !BACKEND_URL) return;

    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setBusy(true);

    const assistantId = crypto.randomUUID();
    let accumulated = "";
    let assistantAdded = false;

    try {
      const tokenRes = await fetch(
        `/api/mcp-chat/conversations/${conversationId}/stream-token`,
        { method: "POST" },
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData?.token) {
        throw new Error(tokenData?.error || "Failed to get a stream token.");
      }

      const res = await fetch(`${BACKEND_URL}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mcp-stream-token": tokenData.token,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!res.body) throw new Error("No response body.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const event = JSON.parse(chunk.slice(6)) as SseEvent;

          if (event.type === "text_delta") {
            accumulated += event.text;
            if (!assistantAdded) {
              assistantAdded = true;
              setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", text: accumulated },
              ]);
            } else {
              const snapshot = accumulated;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, text: snapshot } : m)),
              );
            }
          } else if (event.type === "tool_start") {
            setToolActivity(`Using ${event.name}…`);
          } else if (event.type === "tool_end") {
            setToolActivity(null);
          } else if (event.type === "done") {
            const u = event.usage;
            if (u && assistantAdded) {
              const usage =
                `${u.input_tokens} in · ${u.output_tokens} out ` +
                `(${u.thinking_tokens} thinking) · ${u.cache_read_input_tokens} cache read`;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, usage } : m)),
              );
            }
          } else if (event.type === "error") {
            setToolActivity(null);
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "error", text: event.message },
            ]);
          }
        }
      }
    } catch {
      setToolActivity(null);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          text: "Something went wrong reaching the chat service.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const canSend = !busy && !!conversationId && !!BACKEND_URL;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Button href="/mcp" variant="ghost">
          &larr; MCP overview
        </Button>
        <span className={styles.topbarTitle}>Data Chat</span>
      </header>

      <div ref={scrollRef} className={styles.scroll}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <h1 className={styles.emptyTitle}>Ask about your data</h1>
            <p className={styles.emptySubtitle}>
              Query fleets, drivers, and trends in plain English — answers are backed by live
              tool calls, not guesses.
            </p>
          </div>
        ) : (
          <div className={styles.thread}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.turn} ${m.role === "user" ? styles.turnUser : ""}`}
              >
                {m.role === "user" && <div className={styles.bubbleUser}>{m.text}</div>}
                {m.role === "error" && <div className={styles.bubbleError}>{m.text}</div>}
                {m.role === "assistant" && (
                  <>
                    <div className={styles.assistantBody}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                    {m.usage && <div className={styles.usage}>{m.usage}</div>}
                  </>
                )}
              </div>
            ))}
            {toolActivity && (
              <div className={styles.toolActivity}>
                <span className={styles.toolDot} />
                {toolActivity}
              </div>
            )}
          </div>
        )}
      </div>

      {initError && <div className={styles.initError}>{initError}</div>}

      <div className={styles.composerWrap}>
        <div className={styles.composer}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!canSend}
            placeholder="Ask about your data…"
            className={styles.textarea}
          />
          <button
            onClick={handleSend}
            disabled={!canSend || !input.trim()}
            aria-label="Send message"
            className={styles.sendButton}
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
