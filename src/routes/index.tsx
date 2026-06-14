import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: () => {
    const [val, setVal] = useState("");
    return (
      <div style={{ padding: 40, background: "black", minHeight: "100vh" }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="test input"
          style={{ color: "white", background: "#333", padding: 8, fontSize: 16 }}
        />
        <p style={{ color: "white" }}>{val}</p>
      </div>
    );
  },
});
