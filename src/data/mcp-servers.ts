import { HIRE_SERVER, HIRE_TOOLS } from '../lib/hire-tools';
import { MCP_SERVER, MCP_TOOLS } from '../lib/portfolio-tools';

/**
 * The home page's "04 MCP Servers" console: one tab per server, HIRE first, each a fixed sample transcript.
 * Build time only (the tool modules import zod); McpServers.astro passes the cards to the McpConsole island as props.
 * The HIRE transcript is fixed by the spec. The portfolio result line is the real `search_portfolio {"query":"MCP"}`
 * answer, summarised: re-run it if the projects, articles or roles that mention MCP change.
 */
export type McpSpeaker = '$' | 'you' | 'agent' | 'ok';

export interface McpServerCard {
  id: 'hire' | 'portfolio';
  name: string;
  endpoint: string;
  manifest: string;
  connect: string;
  transcript: Array<{ who: McpSpeaker; text: string }>;
}

/** The prompt shown before each transcript line ("you › …"). verify-content builds the expected lines from it. */
export const MCP_PROMPT: Record<McpSpeaker, string> = { $: '$', ok: '✓', you: 'you ›', agent: 'agent ›' };

const connect = (name: string, url: string) => `claude mcp add --transport http ${name} ${url}`;

const HIRE_CONNECT = connect('hire', HIRE_SERVER.url);
const PORTFOLIO_CONNECT = connect('portfolio', MCP_SERVER.url);

export const MCP_SERVERS: McpServerCard[] = [
  {
    id: 'hire',
    name: 'HIRE check',
    endpoint: HIRE_SERVER.url,
    manifest: HIRE_SERVER.manifest,
    connect: HIRE_CONNECT,
    transcript: [
      { who: '$', text: HIRE_CONNECT },
      { who: 'ok', text: `connected · ${Object.keys(HIRE_TOOLS).length} tools` },
      { who: 'you', text: 'Should we build a fraud triage agent?' },
      { who: 'agent', text: 'calls get_hire_checklist, interviews you…' },
      { who: 'agent', text: 'calls assess_agent → TRAIN · 42/77' },
      { who: 'agent', text: 'Report: kin.rag.wtf/hire/#a=…' },
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    endpoint: MCP_SERVER.url,
    manifest: MCP_SERVER.manifest,
    connect: PORTFOLIO_CONNECT,
    transcript: [
      { who: '$', text: PORTFOLIO_CONNECT },
      { who: 'ok', text: `connected · ${Object.keys(MCP_TOOLS).length} tools` },
      { who: 'you', text: 'Has Chee Kin built MCP servers?' },
      { who: 'agent', text: 'calls search_portfolio {"query":"MCP"}' },
      { who: 'agent', text: '2 projects (Agentic AI Layer, Project Concord), 2 articles, 2 roles' },
    ],
  },
];
