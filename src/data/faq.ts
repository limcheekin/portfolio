/**
 * Questions and answers shown on About, and its FAQPage JSON-LD (the schema repeats exactly what the page shows).
 * `path` is the page that covers the answer in more depth.
 */
export const FAQ: Array<{ question: string; answer: string; path: string }> = [
  {
    question: "What does Lim Chee Kin specialize in?",
    answer: "Lim Chee Kin specializes in enterprise AI and solution architecture. His current focus areas include conversational agents, multimodal document extraction, Retrieval-Augmented Generation (RAG), real-time voice AI, and integration with accounting and business platforms through role-restricted MCP tools.",
    path: '/about/',
  },
  {
    question: "What is RAG.WTF?",
    answer: "RAG.WTF is an open-source platform for private, personalized knowledge discovery and management using Retrieval-Augmented Generation (RAG) systems.",
    path: '/projects/rag-wtf/',
  },
  {
    question: "What is Project Concord?",
    answer: "Project Concord is a Model Context Protocol (MCP) server that connects modern AI agents with legacy database schemas.",
    path: '/projects/project-concord/',
  },
  {
    question: "How can I contact Lim Chee Kin?",
    answer: "You can reach Lim Chee Kin via email at limcheekin@vobject.com, through LinkedIn at linkedin.com/in/limcheekin, or via GitHub at github.com/limcheekin.",
    path: '/contact/',
  },
  {
    question: "What technologies does Lim Chee Kin work with?",
    answer: "Lim Chee Kin works with Python, TypeScript, Java, FastAPI, React and Next.js for application development. For AI, he uses the Claude Agent SDK, Google Gemini, the Model Context Protocol (MCP), Pipecat for voice, hybrid retrieval, and Ragas for LLM evaluation. His infrastructure stack includes Docker, Kubernetes, AWS, GCP/GKE, PostgreSQL/pgvector, MongoDB Atlas, and SurrealDB.",
    path: '/about/',
  },
  {
    question: "What is Lim Chee Kin's approach to data sovereignty and private AI?",
    answer: "Lim Chee Kin advocates for data ownership and privacy through self-hosted AI infrastructure. He runs local LLMs, embeddings, and STT/TTS services on dedicated hardware (OrangePi 5 Max with Docker and Coolify), and integrates embedded databases like SurrealDB.wasm for client-side data sovereignty.",
    path: '/about/',
  },
  {
    question: "What is open-text-embeddings?",
    answer: "open-text-embeddings is a Python library created by Lim Chee Kin that provides an OpenAI-compatible API for diverse open-source sentence transformer models such as BGE and E5. It enables significant cost reduction and eliminates vendor lock-in for text embedding generation in RAG and NLP applications.",
    path: '/projects/open-text-embeddings/',
  },
  {
    question: "Is Lim Chee Kin available for freelance or consulting work?",
    answer: "Lim Chee Kin is open to AI engineering consulting, solution architecture engagements, and collaborations on open-source AI projects. He is particularly interested in RAG systems, local LLM deployment, data sovereignty solutions, and AI agent infrastructure. Reach out via email at limcheekin@vobject.com or LinkedIn.",
    path: '/contact/',
  },
  {
    question: "What is Talk To AI?",
    answer: "Talk To AI is a real-time voice AI application built by Lim Chee Kin that achieves sub-300ms latency for voice interactions. It supports local and cloud-based speech-to-text (STT), large language model (LLM), and text-to-speech (TTS) services via FastRTC, enabling private, low-latency voice conversations with AI.",
    path: '/projects/talk-to-ai/',
  },
  {
    question: "What is Lim Chee Kin's career background?",
    answer: "Lim Chee Kin started his software career in 1999. He led enterprise Java teams at DXC Technology and Zurich Technology Services, delivered banking and healthcare systems, built 10+ open-source Grails plugins, worked as an independent Principal AI Architect from 2021 to 2025, and joined Daxonet AI as AI Solutions Architect in 2026.",
    path: '/about/#work-experience',
  },
];
