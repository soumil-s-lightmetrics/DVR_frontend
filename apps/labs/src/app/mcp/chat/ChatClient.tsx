"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, FilePlus2, LogOut, PanelLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./chat.module.css";
import { MCP_CHAT_BACKEND_URL as BACKEND_URL, authHeaders, getAccessToken, login, logout } from "./mcpChatAuth";

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

const TSP_OPTIONS = ["lmpresales", "lmdemotsp", "lmqatesting1", "lmqatesting2", "kynection", "mactrackau"];

// Local-only escape hatch: `next dev` inlines NODE_ENV as "development" (and
// only that), so this can never take effect in a real build/deploy - skips
// the Cognito PKCE login gate so the chat UI is usable without it locally
// (the local backend's own DISABLE_AUTH already ignores the bearer token).
const SKIP_LOGIN = process.env.NODE_ENV === "development";

type FleetSuggestion = { fleetId: string; fleetName: string };

function fleetLabel(item: FleetSuggestion): string {
  return `${item.fleetName} (${item.fleetId})`;
}

export default function ChatClient() {
  // null = still checking sessionStorage for a token.
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clientId, setClientId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [fleetQuery, setFleetQuery] = useState("");
  const [fleetOpen, setFleetOpen] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetSuggestions, setFleetSuggestions] = useState<FleetSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fleetBoxRef = useRef<HTMLDivElement>(null);
  const fleetDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!BACKEND_URL) {
      setInitError("NEXT_PUBLIC_MCP_CHAT_BACKEND_URL is not configured.");
      setAuthed(false);
      return;
    }
    setAuthed(SKIP_LOGIN || !!getAccessToken());
  }, []);

  const startNewConversation = useCallback(async () => {
    if (!BACKEND_URL) return;
    setConversationId(null);
    setMessages([]);
    setToolActivity(null);
    setInitError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/conversations`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data?.id) setConversationId(data.id);
      else setInitError(data?.error ?? "Failed to start a conversation.");
    } catch {
      setInitError("Failed to reach the chat service.");
    }
  }, []);

  useEffect(() => {
    if (!authed || !BACKEND_URL) return;
    startNewConversation();
  }, [authed, startNewConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, toolActivity]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  // Close the fleet suggestion panel on an outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (fleetBoxRef.current && !fleetBoxRef.current.contains(e.target as Node)) {
        setFleetOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!fleetOpen || !clientId || !BACKEND_URL) return;
    if (fleetDebounceRef.current) clearTimeout(fleetDebounceRef.current);
    fleetDebounceRef.current = setTimeout(async () => {
      setFleetLoading(true);
      try {
        const params = new URLSearchParams({ client_id: clientId, q: fleetQuery });
        const res = await fetch(`${BACKEND_URL}/fleets/autocomplete?${params}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setFleetSuggestions(Array.isArray(data?.rows) ? data.rows : []);
      } catch {
        setFleetSuggestions([]);
      } finally {
        setFleetLoading(false);
      }
    }, 300);
    return () => {
      if (fleetDebounceRef.current) clearTimeout(fleetDebounceRef.current);
    };
  }, [fleetQuery, fleetOpen, clientId]);

  function selectFleet(item: FleetSuggestion) {
    setFleetId(item.fleetId);
    setFleetQuery(fleetLabel(item));
    setFleetOpen(false);
    setFleetSuggestions([]);
    startNewConversation();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || busy || !BACKEND_URL || !clientId || !fleetId) return;

    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setBusy(true);

    const assistantId = crypto.randomUUID();
    let accumulated = "";
    let assistantAdded = false;

    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          content: text,
          fleet_id: fleetId.trim() || undefined,
          client_id: clientId.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        logout();
        setAuthed(false);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "error", text: "Session expired — please log in again." },
        ]);
        return;
      }

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

  const needsSelection = !clientId || !fleetId;
  const canSend = !busy && !!conversationId && !!BACKEND_URL && !needsSelection;

  if (authed !== true) {
    return (
      <div className={styles.page}>
        <div className={styles.loginGate}>
          <span className={styles.sidebarTitleText}>
            Ask AI <span className={styles.betaBadge}>BETA</span>
          </span>
          {authed === false && (
            <>
              <p className={styles.loginGateText}>Sign in to start chatting.</p>
              <button className={styles.primaryButton} onClick={login} disabled={!BACKEND_URL}>
                Log in
              </button>
            </>
          )}
        </div>
        {initError && <div className={styles.initError}>{initError}</div>}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitleText}>
            Ask AI <span className={styles.betaBadge}>BETA</span>
          </span>
          <button
            className={styles.iconButton}
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        <button className={styles.navButton} onClick={startNewConversation} disabled={busy}>
          <FilePlus2 size={18} />
          <span>New Chat</span>
        </button>

        <div className={styles.sidebarDivider} />

        <div className={styles.sidebarSectionLabel}>Chat History</div>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.navButton}
            onClick={() => {
              logout();
              setAuthed(false);
              setConversationId(null);
              setMessages([]);
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.selectTsp}>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setFleetId("");
                setFleetQuery("");
                startNewConversation();
              }}
              aria-label="TSP"
            >
              <option value="">TSP</option>
              {TSP_OPTIONS.map((tsp) => (
                <option key={tsp} value={tsp}>
                  {tsp}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>

          <div className={styles.fleetAutocomplete} ref={fleetBoxRef}>
            <input
              type="text"
              value={fleetQuery}
              onChange={(e) => {
                setFleetQuery(e.target.value);
                setFleetId("");
              }}
              onFocus={() => setFleetOpen(true)}
              placeholder={clientId ? "Fleet" : "Select TSP first"}
              aria-label="Fleet"
              disabled={!clientId}
              className={styles.fleetInput}
            />
            <ChevronDown size={16} className={styles.selectChevron} />
            {fleetOpen && clientId && (
              <div className={styles.fleetSuggestions}>
                {fleetLoading && <div className={styles.fleetStatus}>Searching…</div>}
                {!fleetLoading && fleetSuggestions.length === 0 && (
                  <div className={styles.fleetStatus}>No fleets found.</div>
                )}
                {!fleetLoading &&
                  fleetSuggestions.map((item) => (
                    <button
                      key={item.fleetId}
                      type="button"
                      className={styles.fleetSuggestionItem}
                      onClick={() => selectFleet(item)}
                    >
                      <span>{fleetLabel(item)}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </header>

        <div ref={scrollRef} className={styles.scroll}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <Sparkles size={22} />
              </div>
              <h1 className={styles.emptyTitle}>AI Assistant</h1>
              <p className={styles.emptySubtitle}>
                Hello! I&apos;m your AI assistant, here to answer your questions using our
                knowledge base and live data on safety, diagnostics, and coaching.
              </p>
              {needsSelection && (
                <p className={styles.emptySubtitle}>Select a TSP and fleet above to start chatting.</p>
              )}
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
              placeholder={
                needsSelection ? "Select a TSP and fleet to start chatting" : "Ask anything or type @ to filter..."
              }
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
    </div>
  );
}
