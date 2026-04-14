export const ENGINEER_NAME = "Lim Chee Kin";
export const ENGINEER_TITLE = "Senior Tech Lead, AI Engineer, and Solution Architect";
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
  { name: "Insights", href: "/insights/" },
  { name: "Contact", href: "/contact/" },
];

export const SCROLL_NAV_LINKS: NavLink[] = [
  { name: "About", href: "#about" },
  { name: "Work", href: "#projects" },
  { name: "Insights", href: "#insights" },
  { name: "Contact", href: "#contact" },
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
  introduction: `I'm a ${ENGINEER_TITLE} with over 25 years of experience, currently focusing intensively on AI engineering.`,
  ctaButton: "Get In Touch",
};

export const ABOUT_CONTENT = {
  introductionParagraphs: [
    `Hello! I'm ${ENGINEER_NAME}, a ${ENGINEER_TITLE} with a deep passion for AI engineering. I bring over 25 years of experience delivering advance software solutions by aligning business needs with technical design and implementation.`,
    `My expertise lies in architecting and implementing open-source AI, local AI infrastructure, and data sovereignty solutions, particularly for mobile-first web applications. I'm dedicated to building and leading teams to innovate with privacy-preserving and democratized AI.`,
    `I am committed to standardizing processes, driving innovation in the AI space, and continuously exploring new frontiers in technology.`,
  ],
  skills: ["AI Engineering", "RAG Systems", "LLM Integration", "Python", "Java", "Gemini API", "Docker", "AWS"],
  professionalPhotoUrl: "/images/profile.png",
};

export const CONTACT_CONTENT = {
  title: "What's Next?",
  subtext: "Get In Touch",
  paragraph: `My inbox is always open for AI discussions, collaborations, or just to connect. Whether you have a question about RAG, local AI, open-source initiatives, or AI engineering in general, I'll do my best to get back to you!`,
  buttonText: "Say Hello",
};

export const FOOTER_TEXT = `Designed & Built by ${ENGINEER_NAME}. Inspired by Brittany Chiang.`;
