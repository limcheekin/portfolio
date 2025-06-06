
import { NavLink, HeroContent, AboutContent, Project, Article, ContactLink, ExperienceItem } from './types';

export const ENGINEER_NAME = "Lim Chee Kin";
export const ENGINEER_TITLE = "Senior Tech Lead, AI Engineer, and Solution Architect";
export const SITE_TITLE = `${ENGINEER_NAME} | ${ENGINEER_TITLE}`;
export const GITHUB_USERNAME = "limcheekin";
export const EMAIL_ADDRESS = "limcheekin@vobject.com";

export const NAV_LINKS: NavLink[] = [
  { name: "About", href: "#about" },
  { name: "Work", href: "#projects" },
  { name: "Insights", href: "#insights" },
  { name: "Contact", href: "#contact" },
];

export const SOCIAL_LINKS: ContactLink[] = [
    { name: "GitHub", url: `https://github.com/${GITHUB_USERNAME}`, iconName: "FiGithub" },
    { name: "LinkedIn", url: "https://linkedin.com/in/limcheekin", iconName: "FiLinkedin" },
    { name: "Medium", url: "https://medium.com/@limcheekin", iconName: "SiMedium" },
];

export const HERO_CONTENT: HeroContent = {
  greeting: "Hi, my name is",
  name: ENGINEER_NAME + ".",
  tagline: "AI Engineer & Solution Architect.",
  introduction: `I'm a ${ENGINEER_TITLE} with over 25 years of experience, currently focusing intensively on AI engineering. I specialize in building and leading multinational teams to deliver complex software solutions, architecting open-source AI, local AI infrastructure, and data sovereignty solutions, particularly for mobile-first web applications. I am committed to standardizing processes and driving innovation through privacy-preserving and democratized AI.`,
  ctaButton: "Get In Touch",
};

export const WORK_EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: "exp1",
    period: "2021 - Present",
    jobTitle: "Founder, AI Engineer & Solution Architect",
    company: "RAG.WTF & AI Initiatives",
    companyUrl: "https://rag.wtf",
    descriptionPoints: [
      "Championed and developed open-source AI solutions focusing on data ownership, privacy, and efficient local AI processing; architecting and building RAG.WTF (to be open-sourced) as a platform for secure, personalized knowledge discovery and management.",
      "Engineered 'open-text-embeddings', a Python library providing an OpenAI-compatible API for diverse open-source sentence transformer models, enabling significant cost reduction and eliminating vendor lock-in.",
      "Developed 'Talk To AI' application, integrating HuggingFace's FastRTC for low-latency real-time voice AI interactions; engineered a flexible backend supporting local and cloud-based STT, LLM, and TTS APIs.",
      "Pioneered and operationalized a self-hosted AI infrastructure (Coolify, Docker), running multiple local LLMs (Llama 3.2, DeepSeek-R1, etc.) and STT/TTS for data privacy and operational control.",
      "Advocated for and implemented robust data sovereignty by integrating embedded database solutions like SurrealDB.wasm with RAG.WTF.",
      "Strategically utilized Modal.com for scalable, serverless AI/ML workloads, complementing local AI capabilities.",
      "Previously initiated Talking Book YouTube channel (AI-powered summaries and Telegram bot) and Fluwix (Flutter showcases)."
    ],
    skills: ["Open-Source AI", "RAG", "Python", "Text Embeddings", "FastRTC", "Docker", "Local LLMs", "SurrealDB.wasm", "Modal.com", "FastAPI", "Flutter", "Voice AI", "Solution Architecture"]
  },
  {
    id: "exp2",
    period: "2013 - 2020",
    jobTitle: "Senior Java Tech Lead",
    company: "DXC Technology",
    companyUrl: "https://dxc.com/my/en",
    descriptionPoints: [
      "Led a 6-developer international team (China, Europe, Malaysia) to deliver the Analytic Console for the Agile Process Automation (APA) platform (VueJS, Spring Boot, GoLang, MongoDB, AWS), contributing millions to company revenue.",
      "Headed a 5-developer international team (US, Malaysia) to create the EPIC Configurator for internal Enterprise Invoice Processing (JQuery UI, Grails Framework, Oracle DB), significantly streamlining configuration processes.",
      "Implemented a Divestiture and Acquisition (DnA) dashboard (AngularJS, Jersey, Spring, MongoDB, AWS) for critical real-time data insights supporting strategic executive decision-making.",
      "Prototyped an Intelligent Voice Agent (Conversational AI) leveraging Amazon Connect, AWS Lambda, Amazon Lex, Dialogflow, and Micronaut Framework."
    ],
    skills: ["Java", "Spring Boot", "VueJS", "GoLang", "MongoDB", "AWS", "JQuery UI", "Grails Framework", "Oracle DB", "AngularJS", "Micronaut", "Conversational AI", "Team Leadership"]
  },
  {
    id: "exp3",
    period: "2012 - 2013",
    jobTitle: "Senior Java Tech Lead",
    company: "Zurich Technology Services Malaysia",
    companyUrl: "https://www.zurich.com.my/",
    descriptionPoints: [
      "Led a 5-member production support and development team for motor and property claims systems (IBM WebSphere, FileNet, DB2, Spring, GWT, Hibernate/JPA).",
      "Resolved over 60 critical production issues within weeks, dramatically improving system stability and user satisfaction."
    ],
    skills: ["Java", "IBM WebSphere", "FileNet", "DB2", "Spring", "GWT", "Hibernate/JPA", "Production Support", "Team Leadership"]
  },
  {
    id: "exp4",
    period: "2010 - 2012",
    jobTitle: "Independent Software Professional",
    company: "Self-Employed",
    descriptionPoints: [
      "Developed and maintained impactful open-source Grails Framework projects, including BPM workflow, form builder, and validation components.",
      "Grails Activiti Plugin: BPM workflow system; grew the forum to 100+ members, addressed 100+ queries.",
      "Grails Form Builder Plugin: Empowered non-programmers to create online forms.",
      "JQuery Validation UI Plugin: Enhanced developer productivity with client-side validation.",
      "Explore all 10+ projects at limcheekin.blogspot.com/p/my-grails-plugins.html."
    ],
    skills: ["Grails Framework", "Activiti BPM", "JQuery", "Open Source Development", "Plugin Development", "Groovy", "Java"]
  },
  {
    id: "exp5",
    period: "April 2008 - July 2010",
    jobTitle: "Senior Solution Consultant",
    company: "Penril Datability (M) Sdn. Bhd.",
    companyUrl: "https://penril.net/",
    descriptionPoints: [
      "Led the successful tender for a RM6 million Internet Banking System (IBS) for Kuwait Finance House (KFH).",
      "Designed and proposed comprehensive IBS solutions, covering 24x7 web layers, external integrations (Payment Gateway, SMS, Email), application platform, 2-Factor Authentication (2FA), Enterprise Service Bus (ESB) for backend integration, and High-Availability infrastructure.",
      "Led a 3-member team to develop KFH's information website using BroadVision 8.1 Business Agility Suites and Oracle 10g, including JSR168 compliant portlets like Prayer Times and Currency Converter.",
      "Secured a RM2 million eCustody System tender from Malayan Banking Berhad.",
      "Provided pre-sales support, product demonstrations, solution consultation, and Proof-Of-Concepts (POCs) to major financial and corporate clients (e.g., Maybank, BSN, BNM, Agrobank, ING, Bank Islam)."
    ],
    skills: ["Solution Consulting", "Tender Management", "Banking Systems", "Solution Architecture", "BroadVision", "Oracle 10g", "JSR168 Portlets", "BPMN", "Requirements Analysis", "Pre-Sales", "Team Leadership"]
  },
  {
    id: "exp6",
    period: "April 2005 - Dec 2007",
    jobTitle: "Technical Lead",
    company: "CMG Online Sdn. Bhd.",
    companyUrl: "https://www.cmg.com.my/",
    descriptionPoints: [
      "Led an 8-member international team (China, India, Malaysia) to deliver a RM2 million Integrated Hospital Inventory System (IHIS4) for government hospitals, using AIX UNIX, JBoss 4.0, Oracle 10g, J2EE, Struts, and JasperReports.",
      "Drove Quality Management Systems (QMS): introduced a Standard Development Environment (Eclipse, Subversion, JUnit, Ant), improving team productivity by 20%.",
      "Actively participated in the CMMI Committee to define and implement CMMI Level 3 compliant organizational standards and processes.",
      "Architected and developed a common technical foundation for the Integrated Hospital Information Systems (IHIS5) on AppFuse (J2EE, Spring Framework, Hibernate, JUnit, JMock), including reusable logging and auditing modules with Spring AOP."
    ],
    skills: ["Technical Leadership", "J2EE", "JBoss", "Oracle 10g", "Struts", "JasperReports", "Spring Framework", "Hibernate", "Spring AOP", "AppFuse", "CMMI Level 3", "QMS", "SDLC", "Team Management"]
  },
  {
    id: "exp7",
    period: "May 2004 - March 2005",
    jobTitle: "Founder and Senior Consultant",
    company: "Media Trend",
    descriptionPoints: [
      "As Founder, led a startup providing web design, website development, web application development, and printing services.",
      "Designed and developed websites for clients including Bright Pancar Enterprise and Marklon Industries Sdn. Bhd.",
      "Provided printing services (name cards, brochures, cash sales receipts) for various companies."
    ],
    skills: ["Entrepreneurship", "Web Design", "Web Development", "Client Management", "Software Consulting"]
  },
  {
    id: "exp8",
    period: "October 2002 - April 2004",
    jobTitle: "Software Engineer",
    company: "Siemens Multimedia Sdn. Bhd.",
    companyUrl: "https://www.siemens.com/my/en.html",
    descriptionPoints: [
      "Developed the core Voice4Info Portal (News Delivery over Phone), including Call Control Components using Java IDL, CORBA, Parlay API, and VoiceXML, collaborating with German colleagues on the Siemens Next Generation Network (NGN) platform.",
      "Engineered iTalk, a Unified Phone Conferencing system with instant messaging-like features (presence, contact list, buddy list management).",
      "Supervised and coordinated 4 groups of Multimedia University (MMU) final year students on IP telephony projects, ensuring functional prototypes for the Siemens NGN platform."
    ],
    skills: ["Java", "J2EE", "CORBA", "Parlay API", "VoiceXML", "Telephony Systems", "Siemens NGN", "Software Development", "Mentorship"]
  },
  {
    id: "exp9",
    period: "August 2001 - September 2002",
    jobTitle: "System Engineer (Web Application Development)",
    company: "Online One Corporation Berhad",
    companyUrl: "http://greenoceancorp.com/bizsegments.html",
    descriptionPoints: [
      "Successfully deployed E-Treasury Management Systems to Hitachi Asia Ltd (Singapore) within 2 months, contributing RM1 million in revenue.",
      "Developed Fund Transfer, Bank Reconciliation, and General Ledger modules for the E-Treasury system using Cold Fusion, HTML, JavaScript, JavaBean, JDBC, and Oracle 8i.",
      "Engineered Business-to-Business (B2B) integration of National Panasonic of Malaysia's purchasing system using Active Server Page (ASP), SOAP, XML, IIS Web Server, and Oracle 8i."
    ],
    skills: ["Web Application Development", "Cold Fusion", "Oracle 8i", "ASP", "SOAP", "XML", "HTML", "JavaScript", "JDBC", "System Integration"]
  },
  {
    id: "exp10",
    period: "June 1999 - May 2000",
    jobTitle: "System Engineer",
    company: "Tee Yam Holding Sdn. Bhd.",
    descriptionPoints: [
      "Individually designed and developed a comprehensive Touch Screen based Point Of Sale (POS) system, Inventory Control System, and Customer Contact Management system using Visual Basic 6.0, ADO, COM, ActiveX Control, and Microsoft SQL Server 7.0.",
      "Developed multimedia game systems, including a Horse Racing Game and Roulette Game, using Visual Basic 6.0, DirectX 7.0 SDK, ADO, and Microsoft Access 97."
    ],
    skills: ["Visual Basic 6.0", "MS SQL Server 7.0", "ADO", "COM", "ActiveX", "DirectX SDK", "POS Systems Development", "Inventory Control Systems", "Game Development"]
  }
];

export const ABOUT_CONTENT: AboutContent = {
  introductionParagraphs: [
    `Hello! I'm ${ENGINEER_NAME}, a ${ENGINEER_TITLE} with a deep passion for AI engineering. I bring over 25 years of experience delivering advance software solutions by aligning business needs with technical design and implementation.`,
    `My expertise lies in architecting and implementing open-source AI, local AI infrastructure, and data sovereignty solutions, particularly for mobile-first web applications. I'm dedicated to building and leading teams to innovate with privacy-preserving and democratized AI.`,
    `I am committed to standardizing processes, driving innovation in the AI space, and continuously exploring new frontiers in technology.`
  ],
  skills: ["AI Engineering", "RAG Systems", "LLM Integration", "Python", "Java", "Gemini API", "Docker", "AWS"],
  professionalPhotoUrl: "images/profile.png",
  workExperience: WORK_EXPERIENCE_DATA,
};

export const PROJECTS_DATA: Project[] = [
  {
    id: "proj1",
    title: "RAG.WTF: Private Knowledge Platform",
    featured: true,
    overview: "Architected and built RAG.WTF, an open-source platform for private, personalized knowledge discovery and management. Focuses on data ownership, privacy, and efficient local AI processing, integrating SurrealDB.wasm for data sovereignty.",
    technologies: ["Open Source", "RAG", "Data Privacy", "Local AI", "Cloud AI", "surrealdb.wasm", "Flutter", "Dart"],
    imageUrl: "images/rag-wtf.png",
    repoUrl: "https://github.com/rag-wtf", 
    category: "RAG"
  },
  {
    id: "proj2",
    title: "TelegramGPT: AI Telegram Bot",
    featured: true,
    overview: "A Telegram bot powered by Google Gemini's API (Vertex AI / Google AI Studio). This bot leverages PostgreSQL for persistent conversation history and can integrate with self-hosted Speech-to-Text (STT) and Text-to-Speech (TTS) services.",
    technologies: ["Open Source", "Telegram Bot", "Local AI", "Cloud AI", "Python", "Gemini API", "PostgreSQL", "TTS", "STT"],
    imageUrl: "images/telegram-bot.png",
    repoUrl: `https://github.com/${GITHUB_USERNAME}/TelegramGPT`,
    liveDemoUrl: "https://t.me/think_and_grow_rich_bot",
    category: "RAG"
  },  
  {
    id: "proj3",
    title: "open-text-embeddings Python Library",
    featured: true,
    overview: "Engineered 'open-text-embeddings', a Python library providing an OpenAI-compatible API for diverse open-source sentence transformer models (e.g., BGE, E5). Enables significant cost reduction and eliminates vendor lock-in for embedding generation.",
    technologies: ["Open Source", "Python", "Text Embeddings", "Sentence Transformers", "OpenAI-compatible API", "NLP"],
    imageUrl: "images/open-text-embeddings.png",
    repoUrl: `https://github.com/${GITHUB_USERNAME}/open-text-embeddings`, 
    liveDemoUrl: "https://pypi.org/project/open-text-embeddings/",
    category: "AI Library"
  },
  {
    id: "proj4",
    title: "Talk To AI: Real-time Voice AI",
    featured: true,
    overview: "Developed 'Talk To AI', an application integrating HuggingFace's FastRTC for low-latency (<300ms) real-time voice AI interactions. Features a flexible backend supporting local (LocalAI, Whisper.cpp, Llama.cpp) and cloud-based STT, LLM, and TTS APIs (Groq, Microsoft Edge).",
    technologies: ["Open Source", "Voice AI", "FastRTC", "HuggingFace", "STT", "LLM", "TTS", "LocalAI", "Groq API", "Python", "FastAPI"],
    imageUrl: "images/talk-to-ai.png",
    repoUrl: `https://github.com/${GITHUB_USERNAME}/talk-to-ai`,
    category: "Voice AI"
  },
  {
    id: "proj5",
    title: "Talking Book",
    featured: false,
    overview: "Launched the Talking Book YouTube channel, focus primarily on insightful non-fiction, business, and self-improvement books, transforming key concepts into accessible and engaging formats such as engaging conversations, summaries, songs, and AI chats.",
    technologies: ["Python", "Podcastfy", "LocalAI", "Kokoro-FASTAPI", "Google Slides"],
    imageUrl: "https://picsum.photos/seed/grailsactiviti/700/450",
    repoUrl: "https://github.com/limcheekin/talking-book",
    liveDemoUrl: "https://limcheekin.github.io/talking-book/",
    category: "AI Content Generation"
  },
  {
    id: "proj6",  
    title: "Self-Hosted AI Infrastructure",
    featured: false,
    overview: "Pioneered and operationalized a self-hosted AI infrastructure using a dedicated local AI server (Coolify, Docker, OrangePi 5 Max). Successfully runs multiple local LLMs (Llama 3.2, DeepSeek-R1, Qwen3, etc.), embeddings, reranking, and STT/TTS services for complete data privacy and operational control.",
    technologies: ["Docker", "Coolify", "LocalAI", "Self-Hosting", "AI Infrastructure", "Open LLMs", "Open WebUI"],
    imageUrl: "https://picsum.photos/seed/selfhostai/700/450",
    category: "AI Infrastructure"
  },
  {
    id: "proj7",
    title: "Fluwix: Flutter Showcases",
    featured: false,
    overview: "A project dedicated to showcasing various Flutter applications and exploring mobile development capabilities with the Flutter framework.",
    technologies: ["Open Source", "Flutter", "Dart", "Mobile Development", "Web Development", "UI/UX"],
    imageUrl: "https://picsum.photos/seed/apaconsole/700/450",
    repoUrl: "https://github.com/limcheekin/fluwix",
    liveDemoUrl: "https://fluwix.com/",    
    category: "Web and Mobile Platform"
  }
];

export const ARTICLES_DATA: Article[] = [
  {
    id: "art1",
    title: "Talking Book: Making Books Less Boring",
    summary: "I created Talking Book to make reading more engaging and accessible, especially for my 9-year-old son with dyslexia. The platform offers quick summaries, chapter deep dives, and even catchy songs to help key concepts stick. We've also launched an AI chatbot on Telegram that lets you interact with books directly, making it easier to understand and remember their content.",  
    type: "Article", 
    platform: "YouTube, Telegram",
    url: "https://medium.com/@limcheekin/introducing-talking-book-487f6e3bc2c2",
    tags: ["AI", "Content Generation", "YouTube", "Telegram Bot", "NLP"],
    imageUrl: "https://picsum.photos/seed/talkingbook/400/200"
  },
  {
    id: "art2",
    title: "Beyond the Cloud: How I Built My Own AI Server (and Why)",
    summary: " I built my own AI server using an Orange Pi 5 Max, Ubuntu 24.04, Docker, and LocalAI, enabling me to run various open-source models like Llama 3.2 and Phi-3.5 locally. This setup not only grants me privacy and control over my digital interactions but also lays the foundation for creating a digital twin that truly understands and mirrors my thought processes.",
    type: "Article",
    platform: "OrangePi 5 Max, LocalAI",
    url: "https://medium.com/@limcheekin/beyond-the-cloud-how-i-built-my-own-ai-server-and-why-68b7235117f3", 
    tags: ["Local AI", "Private AI", "Self Hosted AI", "DIY AI"],
    imageUrl: "https://picsum.photos/seed/fluwix/400/200"
  },  
  {
    id: "art3",
    title: "Would you pay $1/month to Own Your AI Data?",
    summary: "In the article, I argue that our AI conversations—filled with ideas, solutions, and creativity—are valuable assets that shouldn't be surrendered to Big Tech without control or ownership. To address this, I've set up a secure, personal Open WebUI instance that, for $1/month, offers users complete data sovereignty, access to a curated library of over 200 expert prompts, and the flexibility to connect preferred AI models using personal API keys. This initiative empowers individuals to reclaim their AI data, ensuring privacy, control, and enhanced productivity in their AI interactions.",
    type: "Article",
    platform: "Open WebUI",
    url: "https://medium.com/@limcheekin/would-you-pay-1-month-to-own-your-ai-data-6dbb0db1eeaf", 
    tags: ["Open WebUI", "Private AI", "Self Hosted AI", "Prompt Library"],
    imageUrl: "https://picsum.photos/seed/fluwix/400/200"
  }  
];


export const CONTACT_CONTENT = {
  title: "What's Next?",
  subtext: "Get In Touch",
  paragraph: `My inbox is always open for AI discussions, collaborations, or just to connect. Whether you have a question about RAG, local AI, open-source initiatives, or AI engineering in general, I’ll do my best to get back to you!`,
  buttonText: "Say Hello",
};


export const FOOTER_TEXT = `Designed & Built by ${ENGINEER_NAME}. Inspired by Brittany Chiang.`;
