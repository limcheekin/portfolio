/** Each step's one-line intro, shown under its title in both modes. */
export const INTRO: Record<string, string> = {
  start: 'Name the agent and say whether it is already live. Your answers stay in this page and its link.',
  job: 'Go/no-go: if you cannot state the problem or define the job, stop here.',
  tool: 'Classify the task against the job you just wrote: rules, a chatbot or an agent.',
  worst: 'Go/no-go: a catastrophic worst case stops the assessment. The other cases carry into the E score.',
  metrics: 'What the agent has done since launch.',
  human: 'Will people trust and use it, and are the data and the plumbing ready? Each item scores 1 to 3.',
  impact: 'How often, how much time, what return, and what else it is worth.',
  exposure: 'What stops a mistake from doing damage.',
  result: 'The verdict, with the score from every answered item.',
};

export const PART: Record<number, string> = { 1: 'Part 1 · Should this exist?', 2: 'Live review', 3: 'Part 2 · How ready is it?' };
