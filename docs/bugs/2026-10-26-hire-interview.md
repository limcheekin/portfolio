# HIRE interview: unconfirmed inputs presented as a validated assessment

## Observed failure

The shared expense-agent conversation at <https://share.gemini.google/fIYUFKl1p10S> presents
60/77 HIRE as a complete, verified assessment. The visible user messages supply a job outline,
multi-step claim submission and an incorrect-payout worst case, with draft/suggest permissions.
They do not establish the scores for ROI, time savings, trust, integrations or the safety controls
that the final answer describes as facts. The share renders the first two assistant responses empty
and exposes no MCP call trace, so it cannot prove which tools or arguments were used.

## Feedback loop and diagnosis

The live `initialize` response on 2026-10-26 says to interview the user in checklist order, but
does not specify one question per turn or prohibit filling missing answers with assumptions.
Two repeated `get_hire_checklist` calls return no interview instructions at all. A minimal
assertion that `result.structuredContent.interviewInstructions` is a non-empty string fails
both times. This is a deterministic reproduction of the missing server contract, not a replay
of Gemini's generation.

Ranked hypotheses were: incomplete interview instructions; insufficient field descriptions;
ambiguous access/trait guidance; insufficient result-reporting guidance. Inspecting
`HIRE_INSTRUCTIONS`, `HIRE_TOOLS` and `runHireTool` confirmed that the initialization instructions
were the only interview guidance, and even those did not address missing or ambiguous answers.
The checklist response and manifest did not deliver those instructions. The scorer validates
allowed and required values; it cannot determine whether a client invented otherwise valid values.

No glossary or ADR exists in this repository. The approved HIRE design and the upstream
framework glossary were consulted. The approved design explicitly keeps optional free text,
unchanged score weights and thresholds, and warnings rather than a STOP for fewer than three traits.

## Fix

Shared client instructions now reach initialization, the manifest and the checklist tool result
(including WebMCP). Tool and input descriptions reinforce the relevant guidance:

- Ask one question, wait, reuse explicit answers and clarify the next missing answer.
- Never fabricate scores, KPIs, estimates, reasoning traits or controls. Confirm proposed estimates
  before scoring them, distinguish a planned design from a verified live system, and leave unknowns incomplete.
- Respect STOP gates and the optional disclosure of job/KPI text and the R comparison table.
- Distinguish displaying a suggestion from creating/updating persisted drafts; human approval
  is separate from write access. Preserve the stated worst outcome and clarify its impact.
- Treat three reasoning traits as advisory, not mandatory.
- Call the scorer and relay its actual scores, verdict, reasons, flags, notes, interpretations and
  complete report link. A failed or unavailable tool is not a verified assessment.

This changes interview guidance, not scoring or validation. The server version is 1.0.1.

## Verification and limits

`node --import tsx --test tests/hire/tools.test.ts` exercises the real runtime and declared
output schema, including delivery of interview guidance. That regression was also run in a
temporary copy with the runtime and schema restored byte-for-byte from HEAD: it failed with
`actual: 'undefined', expected: 'string'`. It passes against the fix. The expense-agent characterization
uses hypothetical scores, explicitly not facts inferred from the user:

- Read-only: H 15 + I 15 + E 30 = 60, HIRE.
- Changing access alone to write: total 40, TRAIN.
- Omitting the Rule comparison: r3 is returned; providing it removes that flag.
- Omitting ROI and controls: validation rejects the incomplete input.

`npm run mcp:smoke` checks both HTTP servers and verifies that initialization matches the
published manifest and the checklist response carries interview guidance.
The full 93-test suite, production build, source/dist content verification and both-server
HTTP smoke checks passed. The HTTP feedback loop also confirmed server version 1.0.1.

There is no automated Gemini/consumer-model seam in this repository. These checks protect
delivery of the instructions, valid scoring and missing-input rejection. They do not establish
that an external model obeys the instructions. End-to-end acceptance requires a fresh interview
in that client, with a tool-call trace: it must wait for each answer, ask about missing scores,
clarify persisted draft writes, and relay the actual assessment with its report link.
