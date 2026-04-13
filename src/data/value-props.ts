export interface ValueProp {
  target: string;
  benefit: string;
  negative: string;
}

export const VALUE_PROPS: ValueProp[] = [
  {
    target: "privacy-conscious enterprises",
    benefit: "deploy local LLMs for trustworthy knowledge discovery",
    negative: "exposing sensitive data to third-party"
  },
  {
    target: "businesses",
    benefit: "implement Retrieval-Augmented Generation (RAG) systems that provide accurate, contextual answers",
    negative: "hallucinations"
  },
  {
    target: "product teams",
    benefit: "add voice-first, low-latency AI interactions to web apps",
    negative: "ballooning infrastructure costs"
  },
  {
    target: "organizations",
    benefit: "run resilient hybrid AI (local + cloud) workloads at scale",
    negative: "sacrificing data sovereignty"
  },
  {
    target: "engineering leaders",
    benefit: "integrate legacy databases with AI agents to unlock enterprise knowledge",
    negative: "costly, risky migrations"
  },
  {
    target: "engineering leaders",
    benefit: "build high-performing multinational development teams",
    negative: "cultural friction"
  },
];
