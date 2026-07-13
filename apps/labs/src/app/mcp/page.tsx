import { Reveal, Button } from "@lmlabs/ui";
import { SiteFooter } from "../(site)/SiteFooter";
import styles from "./mcp.module.css";

const VALUE_PROPS = [
  {
    title: "Unified Access",
    body: "Eliminates silos by connecting LLMs directly to internal REST/GraphQL APIs and external databases (SQL, NoSQL, Flat Files).",
  },
  {
    title: "Natural Language Exploration",
    body: 'Fleet managers can ask complex questions—like "Compare fuel economy between top-performing drivers and their harsh braking events"—without writing code or SQL.',
  },
  {
    title: "Secure by Design",
    body: "Only explicitly defined tools are exposed. The host application maintains full control over access, execution, and authentication.",
  },
  {
    title: "Accelerated Insights",
    body: "TSPs no longer need to wait for custom API development for new reports; they can simply connect a data source and let the AI map the relationships.",
  },
];

const USE_CASES = [
  { category: "Fleet Operations", example: "“Show all my pilot fleets expiring in the next 10 days.”" },
  { category: "Trend Analysis", example: "“Give me a Month-over-Month Trend Analysis Summary for April & May.”" },
  { category: "Driver Coaching", example: "“Identify top drivers based on their events per 100 miles.”" },
  { category: "Cross-Data Joins", example: "Correlate telematics events with external maintenance logs or payroll data." },
];

const ARCHITECTURE_STEPS = [
  {
    title: "Exposes Tools",
    body: (
      <>
        Registers functions like <span className={styles.code}>getFleetAggregate</span> or{" "}
        <span className={styles.code}>createDVR</span> via an OpenAPI-like schema.
      </>
    ),
  },
  {
    title: "Executes Calls",
    body: "Listens for requests from the LLM, executes the relevant API or database query, and returns structured JSON.",
  },
  {
    title: "Translates Responses",
    body: "The LLM interprets the JSON and provides a natural language response to the user.",
  },
];

const CONFIG_STEPS = [
  {
    title: "Navigate to Settings",
    body: "In the Claude interface, locate the Custom Connectors or MCP Tools section within your account or workspace settings.",
  },
  {
    title: "Add New Connector",
    body: "Select the option to add a Remote MCP Server.",
  },
  {
    title: "Enter Server Details",
    details: [
      { label: "Label", text: 'Provide a name (e.g., "LightMetrics Fleet API").' },
      { label: "URL", text: "Enter the endpoint for your hosted MCP server." },
      { label: "Authorization", text: "Select your authentication type (e.g., Header-based) and input your credentials." },
    ],
  },
  {
    title: "Verify Connection",
    body: (
      <>
        Claude will attempt a handshake to retrieve the list of available tools (e.g.,{" "}
        <span className={styles.code}>list_fleets</span>, <span className={styles.code}>get_driver_events</span>).
      </>
    ),
  },
];

export default function McpPage() {
  return (
    <div className={`${styles.page} gl-cat-create`}>
      <header className={styles.header}>
        <a href="/" className={styles.logo}>
          LM Labs
        </a>
        <Button href="/" variant="ghost">
          &larr; Back to experiments
        </Button>
      </header>

      <div className={styles.hero}>
        <Reveal>
          <span className={styles.eyebrow}>MCP</span>
          <h1 className={styles.title}>Bridging Telematics with Intelligence: MCP &amp; LightMetrics</h1>
          <p className={styles.lead}>
            The Model Context Protocol (MCP) acts as a &ldquo;USB-C for AI,&rdquo; providing a universal, open
            standard to connect Large Language Models (LLMs) like Claude to internal LightMetrics data and tools.
            This integration transforms the LightMetrics platform into a central intelligence hub, allowing users
            to move beyond static dashboards to dynamic, conversational data exploration.
          </p>
        </Reveal>
      </div>

      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>The Value Proposition</h2>
          <div className={styles.valueGrid}>
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <h3 className={styles.valueCardTitle}>{v.title}</h3>
                <p className={styles.valueCardBody}>{v.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Real-World Use Cases</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Example Query / Action</th>
                </tr>
              </thead>
              <tbody>
                {USE_CASES.map((u) => (
                  <tr key={u.category}>
                    <td>{u.category}</td>
                    <td>{u.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Technical Architecture</h2>
          <p className={styles.paragraph}>
            The MCP server follows a client-server model where a host application (e.g., Claude) connects to an
            MCP server. This server:
          </p>
          <ol className={styles.steps} style={{ marginTop: "var(--gl-space-xl)" }}>
            {ARCHITECTURE_STEPS.map((s) => (
              <li key={s.title} className={styles.step}>
                <p className={styles.stepTitle}>{s.title}</p>
                <p className={styles.stepBody}>{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className={styles.section}>
        <Reveal>
          <h2 className={styles.sectionTitle}>Adding Remote MCP Connectors in Claude</h2>
          <p className={styles.paragraph}>
            To integrate your LightMetrics MCP server with Claude, follow these steps for remote setup:
          </p>

          <h3 className={styles.subsectionTitle}>Configuration Steps</h3>
          <ol className={styles.steps}>
            {CONFIG_STEPS.map((s) => (
              <li key={s.title} className={styles.step}>
                <p className={styles.stepTitle}>{s.title}</p>
                {s.body && <p className={styles.stepBody}>{s.body}</p>}
                {s.details && (
                  <ul className={styles.subList}>
                    {s.details.map((d) => (
                      <li key={d.label}>
                        <strong>{d.label}:</strong> {d.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          <h3 className={styles.subsectionTitle}>Usage</h3>
          <p className={styles.paragraph}>
            Once connected, you can invoke these tools in any chat session. Claude will automatically determine
            when to call a LightMetrics tool based on your natural language prompt.
          </p>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
