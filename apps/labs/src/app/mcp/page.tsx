import { Fragment } from "react";
import { Reveal, Button } from "@lmlabs/ui";
import { Settings, PlugZap, Server, Tag, Link2, KeyRound, CheckCircle2, ArrowRight } from "lucide-react";
import { SiteFooter } from "../(site)/SiteFooter";
import styles from "./mcp.module.css";

const VALUE_PROPS = [
  {
    title: "Unified Access",
    body: "One place for every answer. LightMetrics connects the AI directly to your internal APIs and databases (SQL, NoSQL, flat files), so you're not stitching together reports from five different tools.",
  },
  {
    title: "Natural Language Exploration",
    body: 'Just ask. Fleet managers can pose complex questions—like "Compare fuel economy between top-performing drivers and their harsh braking events"—in plain English, no code or SQL required.',
  },
  {
    title: "Secure by Design",
    body: "You stay in control. Only the tools your team explicitly chooses to expose are available to the AI, so access, execution, and authentication never leave your hands.",
  },
  {
    title: "Accelerated Insights",
    body: "New reports in days, not project cycles. TSPs no longer wait on custom API development—just connect a data source and start asking questions.",
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
        Makes your data available on request. It defines a clear set of actions—like pulling fleet stats (
        <span className={styles.code}>getFleetAggregate</span>) or creating a driver report (
        <span className={styles.code}>createDVR</span>)—that the AI is allowed to use.
      </>
    ),
  },
  {
    title: "Executes Calls",
    body: "Does the work behind the scenes. When the AI needs an answer, the server runs the right query and sends the results back.",
  },
  {
    title: "Translates Responses",
    body: "Speaks your language. The AI turns that raw data into a plain-English answer you can act on, no dashboards required.",
  },
];

const CONFIG_STEPS = [
  {
    title: "Navigate to Settings",
    body: "In the Claude interface, locate the Custom Connectors or MCP Tools section within your account or workspace settings.",
    Icon: Settings,
  },
  {
    title: "Add New Connector",
    body: "Select the option to add a Remote MCP Server.",
    Icon: PlugZap,
  },
  {
    title: "Enter Server Details",
    Icon: Server,
    details: [
      { label: "Label", text: 'Provide a name (e.g., "LightMetrics Fleet API").', Icon: Tag },
      { label: "URL", text: "Enter the endpoint for your hosted MCP server.", Icon: Link2 },
      { label: "Authorization", text: "Select your authentication type (e.g., Header-based) and input your credentials.", Icon: KeyRound },
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
    Icon: CheckCircle2,
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
          <div className={styles.flow}>
            {CONFIG_STEPS.map((s, i) => (
              <Fragment key={s.title}>
                <div className={styles.flowCard}>
                  <div className={styles.flowIcon}>
                    <s.Icon size={20} />
                  </div>
                  <p className={styles.flowStepNum}>Step {i + 1}</p>
                  <p className={styles.flowTitle}>{s.title}</p>
                  {s.body && <p className={styles.flowBody}>{s.body}</p>}
                  {s.details && (
                    <ul className={styles.flowDetails}>
                      {s.details.map((d) => (
                        <li key={d.label}>
                          <d.Icon size={14} />
                          <span>
                            <strong>{d.label}:</strong> {d.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {i < CONFIG_STEPS.length - 1 && (
                  <div className={styles.flowArrow}>
                    <ArrowRight size={20} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <p className={styles.usageNote}>
            <strong>Usage:</strong> Once connected, you can invoke these tools in any chat session. Claude will
            automatically determine when to call a LightMetrics tool based on your natural language prompt.
          </p>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
