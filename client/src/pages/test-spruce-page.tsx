import React, { useEffect, useState } from "react";

export default function TestSprucePage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/spruce/conversations");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched conversations:", data);
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "white",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "black", marginBottom: "20px" }}>Test Spruce Conversations</h1>

      {loading && <div style={{ color: "blue" }}>Loading conversations...</div>}

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffeeee",
            border: "1px solid red",
            marginBottom: "20px",
          }}
        >
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 style={{ color: "black", marginBottom: "10px" }}>
            Found {conversations.length} conversations
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={fetchConversations}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {conversations.length === 0 ? (
            <p style={{ color: "gray" }}>No conversations found</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "10px",
                maxWidth: "800px",
              }}
            >
              {conversations.slice(0, 20).map((conv, index) => (
                <div
                  key={conv.id || index}
                  style={{
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h3
                    style={{
                      color: "#333",
                      margin: "0 0 10px 0",
                      fontSize: "16px",
                    }}
                  >
                    {conv.patientName || conv.displayName || "Unknown Patient"}
                  </h3>

                  <div style={{ color: "#666", fontSize: "14px" }}>
                    <div>ID: {conv.id}</div>
                    {conv.lastMessage && <div>Last Message: {conv.lastMessage}</div>}
                    {conv.lastMessageTime && (
                      <div>Time: {new Date(conv.lastMessageTime).toLocaleString()}</div>
                    )}
                    {conv.unreadCount !== undefined && <div>Unread: {conv.unreadCount}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f0f0f0",
          borderRadius: "5px",
        }}
      >
        <h3 style={{ color: "black" }}>Debug Info</h3>
        <pre
          style={{
            backgroundColor: "white",
            padding: "10px",
            overflow: "auto",
            fontSize: "12px",
          }}
        >
          {JSON.stringify(
            {
              conversationCount: conversations.length,
              firstConversation: conversations[0],
              loading,
              error,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
