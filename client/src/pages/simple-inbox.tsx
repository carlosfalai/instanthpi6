import React, { useEffect, useState } from "react";

export default function SimpleInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/spruce/conversations");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        minHeight: "100vh",
        color: "black",
      }}
    >
      <h1>Simple Inbox - {conversations.length} Conversations</h1>

      <div style={{ marginTop: "20px" }}>
        {conversations.map((conv, i) => (
          <div
            key={conv.id || i}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3>{conv.patientName || "Unknown"}</h3>
            <p>ID: {conv.id}</p>
            <p>Last: {conv.lastMessage}</p>
            <p>Time: {new Date(conv.lastMessageTime).toLocaleString()}</p>
            {conv.unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: "red",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {conv.unreadCount} unread
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
