import React, { useEffect, useState } from "react";

export default function WorkingInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      // Use relative path - works in both dev and production
      const response = await fetch("/api/spruce/conversations/all");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log(`Loaded ${data.length} total conversations`);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    setLoadingMessages(true);

    try {
      console.log("Fetching messages for conversation:", conv.id);

      // Use relative path - works in both dev and production
      const response = await fetch(
        `/api/spruce/conversation/history/${conv.id}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Messages response:", data);

        // The history endpoint returns an array of messages
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      } else {
        console.error("Failed to fetch messages:", response.status);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "white",
        color: "black",
      }}
    >
      {/* Left Panel - Conversations */}
      <div
        style={{
          width: "400px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #ccc",
            backgroundColor: "white",
          }}
        >
          <h2>Conversations ({conversations.length})</h2>
        </div>

        {conversations.map((conv, i) => (
          <div
            key={conv.id || i}
            onClick={() => selectConversation(conv)}
            style={{
              padding: "15px",
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
              backgroundColor: selectedConv?.id === conv.id ? "#e3f2fd" : "white",
              ":hover": { backgroundColor: "#f0f0f0" },
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                selectedConv?.id === conv.id ? "#e3f2fd" : "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                selectedConv?.id === conv.id ? "#e3f2fd" : "white")
            }
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {conv.title || conv.externalParticipants?.[0]?.displayName || "Unknown"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString() : "No messages"}
            </div>
            <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
              {conv.type} • {conv.id}
            </div>
          </div>
        ))}
      </div>

      {/* Right Panel - Messages */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
        }}
      >
        {selectedConv ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #ccc",
                backgroundColor: "#f8f8f8",
              }}
            >
              <h2>
                {selectedConv.title ||
                  selectedConv.externalParticipants?.[0]?.displayName ||
                  "Unknown"}
              </h2>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {selectedConv.type} • {selectedConv.id}
              </div>
              {selectedConv.subtitle && (
                <div style={{ fontSize: "11px", color: "#888" }}>{selectedConv.subtitle}</div>
              )}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
              }}
            >
              {loadingMessages ? (
                <div>Loading messages...</div>
              ) : messages.length > 0 ? (
                messages.map((msg: any, i: number) => (
                  <div
                    key={msg.id || i}
                    style={{
                      marginBottom: "15px",
                      display: "flex",
                      justifyContent: msg.isFromPatient ? "flex-start" : "flex-end",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "60%",
                        padding: "10px 15px",
                        borderRadius: "10px",
                        backgroundColor: msg.isFromPatient ? "#e0e0e0" : "#1976d2",
                        color: msg.isFromPatient ? "black" : "white",
                      }}
                    >
                      <div>{msg.content}</div>
                      <div
                        style={{
                          fontSize: "10px",
                          marginTop: "5px",
                          opacity: 0.7,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#666" }}>No messages yet</div>
              )}
            </div>

            {/* Message Input */}
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #ccc",
                backgroundColor: "#f8f8f8",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Sending messages is not yet implemented");
                }}
                style={{ display: "flex", gap: "10px" }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
            }}
          >
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}
