
import React from 'react';
import { SOCIAL_LINKS, EMAIL_ADDRESS } from '../constants';
import { GithubIcon, LinkedInIcon } from './Layout'; // Assuming these are kept or similar
import { FiTwitter, FiInstagram, FiCodepen, FiEdit3 } from 'react-icons/fi'; // Example other icons, Added FiEdit3
import { SiMedium } from 'react-icons/si';

// Helper to get icon component
const getSocialIcon = (iconName: string) => {
  const props = { className: "w-5 h-5" };
  switch (iconName) {
    case "FiGithub": return <GithubIcon {...props} />;
    case "FiLinkedin": return <LinkedInIcon {...props} />;
    case "FiTwitter": return <FiTwitter {...props} />;
    case "FiInstagram": return <FiInstagram {...props} />;
    case "FiCodepen": return <FiCodepen {...props} />;
    case "SiMedium": return <SiMedium {...props} />; 
    case "FiEdit3": return <FiEdit3 {...props} />; // Added case for pencil icon
    default: return null;
  }
};

export const LeftSocialSidebar: React.FC = () => {
  return (
    <div className="hidden md:flex fixed bottom-0 left-8 lg:left-10 right-auto z-10 w-10 flex-col items-center animate-fadeInUp" style={{ animationDelay: '800ms' }}>
      <ul className="flex flex-col items-center space-y-5 after:content-[''] after:block after:w-px after:h-24 after:bg-slate-text after:mt-5">
        {SOCIAL_LINKS.map(social => (
          <li key={social.name}>
            <a 
              href={social.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label={social.name}
              title={social.name}
              className="block p-2 text-slate-text hover:text-green-accent hover:scale-110 transform transition-all duration-250 ease-custom-ease"
            >
              {getSocialIcon(social.iconName)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const RightEmailSidebar: React.FC = () => {
  return (
    <div className="hidden md:flex fixed bottom-0 right-8 lg:right-10 left-auto z-10 w-10 flex-col items-center animate-fadeInUp" style={{ animationDelay: '800ms' }}>
      <div className="flex flex-col items-center space-y-5 after:content-[''] after:block after:w-px after:h-24 after:bg-slate-text after:mt-5">
        <a 
          href={`mailto:${EMAIL_ADDRESS}`}
          className="font-mono text-xs text-slate-text hover:text-green-accent tracking-wider [writing-mode:vertical-rl] p-2 transform hover:translate-y-[-3px] transition-all duration-250 ease-custom-ease"
        >
          {EMAIL_ADDRESS}
        </a>
      </div>
    </div>
  );
};