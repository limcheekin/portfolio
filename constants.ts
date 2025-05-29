
import { NavLink, HeroContent, AboutContent, Project, Article, ExperienceItem } from './types'; // Simplified types needed for new design

export const ENGINEER_NAME = "Lim Chee Kin";
export const ENGINEER_TITLE = "Business & Technology Solutions Architect";
export const SITE_TITLE = `${ENGINEER_NAME} | ${ENGINEER_TITLE}`;
export const GITHUB_USERNAME = "limcheekin";
export const EMAIL_ADDRESS = "limcheekin@vobject.com";

export const NAV_LINKS: NavLink[] = [
  { name: "About", href: "#about" },
  { name: "Work", href: "#projects" }, 
  { name: "Insights", href: "#insights" },
  { name: "Contact", href: "#contact" },
];

export const SOCIAL_LINKS = [
    { name: "GitHub", url: `https://github.com/${GITHUB_USERNAME}`, iconName: "FiGithub" },
    { name: "LinkedIn", url: "https://linkedin.com/in/limcheekin", iconName: "FiLinkedin" },
    { name: "Medium", url: "https://medium.com/@limcheekin", iconName: "SiMedium" },
    // Add more social links if needed e.g. Twitter, Codepen
];

export const HERO_CONTENT: HeroContent = {
  greeting: "Hi, my name is",
  name: ENGINEER_NAME + ".",
  tagline: "I build things for the web.",
  introduction: `I'm a holistic software professional specializing in combines the understanding of business needs with technical implementation and design. My experience covers the entire software development lifecycle, from ideation and requirements to delivery, testing, and client interaction. Currently, I’m focused on building accessible, human-centered AI products for clients. My commitment is to "build better software faster for business", leveraging my leadership and expertise across business and technical domains.`,
  ctaButton: "Get In Touch",
};

export const WORK_EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: "exp1",
    period: "2018 - Present",
    jobTitle: "Lead Software Architect",
    company: "Future Systems Corp.",
    companyUrl: "https://example.com/futuresystems",
    descriptionPoints: [
      "Architected and led the development of a cloud-native SaaS platform serving over 10,000 enterprise clients, focusing on scalability and resilience.",
      "Pioneered the adoption of microservices architecture, improving deployment velocity by 40% and system modularity.",
      "Mentored a team of 15+ engineers, fostering a culture of innovation and continuous learning.",
      "Defined technology roadmaps and drove R&D initiatives in AI-driven analytics and serverless computing."
    ],
    skills: ["System Architecture", "Microservices", "Kubernetes", "AWS", "Go", "Python", "Leadership"]
  },
  {
    id: "exp2",
    period: "2012 - 2018",
    jobTitle: "Senior Full-Stack Engineer",
    company: "Innovatech Solutions",
    companyUrl: "https://example.com/innovatech",
    descriptionPoints: [
      "Developed and maintained critical features for a high-traffic e-commerce platform, handling millions of transactions daily.",
      "Led the frontend revamp using React and Redux, enhancing user experience and performance.",
      "Integrated third-party APIs for payment processing, shipping, and analytics.",
      "Championed Agile methodologies and Test-Driven Development practices within the team."
    ],
    skills: ["React", "Node.js", "TypeScript", "GraphQL", "MongoDB", "Java", "Spring Boot", "Agile"]
  },
  {
    id: "exp3",
    period: "2005 - 2012",
    jobTitle: "Software Engineer",
    company: "DataStream Dynamics",
    descriptionPoints: [
      "Contributed to the development of data processing pipelines and analytics tools for large-scale datasets.",
      "Worked on backend services using Java and Spring, optimizing for performance and reliability.",
      "Designed and implemented database schemas and queries for PostgreSQL and Oracle.",
      "Participated in the full software development lifecycle, from requirements gathering to deployment and support."
    ],
    skills: ["Java", "Spring Framework", "SQL", "PostgreSQL", "Oracle", "ETL", "Data Analysis"]
  },
  {
    id: "exp4",
    period: "2001 - 2005",
    jobTitle: "Junior Web Developer",
    company: "WebCraft Studios",
    descriptionPoints: [
      "Developed client websites using HTML, CSS, JavaScript, and PHP.",
      "Assisted senior developers in building and testing web applications.",
      "Gained foundational experience in version control systems and web server administration.",
      "Contributed to UI/UX design discussions and wireframing."
    ],
    skills: ["HTML", "CSS", "JavaScript", "PHP", "MySQL", "Apache"]
  },
  {
    id: "exp5",
    period: "1998 - 2001",
    jobTitle: "Web Development Intern",
    company: "Alpha Web Solutions",
    companyUrl: "https://example.com/alphaweb",
    descriptionPoints: [
      "Assisted in the design and development of early static websites for small businesses.",
      "Learned foundational HTML, CSS, and JavaScript under mentorship.",
      "Provided support for website updates and basic graphic design tasks.",
      "Gained initial exposure to client communication and project requirements."
    ],
    skills: ["HTML", "CSS", "JavaScript (Basic)", "Photoshop", "Client Interaction"]
  },
   {
    id: "exp6",
    period: "1996 - 1998",
    jobTitle: "Early Tech Enthusiast",
    company: "Personal Projects",
    descriptionPoints: [
      "Explored early web technologies and programming languages as a hobbyist.",
      "Built personal websites and small applications, fostering a foundational understanding of software development."
    ],
    skills: ["QBasic", "HTML", "Early JavaScript"]
  }
];


export const ABOUT_CONTENT: AboutContent = {
  introductionParagraphs: [
    `Hello! I'm ${ENGINEER_NAME}, a software engineer with a passion for creating elegant and efficient solutions. My journey in tech has been driven by a "Definite Chief Aim" to not just write code, but to build systems that solve real-world problems and deliver tangible value.`,
    `I thrive on "Accurate Thinking" and "Mastery of Detail", whether it's architecting complex backend systems or crafting intuitive user interfaces. I believe in the power of "Cooperation" and strive to foster "Master Mind" dynamics within teams.`,
    `My core values include Integrity, a commitment to "Going the Extra Mile", and a dedication to "Continuous Self-Improvement".`
  ],
  skills: ["TypeScript", "React", "Node.js", "Java", "Spring Boot", "AWS", "System Design"],
  professionalPhotoUrl: "https://picsum.photos/seed/profilefixed/400/400", // Use a good quality professional photo
  workExperience: WORK_EXPERIENCE_DATA, // Now references the expanded list
};

export const PROJECTS_DATA: Project[] = [
  {
    id: "proj1",
    title: "Project Phoenix: FinTech Platform",
    featured: true,
    overview: "A comprehensive financial reporting platform rebuilt from the ground up for scalability and performance. Leveraged microservices architecture and modern frontend technologies to deliver real-time analytics and reporting capabilities for GlobalBank Corp.",
    technologies: ["Java", "Spring Boot", "React", "TypeScript", "Kafka", "PostgreSQL", "AWS"],
    imageUrl: "https://picsum.photos/seed/project1fixed/700/450",
    liveDemoUrl: "#", 
    repoUrl: "#",
    category: "FinTech"
  },
  {
    id: "proj2",
    title: "AuraFlow: Analytics Dashboard",
    featured: true,
    overview: "Developed a cutting-edge real-time data visualization dashboard for Data Insights LLC, enabling clients to monitor marketing campaign performance with instant insights. Focused on intuitive UX and high-velocity data streams.",
    technologies: ["Vue.js", "Node.js", "WebSocket", "MongoDB", "D3.js", "Azure"],
    imageUrl: "https://picsum.photos/seed/project2fixed/700/450",
    liveDemoUrl: "https://example.com/auraflow-demo",
    repoUrl: "#",
    category: "Data Analytics"
  },
  {
    id: "proj4", // New project ID
    title: "NovaLearn: E-Learning Suite",
    featured: true, // Marked as featured
    overview: "Architected and developed a scalable e-learning platform for a major educational institution, featuring interactive courses, progress tracking, and certification modules. Ensured WCAG AA accessibility compliance.",
    technologies: ["Next.js", "TypeScript", "Strapi CMS", "PostgreSQL", "Vercel", "Accessibility"],
    imageUrl: "https://picsum.photos/seed/project4fixed/700/450", // New image seed
    liveDemoUrl: "https://example.com/novalearn-demo",
    repoUrl: "https://github.com/alexsterlingdev/novalearn",
    category: "EdTech"
  },
  {
    id: "proj3",
    title: "EcoTrack: Sustainability Initiative Platform",
    featured: false, 
    overview: "A web application designed to help organizations track and report their environmental impact metrics. Included features for data input, visualization, and automated report generation.",
    technologies: ["Python (Django)", "PostgreSQL", "Chart.js", "Heroku"],
    imageUrl: "https://picsum.photos/seed/project3fixed/700/450",
    repoUrl: "https://github.com/alexsterlingdev/ecotrack",
    category: "Sustainability"
  },
  // Add more non-featured projects
  {
    id: "proj5",
    title: "Community Connect App",
    featured: false,
    overview: "A mobile-first web app for local community engagement and event discovery.",
    technologies: ["React Native", "Firebase", "Expo"],
    imageUrl: "https://picsum.photos/seed/project5/700/450",
    liveDemoUrl: "#",
    repoUrl: "https://github.com/alexsterlingdev/community-connect",
    category: "Social"
  },
  {
    id: "proj6",
    title: "Personal Blog Engine",
    featured: false,
    overview: "A lightweight, markdown-based static site generator for a personal blog.",
    technologies: ["Node.js", "Markdown-it", "Handlebars"],
    imageUrl: "https://picsum.photos/seed/project6/700/450",
    repoUrl: "https://github.com/alexsterlingdev/my-blog-engine",
    category: "Tooling"
  },
  {
    id: "proj7",
    title: "Recipe Finder AI",
    featured: false,
    overview: "An AI-powered recipe suggestion tool based on available ingredients.",
    technologies: ["Python", "Flask", "Scikit-learn", "OpenAI API"],
    imageUrl: "https://picsum.photos/seed/project7/700/450",
    category: "AI/ML"
  },
  {
    id: "proj8",
    title: "Portfolio v1 (Legacy)",
    featured: false,
    overview: "My first portfolio website, built with vanilla HTML, CSS, and JavaScript.",
    technologies: ["HTML", "CSS", "JavaScript"],
    imageUrl: "https://picsum.photos/seed/project8/700/450",
    liveDemoUrl: "#",
    category: "Web Development"
  },
  {
    id: "proj9",
    title: "Task Management CLI",
    featured: false,
    overview: "A command-line interface tool for managing daily tasks and to-do lists.",
    technologies: ["Go", "Cobra"],
    imageUrl: "https://picsum.photos/seed/project9/700/450",
    repoUrl: "https://github.com/alexsterlingdev/task-cli",
    category: "Productivity"
  },
  {
    id: "proj10",
    title: "Weather Widget UI",
    featured: false,
    overview: "A sleek user interface for a weather forecasting widget.",
    technologies: ["Svelte", "Tailwind CSS", "OpenWeatherMap API"],
    imageUrl: "https://picsum.photos/seed/project10/700/450",
    category: "UI/UX"
  },
   {
    id: "proj11",
    title: "Data Scraper Utility",
    featured: false,
    overview: "A utility for scraping and organizing data from various web sources.",
    technologies: ["Python", "Beautiful Soup", "Pandas"],
    imageUrl: "https://picsum.photos/seed/project11/700/450",
    category: "Data"
  }
];

export const ARTICLES_DATA: Article[] = [
  {
    id: "art1",
    title: "The Art of 'Accurate Thinking' in Software Architecture",
    summary: "An exploration of how precise problem definition and logical reasoning lead to robust and scalable software designs.",
    type: "Article",
    platform: "Medium",
    url: "https://medium.com/your-article-link",
    tags: ["Software Architecture", "Problem Solving"], 
    imageUrl: "https://picsum.photos/seed/article1/400/200" 
  },
  {
    id: "art2",
    title: "Fostering 'Cooperation' in Distributed Engineering Teams",
    summary: "A talk discussing strategies for building cohesive and effective remote teams.",
    type: "Talk",
    platform: "Tech Conference X",
    url: "#",
    tags: ["Team Dynamics", "Remote Work", "Leadership"],
    imageUrl: "https://picsum.photos/seed/article2/400/200"
  },
  {
    id: "art3",
    title: "Going the Extra Mile: Beyond the 9-to-5 Developer Mindset",
    summary: "Discussing the importance of dedication and proactive contribution in a software engineering career.",
    type: "Article",
    platform: "Dev.to",
    url: "#",
    tags: ["Career Growth", "Professionalism", "Mindset"],
    imageUrl: "https://picsum.photos/seed/article3/400/200"
  },
  {
    id: "art4",
    title: "The Power of 'Specialized Knowledge' in Niche Technologies",
    summary: "How deep expertise in specific areas can unlock unique opportunities and innovation.",
    type: "Article",
    platform: "Personal Blog",
    url: "#",
    tags: ["Expertise", "Technology Trends", "Learning"],
    imageUrl: "https://picsum.photos/seed/article4/400/200"
  },
  {
    id: "art5",
    title: "Master Mind Alliances: Collaborating for Exponential Growth",
    summary: "A reflection on how synergistic partnerships can accelerate learning and project success.",
    type: "Slides",
    platform: "Internal Tech Talk",
    url: "#",
    tags: ["Collaboration", "Networking", "Growth"],
    imageUrl: "https://picsum.photos/seed/article5/400/200"
  }
];


export const CONTACT_CONTENT = {
  title: "What's Next?",
  subtext: "Get In Touch",
  paragraph: `Although I’m not currently looking for new opportunities, my inbox is always open. Whether you have a question, want to collaborate, or just want to say hi, I’ll try my best to get back to you! This reflects my "Pleasing Personality" and openness to "Cooperation".`,
  buttonText: "Say Hello",
};


export const FOOTER_TEXT = `Designed & Built by ${ENGINEER_NAME}. Inspired by Brittany Chiang.`;
