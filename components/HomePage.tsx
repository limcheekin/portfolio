
import React, { useState } from 'react';
import { SectionWrapper, Button } from './Layout';
import { HERO_CONTENT, ABOUT_CONTENT, EMAIL_ADDRESS, ENGINEER_NAME } from '../constants';
import { SectionProps, ExperienceItem } from '../types';
import Banner from './Banner';

export const HeroSection: React.FC<SectionProps> = ({ id }) => {
  return (
    <section id={id} className="min-h-screen flex flex-col justify-center pt-24 md:pt-32 pb-20"> {/* Ensure enough padding top due to fixed header */}
      {/* Content constrained by main layout in App.tsx */}
      <div> {/* Inner div for content flow */}
        <p className="font-mono text-base text-green-accent mb-4 md:mb-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          {HERO_CONTENT.greeting}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-lightest-slate mb-3 md:mb-4 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {HERO_CONTENT.name}
        </h1>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-text mb-6 md:mb-8 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          {HERO_CONTENT.tagline}
        </h2>
        <div className="pb-16">
         <Banner />
        </div>
        <div className="animate-fadeInUp" style={{ animationDelay: '500ms' }}>
          <Button href={`mailto:${EMAIL_ADDRESS}`} size="lg">
            {HERO_CONTENT.ctaButton}
          </Button>
        </div>
      </div>
    </section>
  );
};


export const AboutSection: React.FC<SectionProps> = ({ id }) => {
  const [showAllExperience, setShowAllExperience] = useState(false);
  const initialExperienceCount = 3;
  const workExperience = ABOUT_CONTENT.workExperience || [];
  const displayedExperience = showAllExperience ? workExperience : workExperience.slice(0, initialExperienceCount);

  return (
    <SectionWrapper id={id} title="About Me" titleNumber="01">
      <div className="grid md:grid-cols-5 gap-10 lg:gap-12 items-start">
        {/* Left Column: Text Content */}
        <div className="md:col-span-3">
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            {ABOUT_CONTENT.introductionParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          
          <div className="mb-12">
            <p className="text-lightest-slate mb-3">Here are a few technologies I’ve been working with recently:</p>
            {/* Skills list using global ul > li ::before for bullets */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
              {ABOUT_CONTENT.skills.map(skill => (
                <li key={skill} className="font-mono">{skill}</li>
              ))}
            </ul>
          </div>

          {/* Work Experience Section */}
          {workExperience.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-lightest-slate mb-6 flex items-center">
                <span className="text-lg text-green-accent font-mono mr-2.5">▹</span>
                Work Experience
              </h3>
              <div className="space-y-10">
                {displayedExperience.map((exp: ExperienceItem) => (
                  <div key={exp.id} className="relative pl-8 group">
                    <div className="absolute left-0 top-1 bottom-0 w-px bg-lightest-navy/50 group-hover:bg-green-accent/50 transition-colors duration-250"></div>
                    <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-navy border-2 border-lightest-navy/80 group-hover:border-green-accent transition-colors duration-250 transform -translate-x-[calc(50%-1px)]">
                       <div className="w-full h-full rounded-full bg-green-accent scale-0 group-hover:scale-100 transition-transform duration-250"></div>
                    </div>
                    
                    <h4 className="text-lg font-medium text-lightest-slate group-hover:text-green-accent transition-colors duration-250 mb-0.5">
                      {exp.jobTitle} 
                      {exp.companyUrl ? (
                        <a 
                          href={exp.companyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-green-accent hover:underline"
                          aria-label={`Visit ${exp.company} website (opens in new tab)`}
                        >
                          {' '}@ {exp.company}
                        </a>
                      ) : (
                        <span className="text-green-accent"> @ {exp.company}</span>
                      )}
                    </h4>
                    <p className="font-mono text-xs text-slate-text mb-3">{exp.period}</p>
                    <ul className="list-none pl-0 space-y-1.5 text-slate-text text-sm">
                      {exp.descriptionPoints.map((point, i) => (
                        <li key={i} className="relative pl-5 before:content-['–'] before:absolute before:left-0 before:text-slate-text before:opacity-70">
                          {point}
                        </li>
                      ))}
                    </ul>
                    {exp.skills && exp.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {exp.skills.map(skill => (
                          <span 
                            key={skill} 
                            className="font-mono text-xs bg-green-tint text-green-accent px-2.5 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {workExperience.length > initialExperienceCount && (
                <div className="mt-10 text-center">
                  <Button 
                    onClick={() => setShowAllExperience(!showAllExperience)}
                    variant="secondary"
                    aria-expanded={showAllExperience}
                  >
                    {showAllExperience ? 'Show Less Experience' : 'Show More Experience'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Image */}
        <div className="md:col-span-2 relative group mx-auto md:mx-0 max-w-xs md:max-w-sm">
          <div className="absolute inset-0 rounded-md border-2 border-green-accent transform translate-x-3 translate-y-3 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-250 ease-custom-ease z-0"></div>
          <div className="relative bg-green-accent rounded-md overflow-hidden z-10 shadow-lg">
             <img 
                src={ABOUT_CONTENT.professionalPhotoUrl} 
                alt={`Professional headshot of ${ENGINEER_NAME}`}
                className="rounded-md w-full h-auto object-cover filter grayscale hover:filter-none transition-all duration-250 ease-custom-ease"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-navy/60 group-hover:bg-transparent transition-colors duration-250 ease-custom-ease"></div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
