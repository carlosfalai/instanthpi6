import React, { useEffect, useState } from "react";

export default function PublicTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch("/api/spruce/conversations");
      const text = await response.text();

      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch {
        jsonData = { rawText: text };
      }

      setData({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: jsonData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "monospace",
        backgroundColor: "#f0f0f0",
        minHeight: "100vh",
        color: "#333",
      }}
    >
      <h1 style={{ color: "red" }}>PUBLIC TEST PAGE - NO AUTH</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={testAPI}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#ff0000",
            color: "white",
            border: "2px solid black",
            cursor: "pointer",
          }}
        >
          TEST API ENDPOINT
        </button>
      </div>

      {loading && <div style={{ fontSize: "24px", color: "blue" }}>LOADING...</div>}

      {error && (
        <div
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "20px",
            fontSize: "18px",
          }}
        >
          ERROR: {error}
        </div>
      )}

      {data && (
        <div>
          <h2>API Response:</h2>
          <pre
            style={{
              backgroundColor: "white",
              padding: "20px",
              border: "2px solid black",
              overflow: "auto",
              maxHeight: "600px",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "yellow",
          border: "2px solid black",
        }}
      >
        <h3>Page Info:</h3>
        <div>Current URL: {window.location.href}</div>
        <div>Time: {new Date().toISOString()}</div>
        <div>User Agent: {navigator.userAgent}</div>
      </div>
    </div>
  );
}
