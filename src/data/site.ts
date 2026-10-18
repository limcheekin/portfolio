export const ENGINEER_NAME = "Lim Chee Kin";
export const ENGINEER_TITLE = "AI Solutions Architect";
export const SITE_TITLE = `${ENGINEER_NAME} | ${ENGINEER_TITLE}`;
export const GITHUB_USERNAME = "limcheekin";
export const EMAIL_ADDRESS = "limcheekin@vobject.com";
export const SITE_URL = "https://kin.rag.wtf";

export interface NavLink {
  name: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { name: "About", href: "/about/" },
  { name: "Work", href: "/projects/" },
  { name: "Writing", href: "/insights/" },
  { name: "Contact", href: "/contact/" },
];

export interface ContactLink {
  name: string;
  url: string;
  iconName: string;
}

export const SOCIAL_LINKS: ContactLink[] = [
  { name: "GitHub", url: `https://github.com/${GITHUB_USERNAME}`, iconName: "FiGithub" },
  { name: "LinkedIn", url: "https://linkedin.com/in/limcheekin", iconName: "FiLinkedin" },
  { name: "Medium", url: "https://medium.com/@limcheekin", iconName: "SiMedium" },
];

export const HERO_CONTENT = {
  greeting: "Hi, my name is",
  name: ENGINEER_NAME + ".",
  tagline: "AI Engineer & Solution Architect.",
  ctaButton: "Get In Touch",
};

export const ABOUT_CONTENT = {
  introductionParagraphs: [
    "I'm Lim Chee Kin, an AI Solutions Architect at Daxonet AI in Kuala Lumpur. I design and ship enterprise AI: conversational agents, document extraction, human approvals, and integration with accounting and business platforms.",
    "My work spans retrieval-augmented generation (RAG), real-time voice systems, cloud operations and distributed teams, built in Python and TypeScript. Before AI, I led enterprise Java teams across China, Europe and Malaysia, and delivered banking and healthcare systems.",
    "I care about AI that does real work safely: role-restricted agent tools, explicit confirmation before writes, and private, self-hosted models where data sovereignty matters.",
  ],
  skills: ["Agentic AI & MCP", "RAG & LLM Evaluation", "Voice AI (Pipecat)", "Python & FastAPI", "TypeScript & React", "Claude Agent SDK & Gemini", "Docker & Kubernetes", "GCP & AWS"],
  professionalPhotoUrl: "/images/profile.png",
};

export const CONTACT_CONTENT = {
  title: "What's Next?",
  subtext: "Get In Touch",
  paragraph: `My inbox is always open for AI discussions, collaborations, or just to connect. Whether you have a question about RAG, local AI, open-source initiatives, or AI engineering in general, I'll do my best to get back to you!`,
  buttonText: "Say Hello",
};

export const FOOTER_TEXT = `© ${new Date().getFullYear()} ${ENGINEER_NAME} · Kuala Lumpur, Malaysia`;
