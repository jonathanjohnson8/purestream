"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage } from "@/lib/orderActions";

interface Msg {
  id: string;
  sender_user_id: string | null;
  body: string | null;
  created_at: string;
}

export function ChatPanel({
  orderId,
  threadId,
  meId,
  initial,
}: {
  orderId: string;
  threadId: string | null;
  meId: string;
  initial: Msg[];
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        (payload: any) => {
          setMsgs((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    // optimistic
    setMsgs((p) => [...p, { id: `tmp-${Date.now()}`, sender_user_id: meId, body, created_at: new Date().toISOString() }]);
    await sendChatMessage(orderId, body);
  }

  return (
    <div className="card flex flex-col h-72">
      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-ink-900 text-sm">
        Chat with your shopper
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && (
          <p className="text-center text-xs text-ink-400 py-8">No messages yet. Say hi!</p>
        )}
        {msgs.map((m) => {
          const mine = m.sender_user_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <span
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-brand-600 text-white rounded-br-sm" : "bg-gray-100 text-ink-900 rounded-bl-sm"
                }`}
              >
                {m.body}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="p-2 border-t border-gray-100 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input !py-2 flex-1"
          placeholder="Message…"
        />
        <button type="submit" className="btn-primary !px-4 !py-2">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
