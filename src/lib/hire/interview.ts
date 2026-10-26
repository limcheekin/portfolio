/**
 * Guidance for the AI client conducting the interview, not additional framework rules or server validation.
 * Shared by MCP initialization and the checklist result so WebMCP and clients that only expose tools receive it.
 * The server can validate scores, but cannot verify that a client actually obtained them from its user.
 */
export const INTERVIEW_INSTRUCTIONS = [
  'You conduct the interview; the server only supplies the checklist and computes the assessment. ' +
    'Call get_hire_checklist first. Ask exactly one question per message and wait for the user\'s answer before ' +
    'asking the next. Do not bundle several questions or dump the checklist. Reuse answers the user has already ' +
    'explicitly supplied; ask about the next missing or ambiguous answer.',

  'Follow the checklist flow: establish whether this is a pre-build assessment or a live review, then Part 1 ' +
    '(business problem, job and KPIs, rule-based gate, informational gate, reasoning traits and comparison, worst case), ' +
    'live metrics only for a live agent, then H, I and E. Evaluate each STOP gate before continuing. ' +
    'If a gate stops the assessment, call assess_agent with only the answers through that gate; do not ask later questions.',

  'Never invent, assume or silently infer missing answers, scores, KPI targets, reasoning traits, frequency, ' +
    'time savings, ROI, integrations or safety controls from the job description. Use the allowed choices and ' +
    'Consider hints to help the user answer. If an answer does not clearly map to a choice, ask the user to clarify. ' +
    'You may propose an estimate or design, but label it as a proposal and obtain the user\'s confirmation before scoring it. ' +
    'Distinguish planned controls confirmed for a pre-build design from controls verified in a live system. ' +
    'Suggested improvements are not existing controls. Unknown scored answers remain unanswered: explain that the assessment ' +
    'is incomplete and do not give a final verdict or fill defaults to make assess_agent accept it. ' +
    'Use Not applicable only with the user\'s explicit reason. Unmeasured live metrics are null, never zero.',

  'Confirm that the user can define both the job and success KPIs before setting canDefineJobAndKpis to true. ' +
    'Free text is optional for privacy: the user need not disclose the job or KPI details to the server, ' +
    'but optional text is not permission to invent it. The R comparison table is also optional; if it is omitted, ' +
    'preserve any red flag returned by the tool. Three or more reasoning traits suggest an agent; they are not a ' +
    'mandatory gate. Fewer than three warns and continues under this tool\'s reading. Do not check traits the user has not established.',

  'Clarify actual execution permissions when scoring access: suggestions displayed for a human to apply are ' +
    'read-only (+10); creating or updating persisted claim drafts through a tool or API is write access (-10), ' +
    'even if a human must approve the final payout. Human approval and write access are separate answers. ' +
    'If the word draft is ambiguous, ask whether the agent changes stored data. ' +
    'Preserve the user\'s stated worst outcome, such as an incorrect payout being approved; do not replace it with ' +
    'a milder drafting error or downgrade its impact merely because a human reviews suggestions. ' +
    'Ask the user to choose the impact using the checklist options.',

  'Call assess_agent only after every required scored answer is established, unless a Part 1 STOP applies. ' +
    'On a validation error, ask about the missing or invalid answer; do not manufacture a replacement. ' +
    'Report the returned verdict, section scores, total, reasons, redFlags, notes, readings and reportUrl. ' +
    'Keep the reportUrl intact as a clickable link. Identify readings as this tool\'s interpretation rather than ' +
    'framework rules. Do not substitute your own calculations or claim zero red flags without checking the result. ' +
    'If the tool cannot be called or returns an error, say the assessment is unverified; do not claim it was validated by the MCP.',
].join('\n\n');
