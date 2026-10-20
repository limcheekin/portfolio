# Is kin.rag.wtf really agent-friendly? Validating the 9.9 audit score

Research date: 2026-10-20. Sources were read on that date; each source's own "last updated" date is given where it shows one. This field changes month to month, so re-check anything older than about six months before acting on it.

Notation: **Source says** marks what a primary source states. **Inference** marks my own reasoning. **Measured** marks something I observed on the live site on 2026-10-20 with read-only requests: GET and HEAD, plus one MCP `initialize` POST.

---

## Bottom line

1. **The 9.9 is a checklist score, not observed agent behaviour.** An LLM gave it after looking at the site passively, using a rubric that the same tooling family wrote, and the rubric rewards files whether or not any agent reads them. The site already scored **9.1** in the first audit (2026-10-19). Of the later +0.8, roughly half came from the "protocol bonus" for the A2A card and the MCP server (protocol score 5.0 to 8.8, worth up to +1.0). No mainstream assistant discovers either surface automatically.
2. **What real agents and crawlers are documented to use:** server-rendered HTML, `robots.txt`, the sitemap, open access with no bot challenge, and (for Google) a few structured-data types. The site already does all of these well. Those fundamentals do most of the work.
3. **Partly used:** `llms.txt` (Chrome Lighthouse checks it, but no LLM vendor documents reading it, and Google Search says it ignores it), the MCP server (works when a person adds the URL by hand) and Markdown alternates (llmstxt.org proposes them; Cloudflare's own agent feature uses `Accept: text/markdown` content negotiation instead).
   **Speculative or unused:** `/.well-known/mcp.json` (its proposal, SEP-1649, is closed), the A2A agent card, the agent-policy file, `speakable`, `data-testid`.
   **Deprecated or dead:** `ai-plugin.json` (the ChatGPT plugins beta has been wound down) and FAQ rich results (Google stopped showing them on 2026-05-07).
4. **Four problems the audit missed (measured):**
   - **WebMCP registers zero tools in current Chrome.** The island looks for `navigator.modelContext`, but the spec and Chrome 155 expose `document.modelContext`.
   - **`/mcp` accepts any `Origin`.** The MCP spec says servers MUST validate it. The practical risk is low here, but the audit called the server "spec-exact".
   - **`robots.txt` allows every AI-training crawler, while `/.well-known/agent-policy` prohibits training scraping.** Crawlers obey robots.txt, not the policy file.
   - **The `.md` alternates carry no canonical or noindex signal,** so search engines may index them as duplicates of the HTML pages.
5. **No sign that the changes harmed human visitors.** Lighthouse mobile today: Performance 0.91 (LCP 2.0 s, CLS 0, TBT 250 ms), Accessibility 0.95 (colour-contrast failures on small decorative labels), Best Practices 1.0, SEO 1.0. Lighthouse 13.5's Agentic Browsing category passes the checks that apply: accessibility tree, layout stability and llms.txt; the WebMCP checks are not applicable. The agent surfaces are off-page files and add about 1 KB of gzipped JS. The real costs are maintenance (about 2,700 lines across 17 files, several hand-kept) and metadata that contradicts itself.
6. **How you actually find out:** measure.
   - Cloudflare **AI Crawl Control** (all plans) and origin logs, checked against the vendors' published IP lists.
   - Search Console's **generative AI performance report** (all sites since 2026-08-31) and Bing Webmaster Tools **AI Performance**.
   - **Referrals**, including ChatGPT's `utm_source=chatgpt.com` tag.
   - A fixed **prompt panel** run monthly in ChatGPT, Claude, Perplexity, Gemini and Copilot.
   - Logs on `/mcp` and the agent files. After 90 days, drop the surfaces nobody uses.

---

## 1. What an LLM-run audit score does and does not prove

### How the score is built

- The skill (`.claude/skills/agent-first-web-auditor/`) has an LLM inspect the site "structural-passive[ly]" (audit metadata) and assign 0-10 scores on 14 dimensions plus two protocol dimensions. A script (`calculate_scores.py`) turns them into `Base = 0.3*Structural + 0.7*Task`, then adds `Protocol*0.10` when Base is at least 7.0 (`references/scoring-model.md`, `references/protocol-dimensions.md`).
- **Score history** (from `docs/audits/*.json`):

  | Audit | Overall | Structural | Task | Protocol |
  |---|---|---|---|---|
  | 2026-10-19, first audit | 9.1 | 8.7 | 8.5 | 5.0 |
  | 2026-10-20, live4 | 9.9 | 9.1 | 8.9 | 8.8 |

  - Base rose about 0.40 (8.56 to 8.96).
  - The protocol bonus rose about 0.38 (0.50 to 0.88).
  - The A2A card (P1) and the MCP server (P2) carry half the late gain.

### What the score measures well

- The presence and internal consistency of files, headers, markup and status codes.
- That nothing blocks access. The audit fetched pages with GPTBot, ClaudeBot and PerplexityBot UAs and got 200s with no challenge.
- That content is server-rendered.

Those are necessary conditions for agents to use the site.

### What it does not measure

- **Whether any agent visits or uses a surface.** No log, analytics or referral data is an input. The rubric awards points for `llms.txt`, `ai-plugin.json`, the agent card and an MCP manifest whatever their adoption.
- **Whether assistants answer questions about you correctly, or cite you.**
- **Human outcomes:** Core Web Vitals, WCAG conformance beyond semantics, conversions.
- **Spec conformance against the current specs.** The rubric's own example agent card (`schema_version`, `authentication`) is not the A2A AgentCard shape; those are `ai-plugin.json` fields. Its evals require an `authentication` field that the A2A spec does not define ([A2A spec, section 4.4.1](https://a2a-protocol.org/latest/specification/)). Its WebMCP notes name `navigator.modelContext.registerTool()`, while the current spec puts the API on `document.modelContext` ([WebMCP draft, 16 Oct 2026](https://webmachinelearning.github.io/webmcp/)). Its llms-full.txt "filtering (lang, excludeSpec)" criterion appears nowhere in the llms.txt proposal ([llmstxt.org](https://llmstxt.org/)).
- **Independence.** The fixes were written to the rubric and then re-scored by the same rubric. **Inference:** this is a closed loop that will drift towards the rubric (Goodhart's law). The audit is not an independent measurement.

### Where the audit and the sources disagree

- The audit lists `webmcp_ready: true`. **Measured:** the island registers nothing in Chrome 155 (section 2).
- The audit calls the MCP server "spec-exact". **Measured:** it does not apply the Streamable HTTP `Origin` rule (section 4.5).
- The audit gives the A2A card 8.0. **Source says:** under A2A 1.0.0, `supportedInterfaces` is a required AgentCard field ([A2A spec, section 4.4.1](https://a2a-protocol.org/latest/specification/)). The site's card is a 0.3.0-style card without it, and the site has no A2A endpoint to declare.

**How to use the score:** treat it as a lint pass ("nothing obvious is broken or missing"), not as evidence of agent friendliness. The evidence comes from sections 3 and 5.

---

## 2. Which surfaces real agents and crawlers consume

### Key primary statements

- **Google Search:** "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary." It also says: "You don't need to create new machine readable files, AI text files, or markup" ([AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), updated 2025-12-10).
- Google's AI optimization guide adds that you don't need "AI text files, markup, or Markdown to appear in Google Search". Creating them "will neither harm nor help". Structured data "isn't required for generative AI search" ([AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), updated 2026-07-10). On 2026-06-15 Google added that llms.txt files "aren't needed for Google Search" but it is "fine if you want to maintain these files for other services" ([Search Central updates log](https://developers.google.com/search/updates)).
- **Chrome Lighthouse** has an experimental Agentic Browsing category (Chrome 150+) with audits for the accessibility tree, layout stability, WebMCP and llms.txt. It has no weighted 0-100 score ([scoring](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring), updated 2026-05-05). Chrome says "a well-formed accessibility tree is the primary way AI agents understand your page" ([Chrome blog, 2026-06-22](https://developer.chrome.com/blog/agent-ready-toolkit)).
- **llmstxt.org** (v2, modified 2026-08-10) says OpenAI, Anthropic and Gemini *publish* llms.txt files for their docs. It does not say any of them *consumes* them ([llmstxt.org](https://llmstxt.org/)). **No primary source found** for any LLM vendor stating that its crawler or assistant reads a site's llms.txt. Reports that Google's John Mueller said no LLM confirmed using it exist only in trade press, so **no primary source found** for that quote. Google's documentation above is the primary statement for Google.

### Surface verdicts

| Surface | Who documents consuming it | Evidence | Verdict |
|---|---|---|---|
| Server-rendered HTML, semantic markup, accessibility tree | Google Search; Chrome agents; Anthropic web fetch (no JS rendering, so it needs server-rendered HTML) | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); [Chrome blog](https://developer.chrome.com/blog/agent-ready-toolkit); [Claude web fetch](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool) | **Proven** |
| `robots.txt` | OpenAI (GPTBot, OAI-SearchBot), Anthropic (ClaudeBot, Claude-SearchBot; web fetch refuses robots-blocked URLs), Google, Perplexity (PerplexityBot) | [OpenAI bots](https://developers.openai.com/api/docs/bots); [Anthropic crawler FAQ](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler); [Perplexity bots](https://docs.perplexity.ai/guides/bots); [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) | **Proven** for crawlers. User-triggered fetchers (ChatGPT-User, Perplexity-User, Google-Agent) may ignore it. |
| Sitemap with lastmod | Google, Bing | Standard Search Central and Bing guidance | **Proven** (search) |
| No WAF or CAPTCHA wall | Anthropic says its bots won't bypass CAPTCHAs; Cloudflare lets you allow signed agents | [Anthropic FAQ](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler); [OpenAI Cloud browser](https://help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting) | **Proven** |
| JSON-LD: Person, WebSite, WebPage, BreadcrumbList, Article, ProfilePage | Google (rich results for Breadcrumb, Article, ProfilePage); not needed for AI features | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page) | **Partial.** Helps classic rich results; no documented AI effect. |
| FAQPage JSON-LD | Google stopped showing FAQ rich results on 2026-05-07 and removed the docs on 2026-06-15 | [Search Central updates](https://developers.google.com/search/updates#removing-faq-rich-result) | **Deprecated** (as a rich result; harmless as data) |
| `speakable` | Google: beta, news content, English, US Google Home only | [Speakable docs](https://developers.google.com/search/docs/appearance/structured-data/speakable), updated 2026-09-08 | **Speculative** for this site (not a news publisher) |
| SoftwareApplication / SoftwareSourceCode / CreativeWork | schema.org vocabulary; no Google feature named for a portfolio | no primary source found for an AI consumer | **Speculative** |
| `llms.txt` | Lighthouse Agentic Browsing audit; Google Search ignores it; no LLM vendor documents reading it | [Lighthouse llms.txt audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt); [Google updates 2026-06-15](https://developers.google.com/search/updates) | **Partial** (a tool checks it; consumption unproven) |
| `llms-full.txt` | Not part of the llms.txt proposal | [llmstxt.org](https://llmstxt.org/) | **Speculative** |
| Markdown alternates `<page>/index.md` with `rel=alternate type=text/markdown` | Proposed by llmstxt.org. Cloudflare's "Markdown for Agents" uses `Accept: text/markdown` on the HTML URL instead (Pro and above). | [llmstxt.org](https://llmstxt.org/); [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/), updated 2026-10-09 | **Speculative.** No consumer documented. **Measured:** `Accept: text/markdown` on `/about/` returns HTML. |
| JSON API + OpenAPI + `/api/search.json` | No assistant documents auto-discovering an OpenAPI file. ChatGPT GPT Actions take an OpenAPI schema that a builder pastes in. | ChatGPT-User covers "GPT Actions" ([OpenAI bots](https://developers.openai.com/api/docs/bots)) | **Speculative** for discovery; useful to developers |
| MCP server `/mcp` | Claude, ChatGPT and other MCP clients connect to remote servers **by URL that a user or developer adds**. The official MCP Registry (preview) is the documented discovery channel. **Measured:** the site is not listed there. | [Anthropic remote MCP](https://platform.claude.com/docs/en/agents-and-tools/remote-mcp-servers); [MCP Registry](https://modelcontextprotocol.io/registry/about) | **Partial** (works when added; no automatic discovery) |
| `/.well-known/mcp.json` | SEP-1649 (which proposed it) is closed. Its successor, SEP-2127 "Server Cards", merged after acceptance on 2026-08-13 and points at an AI Catalog (`/.well-known/ai-catalog.json`), not `mcp.json`. Lighthouse 13.5 has an `ard-schema` audit for `ai-catalog.json`. | [SEP-1649](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1649); [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) | **Speculative / superseded path.** The site's own WebMCP island reads it, so it has one internal consumer. |
| A2A Agent Card (`agent.json`, `agent-card.json`) | A2A 1.0.0 registers `/.well-known/agent-card.json` for agents that speak A2A; `supportedInterfaces` is required | [A2A spec, sections 4.4.1, 8.2, 14.3](https://a2a-protocol.org/latest/specification/) | **Speculative, and misdescriptive** (no A2A endpoint exists; old 0.3.0 shape) |
| `ai-plugin.json` | ChatGPT plugins beta wound down in 2024. OpenAI's help article is now offline (`help.openai.com/en/articles/8988022` returned 404 on 2026-10-20); see OpenAI's forum record ([example](https://community.openai.com/t/error-plugins-are-no-longer-supported/715523)). | primary page removed | **Deprecated** |
| `/.well-known/agent-policy` | No standard; no consumer found | no primary source found | **Speculative** (unread prose) |
| WebMCP (`navigator.modelContext` in `WebMCPTools.tsx`) | Proposed standard; Chrome origin trial M149 to M156; spec entry point is `document.modelContext` | [WebMCP draft CG report, 2026-10-16](https://webmachinelearning.github.io/webmcp/); [Chrome Status feature](https://chromestatus.com/feature/5117755740913664) ("web_feature: document-modelcontext"); [Chrome WebMCP docs](https://developer.chrome.com/docs/ai/webmcp), updated 2026-10-07 | **Speculative, and broken in this implementation** (see below) |
| `data-testid` | No agent vendor documents using it. Agents use the accessibility tree, the DOM and screenshots. | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); [Chrome blog](https://developer.chrome.com/blog/agent-ready-toolkit) | **Speculative** for agents; useful for your own tests |
| CORS on agent files | Only matters to browser-side callers (for example the WebMCP island fetching `/api/portfolio.json`). Server-side agents ignore CORS. | [Fetch standard, CORS and credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials) | **Partial** (harmless; little demand) |
| OPTIONS 204 + `Allow` | No agent documents sending OPTIONS to pages | no primary source found | **Speculative** (harmless) |
| `RateLimit-Policy` / `X-RateLimit-*` headers | IETF draft-11 (2026-05-23), not an RFC. **Measured:** the syntax used (`60;w=60;burst=30`) does not match the draft, which needs a named policy with `q=`, for example `"mcp";q=60;w=60`. `burst` is not defined. | [draft-ietf-httpapi-ratelimit-headers](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) | **Speculative**; non-conforming syntax |

### WebMCP finding (measured)

- **Setup:** Chrome 155.0.0.0 headless through Puppeteer, on 2026-10-20.
  - Default profile: neither `navigator.modelContext` nor `document.modelContext` exists. The site carries no origin-trial token.
  - With the `WebMCPTesting` feature on: `document.modelContext` exists, with `registerTool`, `getTools`, `executeTool` and `ontoolchange`. `navigator.modelContext` does not exist. After page load, `document.modelContext.getTools()` returned `[]`.
- **Result:** `WebMCPTools.tsx` returns early at `const mc = (navigator as any).modelContext; if (!mc) return;`, so the site registers no WebMCP tools in any current Chrome configuration.
- **Lighthouse 13.5.0 agrees:** `webmcp-registered-tools`, `webmcp-schema-validity` and `webmcp-form-coverage` were "notApplicable" by default and listed no tools with the flag.
- **Chrome's docs** name two test extensions as callers and say they are separate from Gemini in Chrome ([Chrome WebMCP docs](https://developer.chrome.com/docs/ai/webmcp)).
- **Inference:** no production assistant calls WebMCP tools today. Fixing the entry point is cheap, but the value is experimental.
- Third-party guides claim `navigator.modelContext` was deprecated in Chrome 150; **no primary source found** for that date. The spec IDL alone (`partial interface Document`) is enough to justify the fix.

---

## 3. How to measure real agent friendliness

The question to answer is "which agents come, what do they fetch, and do people arrive or get correct answers because of it?" Measure four things: **crawl** (who fetches what), **retrieval** (user-triggered fetches during live chats), **outcome** (referrals, citations, impressions) and **answer quality** (what assistants say about you).

### 3.1 Documented user agents and IP lists

User-agent strings can be spoofed. Count a hit only when the source IP falls in the vendor's published ranges, or when Cloudflare marks the request as a verified bot or signed agent.

| Operator | Token (robots.txt / UA) | Purpose (per vendor) | Obeys robots.txt? | IP list (checked 2026-10-20) |
|---|---|---|---|---|
| OpenAI | `GPTBot` (example UA `...; compatible; GPTBot/1.4; +https://openai.com/gptbot`) | Training | Disallow means "should not be used in training" | https://openai.com/gptbot.json |
| OpenAI | `OAI-SearchBot` (example UA ends `compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot`) | ChatGPT search results | Yes (~24 h to apply) | https://openai.com/searchbot.json |
| OpenAI | `ChatGPT-User` (`...; compatible; ChatGPT-User/1.0; +https://openai.com/bot`) | User-initiated fetches, GPT Actions | "robots.txt rules may not apply" | https://openai.com/chatgpt-user.json |
| OpenAI | ChatGPT Cloud browser (formerly ChatGPT agent): RFC 9421 signatures with header `Signature-Agent: "https://chatgpt.com"`; keys at https://chatgpt.com/.well-known/http-message-signatures-directory; Cloudflare detection ID 129220581 | Browser agent | n/a | verify by signature ([OpenAI help, updated ~2026-10-19](https://help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting)) |
| Anthropic | `ClaudeBot`, `Claude-User`, `Claude-SearchBot` (the FAQ gives tokens, not full UA strings) | Training / user fetch / search quality | Yes, plus `Crawl-delay` | https://claude.com/crawling/bots.json ([FAQ dated 2026-04-07](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)) |
| Perplexity | `PerplexityBot` (`Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)`) | Search index, "not used to crawl content for AI foundation models" | Yes | https://www.perplexity.com/perplexitybot.json |
| Perplexity | `Perplexity-User` (`...compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user`) | User-triggered fetch | "Generally ignores robots.txt" | https://www.perplexity.com/perplexity-user.json ([Perplexity bots](https://docs.perplexity.ai/guides/bots)) |
| Google | `Googlebot` (search, and therefore AI Overviews and AI Mode) | Search | Yes | https://developers.google.com/static/search/apis/ipranges/googlebot.json |
| Google | `Google-Extended` (robots token only, no separate UA) | Gemini training and grounding; "not a ranking signal" | Yes | uses Google crawler IPs ([common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), updated 2026-10-15) |
| Google | `Google-Agent` (UA tail `compatible; Google-Agent; +https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent`) | Agents acting on user request | "generally ignore robots.txt" | https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json ([user-triggered fetchers](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers), updated 2026-08-19) |
| Microsoft | `bingbot` (also feeds Copilot; ChatGPT search names Microsoft among its search partners) | Search and Copilot grounding | Yes | https://www.bing.com/toolbox/bingbot.json ([ChatGPT search help](https://help.openai.com/en/articles/9237897-chatgpt-search)) |

Google also documents reverse plus forward DNS verification ([Verifying Googlebot](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot), updated 2026-03-20).

### 3.2 Origin logs (nginx in the Coolify container)

- **Gap:** `nginx.conf` uses the default `combined` log format, so `$remote_addr` is the Coolify/Cloudflare proxy, not the visitor. Cloudflare says to log `$http_cf_connecting_ip` or use `ngx_http_realip_module` with `set_real_ip_from` for each Cloudflare range ([Restoring visitor IPs](https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/)).
- **Change for the owner to make:** add `log_format agents '$http_cf_connecting_ip [$time_iso8601] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" sig_agent="$http_signature_agent"';` and use it in `access_log`. This logs the real IP and the OpenAI `Signature-Agent` header.
- **Repeatable weekly extract:**

  ```sh
  docker logs <container> --since 168h 2>/dev/null \
    | grep -E 'GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Googlebot|Google-Agent|bingbot|chatgpt.com' \
    > agents-week.log
  # hits per bot, per surface
  awk -F'"' '{print $6}' agents-week.log | grep -oE 'GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Googlebot|Google-Agent|bingbot' | sort | uniq -c
  grep -E '"(GET|POST) /(llms(-full)?\.txt|[^ ]*\.md|api/|\.well-known/|mcp|ai-plugin\.json)' agents-week.log | awk -F'"' '{print $2, $6}' | sort | uniq -c | sort -rn
  ```

- Verify the first field against the IP lists in 3.1 with a short script (Python `ipaddress.ip_network(prefix).__contains__`). Report verified and unverified counts separately.
- **Metrics:**
  - Verified requests per week per operator, split into crawl and user-triggered.
  - Share of the 28 sitemap URLs fetched by each search crawler in 30 days.
  - Number of 4xx and 5xx responses served to verified bots (target 0 on sitemap URLs).
  - **Agent-surface hits per surface** (llms.txt, llms-full.txt, `*.md`, `/api/*`, `.well-known/*`, `/mcp`, `ai-plugin.json`) from verified or non-audit UAs. This is the number that decides which surfaces earn their upkeep.

### 3.3 Cloudflare AI Crawl Control (no origin changes needed)

- **What it offers:** "Available on all plans" ([AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/)).
  - The Metrics tab shows requests over time by crawler, operator and category, the status-code mix (including 402 and 403), and the most popular paths ([Analyze AI traffic](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/)).
  - Referrals and top referrers require a paid plan (same page).
  - A robots.txt tracking page lists crawlers that violate your directives.
- **Steps:**
  1. Dashboard > AI Crawl Control. Record a 30-day baseline: requests per operator, top paths, and whether `/llms.txt`, `/*.md` and `/api/*` appear among the top paths at all.
  2. Export the CSV monthly and keep it in the repo (for example `docs/research/metrics/`).
- **Cloudflare verified bots:** "Signed agents are now Verified" as of 2026-07-01; the public list is the Radar directory ([Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/)).
- **Logpush** lists all plans, but "dataset availability depends on the Cloudflare products on your account" ([Logpush](https://developers.cloudflare.com/logs/logpush/)). Check whether the HTTP requests dataset is offered on this zone before relying on it.
- **Context (not your site):** Radar's crawl-to-refer ratio (HTML crawl requests per HTML referral, per platform) shows how few referrals training crawls return ([Radar glossary](https://developers.cloudflare.com/radar/glossary/); [Cloudflare blog](https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/)).

### 3.4 MCP server logs

- **Today:** `mcp/server.ts` logs only failures (`console.error('mcp: request failed', ...)`). nginx logs each `/mcp` POST with its UA, but not the JSON-RPC method or tool.
- **Owner change:** log one line per request: timestamp, CF IP (from the `CF-Connecting-IP` header), `User-Agent`, `MCP-Protocol-Version`, JSON-RPC method, tool name, and status/duration. Never log the arguments' free text beyond the tool name. `clientInfo.name` from `initialize` identifies the client (Claude, ChatGPT, Inspector and so on).
- **Metrics:**
  - `initialize` per week by `clientInfo.name`.
  - `tools/call` per tool.
  - Error rate (target under 1% excluding your own `mcp:smoke`).
  - 429 count (target 0 for real clients).
- **Exclude:** CI smoke runs and your own tests, by IP or `clientInfo`.
- **Discovery test:** search the [MCP Registry](https://modelcontextprotocol.io/registry/about) API for the site (`https://registry.modelcontextprotocol.io/v0/servers?search=limcheekin` returned 0 servers on 2026-10-20). If nobody can discover the server, expect near-zero organic MCP traffic. Publishing to the registry (namespace verified by DNS or HTTP) is the documented route.

### 3.5 Task-based tests (the most direct test of "friendly")

**A. Prompt panel (monthly; about 30 minutes)**

- Use a logged-out or clean profile where possible, with web search on: ChatGPT (search), Claude (web search), Perplexity, Gemini, Microsoft Copilot.
- Ask the same 10 questions each time, for example:
  1. "Who is Lim Chee Kin, the AI Solutions Architect?"
  2. "What does Lim Chee Kin do at Daxonet AI?"
  3. "List Lim Chee Kin's open-source projects with links."
  4. "What is Claim Pilot / Trade Pilot / WareBot?"
  5. "What has Lim Chee Kin written about zero-trust AI agents?"
  6. "How do I contact Lim Chee Kin?"
  7. "Which MCP projects has Lim Chee Kin built?"
  8. "What is his newest article?"
  9. "Where is Lim Chee Kin based?"
  10. "What did he do before AI?"
- **Score each answer:**
  - Accuracy: 0 to 2 (title, employer, projects, dates).
  - Cites kin.rag.wtf: yes or no, and which URL.
  - Any hallucination. Specifically check for an invented years-of-experience figure, and for the hero console's illustrative IDs (`QT-0412`, `JV-2291`, `TR-778`) presented as facts.
  - Recency (does it know the 2026 Daxonet role).
- Keep the transcripts and screenshots, dated.
- **Pass:** 8 or more of 10 correct on each assistant that searches, kin.rag.wtf cited at least once by each, zero fabricated figures.
- **Inference:** assistants differ in source; Gemini grounds on Google Search, ChatGPT search uses partners including Microsoft ([ChatGPT search help](https://help.openai.com/en/articles/9237897-chatgpt-search)). So misses usually point to indexing in Google or Bing, not to missing agent files.

**B. Browser-agent tasks (quarterly)**

- Run in Claude in Chrome, the ChatGPT Cloud browser and Gemini in Chrome, starting from `https://kin.rag.wtf/`:
  - "Find his email address."
  - "Open his newest article and summarise it."
  - "List his enterprise projects and their tech stacks."
  - "Download his résumé."
- Record success, steps, wall time and any wrong click.
- Do **not** task an agent with submitting the contact form: the agent policy forbids it, and it would create real messages.
- **Pass:** 4 of 4 tasks succeed on each agent in 10 steps or fewer.

**C. Tool-level tests**

- MCP: [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) (`npx @modelcontextprotocol/inspector`) against `https://kin.rag.wtf/mcp`. Then add the URL as a custom connector in Claude and ask the panel questions.
  - **Pass:** each of the six tools returns valid output; the answers match the site.
- Fetch-tool view: ask Claude (API web fetch, or claude.ai) to "fetch https://kin.rag.wtf/ and list the facts on it". Anthropic's web fetch returns page text, does not run JavaScript, and refuses robots-blocked URLs ([web fetch docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)).
  - **Pass:** no decorative console text is reported as fact.

### 3.6 Citation and referral tracking

- **ChatGPT:** OpenAI's publisher FAQ states that ChatGPT appends `utm_source=chatgpt.com` to referral links ([OpenAI publishers FAQ](https://help.openai.com/en/articles/12627856)). Caveat: that page returned 403 to my fetches on 2026-10-20 and the statement is taken from its indexed text, so confirm in your own logs.
- **Other assistants:** no primary source found for referrer values. Observe `Referer` hosts such as `chatgpt.com`, `perplexity.ai` / `www.perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`.
- **Where to see them:**
  - The site already has Cloudflare Web Analytics; Lighthouse saw the `static.cloudflareinsights.com` beacon injected. It reports the **Referer** host and has an **Exclude Bots** filter ([Web Analytics dimensions](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)).
  - Also query the nginx log for `utm_source=chatgpt.com` in the request line and for referrer hosts.
- **Metrics:** sessions per month by AI referrer, and the landing pages they hit. A rising count of landings on project and article pages is the strongest proof of value.

### 3.7 Search Console and Bing Webmaster Tools

- **Google:** the Search Generative AI performance report shows **impressions** in AI Overviews, AI Mode and Discover AI features, by page, country, device and date (hourly to monthly). It launched 2026-06-03 and has been "rolled out ... to all websites worldwide" since 2026-08-31 ([Google blog](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)). AI-feature traffic is also inside the normal Performance > Web report ([AI features](https://developers.google.com/search/docs/appearance/ai-features)).
  - Steps: verify the domain property, submit `sitemap-index.xml`, record monthly AI impressions per page.
  - Use URL Inspection on `/about/index.md` and one `/insights/<slug>/` page to see the canonical Google chose.
- **Bing:** AI Performance (public preview since February 2026) shows when the site is cited in Copilot, Bing AI summaries and partner integrations: total citations, cited pages and trend. June 2026 added Intents, Topics, Citation Share and Compare ([Bing blog, Feb 2026](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview); [Bing blog, Jun 2026](https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare)). Caveat: these pages timed out for me, and the details come from their indexed text.
  - **Inference:** this is the closest thing to a ChatGPT-adjacent visibility report, because ChatGPT search uses Microsoft among its search partners.

---

## 4. Did the changes harm humans or agents?

### 4.1 Performance (Core Web Vitals and Lighthouse)

**Thresholds:** good is LCP at most 2.5 s, INP at most 200 ms and CLS at most 0.1, at the 75th percentile ([web.dev Web Vitals](https://web.dev/articles/vitals)).

**Field data:** CrUX includes only "sufficiently popular" pages and origins ([CrUX methodology](https://developer.chrome.com/docs/crux/methodology)). **Inference:** a personal portfolio probably has no field data, so lab runs are the practical comparison.

**Measured today** (Lighthouse 12.8.2, mobile, simulated throttling, HeadlessChrome 155, one run on 2026-10-20):

| Category | Score |
|---|---|
| Performance | 0.91 (FCP 2.0 s, LCP 2.0 s, CLS 0, TBT 250 ms, Speed Index 4.0 s) |
| Accessibility | 0.95 |
| Best Practices | 1.00 |
| SEO | 1.00 |

Below-0.9 items: `color-contrast`, `unused-javascript`, `legacy-javascript`, `forced-reflow-insight`, `mainthread-work-breakdown`, and `uses-long-cache-ttl` (only Cloudflare's own beacon, 1 day).

**Agent surfaces' page cost** (Measured on the local `dist/`):

- WebMCP island: 2,485 B raw, about 1.2 KB gzipped.
- JSON-LD: about 7.5 KB of the 85 KB home HTML; about 6.3 KB of the 66 KB About HTML.
- Every other agent surface is a separate file that browsers never load.
- **Inference:** the agent work cannot plausibly move CWV. The GSAP and Lenis motion work dominates main-thread cost.

**Before/after procedure (repeatable):**

1. `git worktree add ../portfolio-before 5f5c1f4`. That is the last commit before `4c4f47c fix: agent-first audit fixes`.
2. In each tree: `npm ci && npm run build && npm run preview`, on different ports.
3. `npx lighthouse@12 http://localhost:<port>/ --preset=perf --output=json` five times per URL. Use `/`, `/about/`, `/projects/claim-pilot/` and `/insights/zero-trust-ai-agents/`; take medians.
4. **Pass:** for each URL the "after" median is within noise of "before": LCP no more than 10% worse, TBT no more than 50 ms worse, CLS no more than 0.02 worse, and the transferred bytes of HTML+JS no more than 5% larger.

**Note:** local preview has no Cloudflare. Run the live URL as well, but compare like with like.

### 4.2 Accessibility

- **Measured:** axe (through Lighthouse) flags insufficient contrast on 10.5 px labels, for example `#595f66` on `#0d0d0f` = 3.0:1, `#028b5f` on `#0e1f19` = 3.95:1 and `#25799f` on `#0c181f` = 3.69:1. These look like the illustration and console chrome. WCAG 2.2 is a W3C Recommendation (2024-12-12) ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)); contrast minimum 1.4.3 needs 4.5:1 for small text. Small, but it is a real human-facing defect, and Chrome counts accessibility-tree quality as agent readiness too ([Chrome blog](https://developer.chrome.com/blog/agent-ready-toolkit)).
- **Motion:** WCAG 2.2.2 Pause, Stop, Hide (Level A) covers auto-moving content lasting more than five seconds. The hero console's pause control addresses it.
- **Lighthouse 13.5 Agentic Browsing (measured):** `agent-accessibility-tree` passed, `cumulative-layout-shift` 0, `llms-txt` passed; the WebMCP and `ard-schema` audits were not applicable.
- **Steps:** run `npx @axe-core/cli https://kin.rag.wtf/ /about/ /projects/ /contact/` (or axe DevTools) plus one keyboard-only and one screen-reader pass per release.
- **Pass:** zero serious or critical axe violations, Lighthouse Accessibility 1.0.

### 4.3 Duplicate content and canonicals

- **Markdown alternates:**
  - **Measured:** `/about/index.md` returns `text/markdown` with no `Link: rel=canonical` and no `X-Robots-Tag`.
  - **Source says:** Google supports a `rel="canonical"` **HTTP header** for non-HTML files ([Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), updated 2026-07-10), and its AI guide says "duplicate content can be a bad user experience" ([AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)).
  - **Inference:** risk is low (the files are not in the sitemap) but non-zero, because the HTML links them with `rel=alternate`. A one-line nginx fix removes it: in `location ~* \.md$` add `Link: <https://kin.rag.wtf$uri_without_index_md>; rel="canonical"`, or `X-Robots-Tag: noindex`. Choose canonical if you want the signal consolidated.
  - **Check:** Search Console > Pages, filtered to `.md`.
- **`/insights/<slug>/` summary pages and Medium:**
  - **Measured:** each page is an approximately 90-word summary with a self-canonical and `sameAs` to the Medium original; the full text lives only on Medium. That is not syndication of full text.
  - **Source says:** for syndication Google recommends that partners block indexing, and that `rel=canonical` "is not recommended for those who want to avoid duplication by syndication partners" ([Canonicalization troubleshooting](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting), updated 2026-08-21).
  - **Inference:** no duplicate risk today. The risk is thinness: short pages competing with the stronger Medium URL. Keep them noticeably different (key points, context) or accept that Medium ranks. Do **not** paste full Medium text without `noindex`.

### 4.4 Structured-data policy

- **Visible-content rule:** "Don't mark up content that is not visible to readers of the page." Markup must be "a true representation of the page content". Violations can lead to a manual action ([Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), updated 2026-07-10). CLAUDE.md already requires the FAQ JSON-LD to repeat only visible FAQ text, so keep that rule.
- **FAQPage:** no rich result anymore (deprecated 2026-05-07) ([updates](https://developers.google.com/search/updates#removing-faq-rich-result)). It is harmless as data, but expect no SERP feature.
- **speakable:** beta, news-only, English, US Google Home ([speakable](https://developers.google.com/search/docs/appearance/structured-data/speakable)). **Neutral:** no effect for a portfolio. Keep it only if it costs nothing.
- **Article:** Google recommends an image "representative of the article" and `dateModified` ([Article](https://developers.google.com/search/docs/appearance/structured-data/article)). The audit found the generic banner and no `dateModified`. This is minor.
- **ProfilePage** fits an "About Me" page about one person ([ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)), so it is appropriate.
- **Tools:** [Rich Results Test](https://search.google.com/test/rich-results) (Google features only) and [Schema Markup Validator](https://validator.schema.org/) (all schema.org types).
- **Pass:** zero errors on both for one page of each type.

### 4.5 Security exposure

- **`/mcp` Origin rule:**
  - **Source says:** "Servers MUST validate the `Origin` header on all incoming connections to prevent DNS rebinding attacks. If the `Origin` header is present and invalid, servers MUST respond with HTTP 403" ([MCP transports 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)).
  - **Measured:** POST `initialize` with `Origin: https://evil.example` returned 200 with a full `InitializeResult` and `Access-Control-Allow-Origin: *`.
  - **Inference:** the threat in the spec is mainly *local* servers being reached from a malicious page. This server is public, read-only, unauthenticated and cookie-free, so a cross-origin page can only read public data and spend your rate limit. Low practical risk, but a strict-reading non-conformance. Either validate against an allowlist (no Origin, plus `https://kin.rag.wtf`) or record the "all origins valid" decision in code.
- **Rate-limit key:**
  - nginx keys the limit on `CF-Connecting-IP` whenever the header is present.
  - **Source says:** Cloudflare advises accepting traffic only from Cloudflare IPs, "otherwise, the header could be spoofed" ([Restoring visitor IPs](https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/)).
  - **Inference:** if the origin (Coolify host) is reachable directly, a client can rotate fake `CF-Connecting-IP` values and bypass the 60/min limit. Check that the origin firewall allows only Cloudflare ranges, or use `set_real_ip_from` with Cloudflare ranges.
- **CORS:**
  - **Source says:** `Access-Control-Allow-Origin: *` is legal only for requests without credentials ([Fetch standard](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials)).
  - The site sets no cookies and no `Allow-Credentials`, so `*` on public JSON exposes nothing that isn't already public. **Neutral.**
- **Robots.txt is not security:** "The Robots Exclusion Protocol is not a substitute for valid content security measures" ([RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html)). Nothing private should be relying on it, and nothing does.

### 4.6 Maintenance cost of many surfaces

- **Measured:** about 2,700 lines across 17 files serve agents:
  - `generate-api.ts` 304, `verify-content.ts` 332, `mcp-smoke.ts` 158, `mcp/server.ts` 203, the portfolio-* libs 271, `WebMCPTools.tsx` 79
  - hand-written `openapi.json` 859, `agent.json` 106, `llms.txt` 73, `agent-policy` 32, `ai-plugin.json` 22
  - nginx configs 181
- Much of it is generated from the content collections and checked by `verify:dist` and `mcp:smoke`, which is good. The hand-written files (OpenAPI, agent card, plugin manifest, policy, llms.txt prose) are where drift and contradictions creep in. The robots/policy conflict and the outdated A2A shape are examples.
- **Inference:** each surface with no measured consumer is pure cost.
- **Rule:** after 90 days of 3.2 to 3.4 data, delete any surface with zero verified or real-client hits that no spec or major vendor documents consuming. Candidates today: `ai-plugin.json`, `/.well-known/agent-policy` (fold into robots.txt and llms.txt), the A2A card, and `llms-full.txt` if unused.

### 4.7 Cache headers

- **Measured and audited:** Cloudflare serves `robots.txt` and `resume.pdf` with `max-age=14400` while the origin sends 3600.
- **Source says:** Cloudflare overrides origin `max-age` values that are lower than the zone's Browser Cache TTL (default 4 hours) unless the zone is set to "Respect Existing Headers" ([Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)). Cloudflare caches by extension: PDF and robots.txt by default, not HTML, JSON or `.txt` generally ([Default cache behaviour](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)).
- **Source says:** crawlers "SHOULD NOT use the cached version [of robots.txt] for more than 24 hours" ([RFC 9309, section 2.4](https://www.rfc-editor.org/rfc/rfc9309.html)).
- **Inference:** a 4-hour robots.txt cache is harmless. After you change robots.txt, allow up to 24 h for crawlers (OpenAI also cites ~24 h) plus 4 h of edge cache.
- `must-revalidate` on HTML means a stale copy must be revalidated before reuse ([RFC 9111, section 5.2.2.2](https://www.rfc-editor.org/rfc/rfc9111.html)). That is fine with ETags. **Neutral.**

### 4.8 robots.txt versus the owner's goals

- **Measured:** `User-agent: * / Allow: /`. Every bot UA tested got 200, including GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider and meta-externalagent.
- **The contradiction:** `/.well-known/agent-policy` lists "Scraping for AI training datasets without explicit written permission" as prohibited. Training crawlers are documented to honour **robots.txt** tokens (GPTBot, ClaudeBot, Google-Extended) ([OpenAI](https://developers.openai.com/api/docs/bots); [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler); [Google](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers)). No crawler documents reading `agent-policy` (no primary source found). So the stated preference is not expressed where it can take effect.
- **Pick one:**
  - **(a) Visibility-maximising (inference: likely right for a personal brand).** Keep robots.txt open, and change the policy text to permit training with attribution. Being in training data helps models "know" you without a live search.
  - **(b) No-training.** Add `User-agent: GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` and similar with `Disallow: /`, while keeping `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Googlebot` and `bingbot` allowed. Blocking Google-Extended does not affect Search ranking or inclusion (same Google page).
  - Optionally use Cloudflare's managed robots.txt with Content Signals (`search`, `ai-input`, `ai-train`). Note that enabling it prepends Cloudflare's defaults (`ai-train=no`) to your file ([Managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)), which would flip you to (b).
- **Do not block** OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot or bingbot. Those control whether assistants' *search* features can surface and cite you.

### 4.9 One accuracy risk the audit rated minor

- **The issue:** the hero console and the illustrations put invented strings (`QT-0412`, `RM 186.40`, `JV-2291`, `TR-778`) in the raw HTML inside `aria-hidden` regions.
- **Inference:** text extractors such as fetch tools that "retrieve the full text content" ([Claude web fetch](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)) may not honour ARIA, so an assistant could repeat them as facts about your projects.
- **Mitigation:** Google lists `data-nosnippet` among the controls for what Search shows ([AI features](https://developers.google.com/search/docs/appearance/ai-features)). Bing says content in `data-nosnippet` is excluded from snippets and AI summaries ([Bing blog, Oct 2025](https://blogs.bing.com/webmaster/October-2025/Bing-Introduces-Support-for-the-data-nosnippet-HTML-Attribute)). Wrapping the decorative console in `data-nosnippet` costs nothing.
- **Check:** prompt-panel question "what is quotation QT-0412 in Trade Pilot?" (pass: the assistant does not present it as a real record).

---

## 5. Prioritised verification plan

### This week

| # | Action | Pass / fail |
|---|---|---|
| 1 | Baseline Lighthouse: live and before/after (`5f5c1f4` vs `HEAD`), 5 runs per URL, 4 URLs (section 4.1) | Pass: "after" within noise thresholds on every URL. Fail: any metric beyond them. Save the JSON under `docs/research/metrics/`. |
| 2 | Fix or remove WebMCP: use `document.modelContext` (fall back to `navigator`), or delete the island | Pass: Lighthouse 13 with the WebMCP flag lists 6 registered tools and `webmcp-schema-validity` passes, or the island is gone. Fail: tools list empty. |
| 3 | Resolve robots.txt vs agent-policy (section 4.8, option a or b) | Pass: both files state the same training preference; the GPTBot, ClaudeBot and Google-Extended entries match it. |
| 4 | Add `Link: rel=canonical` (or `X-Robots-Tag: noindex`) to `*.md`; consider the same for `llms*.txt` | Pass: `curl -I /about/index.md` shows the header. Within 30 days, URL Inspection shows the HTML as canonical, or the `.md` is not indexed. |
| 5 | Fix the colour-contrast failures | Pass: Lighthouse Accessibility 1.0; axe 0 serious or critical. |
| 6 | Turn on measurement: AI Crawl Control baseline export; Search Console and Bing verified with sitemap submitted; nginx `log_format` with `$http_cf_connecting_ip` and `$http_signature_agent`; one log line per MCP request | Pass: each source produces a first data point, recorded with the date. |
| 7 | Run the prompt panel (section 3.5A) once as a baseline | Pass: transcripts saved. Record the score; there is no pass bar on the first run. |
| 8 | MCP hygiene: decide the Origin policy (allowlist, or a documented "all origins valid"); fix `RateLimit-Policy` to draft syntax (`"mcp";q=60;w=60`); confirm the origin accepts only Cloudflare IPs | Pass: POST with `Origin: https://evil.example` gets 403 (if allowlisting); `mcp:smoke` still green; direct-to-origin requests are refused. |
| 9 | Decide on the deprecated or misdescriptive surfaces: delete `ai-plugin.json` (both paths) and the A2A card, or bring the card to the A2A 1.0 shape only if you ever add an A2A endpoint; stop advertising `mcp.json` as a standard (keep it if the WebMCP island needs it) | Pass: llms.txt, robots.txt comments and `verify` checks updated to match; no 404 links in the discovery files. |
| 10 | Wrap decorative console and illustration text in `data-nosnippet` | Pass: present in the built HTML; the prompt-panel fabrication check passes next month. |

### Monthly (about 1 hour)

| Metric | Source | Pass | Investigate if |
|---|---|---|---|
| Verified crawler requests per operator (Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot) | AI Crawl Control + logs | Each search crawler fetched at least 80% of the 28 sitemap URLs in 30 days | Any search crawler at 0, or any 4xx/5xx served to them |
| User-triggered fetches (ChatGPT-User, Claude-User, Perplexity-User, Google-Agent, Cloud browser) | Logs (IP or signature verified) | Trend recorded | Sudden drop to 0 (possible blocking) |
| Agent-surface hits (llms.txt, llms-full.txt, `*.md`, `/api/*`, `.well-known/*`, `/mcp`) from verified or real clients | Logs + MCP log | Recorded | 0 for 3 consecutive months: delete that surface |
| MCP: `initialize` by `clientInfo.name`, `tools/call` per tool, error rate, 429s | MCP log | Error rate under 1%, 0 real-client 429s | Errors above 1% |
| AI referrals (`utm_source=chatgpt.com`; Referer hosts chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com) | Cloudflare Web Analytics + logs | Recorded per landing page | Landings concentrated on 404s or wrong pages |
| Google AI impressions and pages | Search Console generative AI report | Trend flat or up | Sustained fall |
| Bing / Copilot citations and cited pages | Bing AI Performance | Trend flat or up | Citations fall to 0 |
| Prompt panel accuracy | Section 3.5A | At least 8/10 per assistant, kin.rag.wtf cited, 0 fabrications | Any fabricated figure or a wrong title or employer |
| Lighthouse (live), including Agentic Browsing | Lighthouse 13 | Perf at least 0.90, A11y 1.0, agentic checks pass | Regression after a deploy |
| Rich Results Test / Schema Markup Validator (one page per type) | Google / schema.org tools | 0 errors | Any error |

### Quarterly

- Browser-agent tasks (section 3.5B).
- Re-check the moving specs, each of which has a dated source above: WebMCP origin trial status (ends after M156), MCP Server Cards / AI Catalog, A2A versions, Google's structured-data feature list, vendor bot lists.
- Re-run the LLM audit only as a regression lint, and read its score next to the measured numbers above, never in place of them.

---

## Appendix: measurements taken on 2026-10-20

- `GET /mcp` gave 405 with `Allow: POST, OPTIONS` (matches the spec's "405 if no SSE stream").
- `POST /mcp initialize` with `Origin: https://evil.example` gave 200, `protocolVersion 2025-11-25`, `listChanged:false`.
- `GET /about/` with `Accept: text/markdown` gave `text/html` (no content negotiation).
- `HEAD /about/index.md` gave `text/markdown`, CORS `*`, `max-age=3600`, no `Link` or `X-Robots-Tag`.
- `/about/` head links: canonical, `alternate text/markdown`, `rel=help` to llms.txt, `rel=describedby` to mcp.json. **Source says:** llmstxt.org recommends `rel="describedby"` for the llms.txt that covers a page ([llmstxt.org](https://llmstxt.org/)). The site uses `describedby` for mcp.json instead. This is minor.
- `robots.txt`: `User-agent: * / Allow: /`. GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider and meta-externalagent UAs all got 200 on `/`.
- MCP Registry search `limcheekin` returned 0 servers.
- Lighthouse 12.8.2 mobile: Perf 0.91, A11y 0.95, BP 1.0, SEO 1.0.
- Lighthouse 13.5.0 Agentic Browsing: pass ratio 1 (accessibility tree, CLS, llms.txt pass; WebMCP and ard-schema not applicable).
- Chrome 155 + `WebMCPTesting`: `document.modelContext` present, `navigator.modelContext` absent, `getTools()` returned `[]`.
- Vendor IP lists fetched with HTTP 200, with these `creationTime` values:

  | List | creationTime |
  |---|---|
  | claude.com/crawling/bots.json | 2026-10-07 |
  | openai.com/gptbot.json | 2026-09-22 |
  | openai.com/searchbot.json | 2026-01-02 |
  | openai.com/chatgpt-user.json | 2026-10-07 |
  | perplexitybot.json | 2025-02-07 |
  | perplexity-user.json | 2025-10-17 |
  | Google lists | 2026-10-19 |
  | bingbot.json | 2024-01-03 |
