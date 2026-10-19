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
  eyebrow: `${ENGINEER_NAME} · ${ENGINEER_TITLE}`,
  headline: { before: 'I build AI agents that do ', accent: 'real work', after: ' inside business systems.' },
  sub: 'From a WhatsApp message to a posted sales order, with a human in the loop.',
  primaryCta: { label: 'Get in touch', href: '/contact/' },
  resumeCta: { label: 'Résumé ↗', href: '/resume.pdf' },
};

export const CONTACT_CTA = {
  eyebrow: '04 · Contact',
  headline: { before: 'Have a workflow that should ', accent: 'run itself?' },
  paragraph: 'I design and ship AI agents that plug into the systems you already run. Tell me about yours.',
  button: { label: 'Get in touch', href: '/contact/' },
};

export const ABOUT_CONTENT = {
  introductionParagraphs: [
    `I'm ${ENGINEER_NAME}, an ${ENGINEER_TITLE} at Daxonet AI in Kuala Lumpur. I design and ship enterprise AI: conversational agents, document extraction, human approvals, and integration with accounting and business platforms.`,
    "My work spans retrieval-augmented generation (RAG), real-time voice systems, cloud operations and distributed teams, built in Python and TypeScript. Before AI, I led enterprise Java teams across China, Europe and Malaysia, and delivered banking and healthcare systems.",
    "I care about AI that does real work safely: role-restricted agent tools, explicit confirmation before writes, and private, self-hosted models where data sovereignty matters.",
  ],
  skills: ["Agentic AI & MCP", "RAG & LLM Evaluation", "Voice AI (Pipecat)", "Python & FastAPI", "TypeScript & React", "Claude Agent SDK & Gemini", "Docker & Kubernetes", "GCP & AWS"],
  professionalPhotoUrl: "/images/profile.png",
};

export const CONTACT_CONTENT = {
  title: "Let's talk about your workflow",
  success: "Thank you for your message! I'll get back to you as soon as possible.",
  paragraph: "I design and ship AI agents that plug into the systems you already run, from expense claims to trade documents and warehouse operations. Tell me what you'd like to automate, or ask about consulting and open-source collaboration, and I'll get back to you.",
  buttonText: "Email me",
};

/** Social profiles plus email, listed in the footer and the home Contact section. */
export const CONTACT_LINKS = [
  ...SOCIAL_LINKS.map(({ name, url }) => ({ name, url, external: true })),
  { name: 'Email', url: `mailto:${EMAIL_ADDRESS}`, external: false },
];

export const FOOTER_TEXT = `© ${new Date().getFullYear()} ${ENGINEER_NAME} · Kuala Lumpur, Malaysia`;
