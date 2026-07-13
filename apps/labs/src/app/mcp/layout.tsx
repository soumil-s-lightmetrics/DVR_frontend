import type { Metadata } from "next";
import "@lmlabs/ui/styles/tokens.css";

export const metadata: Metadata = {
  title: "MCP & LightMetrics — LM Labs",
  description: "Bridging telematics with intelligence: connect Claude and other LLMs directly to LightMetrics data via the Model Context Protocol.",
};

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
