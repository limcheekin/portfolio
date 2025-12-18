
export interface NavLink {
  name: string;
  href: string;
  isButton?: boolean; // For Resume button in header
}

export interface HeroContent {
  greeting: string;
  name: string;
  tagline: string;
  introduction: string;
  ctaButton: string;
}

export interface ExperienceItem {
  id: string;
  period: string;
  jobTitle: string;
  company: string;
  companyUrl?: string;
  descriptionPoints: string[];
  skills: string[];
}

export interface AboutContent {
  introductionParagraphs: string[];
  skills: string[];
  professionalPhotoUrl: string;
  workExperience: ExperienceItem[];
}

export interface Project {
  id: string;
  title: string;
  featured: boolean; // To distinguish featured projects
  overview: string;
  technologies: string[];
  imageUrl: string;
  liveDemoUrl?: string;
  repoUrl?: string;
  category: string; // Retained for data organization
  // Removed fields not directly used in the new simpler project display:
  // client, problemStatement, myRole, solutionApproach, achievements, challengesOvercome, lessonsLearned
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  type: "Article" | "Talk" | "Slides"; // Retained for data
  platform?: string; // Retained for data
  url: string;
  tags: string[]; // Retained for data
  imageUrl: string; // Retained, though not used in simplified list
}

export interface ContactLink { // For social media icons
  name: string;
  url: string;
  iconName: string; // To map to react-icons
}

export interface SectionProps {
  id: string;
  className?: string;
}

export interface ValueProp {
  target: string;
  benefit: string;
  negative: string;
}