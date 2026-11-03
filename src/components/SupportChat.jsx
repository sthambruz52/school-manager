import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Send, MessageCircle } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";

const clock = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "";
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function SupportChat({ isAdmin, userName, userRole }) {
  const [threads, setThreads] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const myUid = auth.currentUser?.uid;
  const activeThreadId = isAdmin ? selectedUserId : myUid;
  const activeThread = threads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "supportChats"), orderBy("lastMessageAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return; }
    const q = query(collection(db, "supportChats", activeThreadId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    const flag = isAdmin ? { unreadByAdmin: false } : { unreadByUser: false };
    setDoc(doc(db, "supportChats", activeThreadId), flag, { merge: true }).catch(() => {});
  }, [activeThreadId, isAdmin, messages.length]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, activeThreadId]);

  const sendMessage = async () => {
    const body = text.trim();
    if (!body || !activeThreadId || sending) return;
    setSending(true);
    try {
      await setDoc(
        doc(db, "supportChats", activeThreadId),
        {
          userName: isAdmin ? activeThread?.userName || "" : userName,
          userRole: isAdmin ? activeThread?.userRole || "" : userRole,
          lastMessage: body,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: !isAdmin,
          unreadByUser: isAdmin
        },
        { merge: true }
      );
      await addDoc(collection(db, "supportChats", activeThreadId, "messages"), {
        senderId: myUid,
        senderName: isAdmin ? "Admin" : userName,
        senderRole: isAdmin ? "Admin" : userRole,
        text: body,
        createdAt: serverTimestamp()
      });
      setText("");
    } catch (err) {
      alert("Could not send the message. Check your connection and try again.");
    }
    setSending(false);
  };

  if (isAdmin && !selectedUserId) {
    return (
      <div style={{ marginTop: "10px" }}>
        <Header title="Support Chat" subtitle={`${threads.length} conversation${threads.length !== 1 ? "s" : ""}`} />
        {threads.length === 0 ? (
          <EmptyState icon={MessageCircle} text="No conversations yet." />
        ) : (
          <div style={{ marginTop: "14px" }}>
            {threads.map((t) => (
              <Card key={t.id} onClick={() => setSelectedUserId(t.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar name={t.userName || "?"} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", color: theme.colors.text }}>{t.userName || "Unknown"}</span>
                      {t.userRole && <StatusPill label={t.userRole} variant="info" />}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.colors.textMuted,
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {t.lastMessage}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", color: theme.colors.textMuted }}>{clock(t.lastMessageAt)}</div>
                    {t.unreadByAdmin && (
                      <span
                        style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: theme.colors.primary, marginTop: "6px" }}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title={isAdmin ? activeThread?.userName || "Conversation" : "Support Chat"}
        subtitle={isAdmin ? activeThread?.userRole || "" : "Message the school admin office"}
        onBack={isAdmin ? () => setSelectedUserId(null) : undefined}
      />

      <div
        ref={listRef}
        style={{
          margin: "14px 0 10px",
          minHeight: "260px",
          maxHeight: "calc(100vh - 380px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "4px"
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: theme.colors.textMuted, margin: "auto", fontSize: "14px" }}>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myUid;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: mine ? theme.colors.primary : "white",
                    color: mine ? "white" : theme.colors.text,
                    boxShadow: mine ? "none" : theme.shadow,
                    borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
                  }}
                >
                  {m.text}
                </div>
                <div style={{ fontSize: "11px", color: theme.colors.textMuted, margin: "3px 4px 0" }}>
                  {!mine && m.senderName ? `${m.senderName} • ` : ""}
                  {clock(m.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ ...field, flex: 1, padding: "14px" }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          aria-label="Send"
          style={{
            width: "52px",
            border: "none",
            borderRadius: theme.radius.sm,
            background: theme.colors.primary,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}