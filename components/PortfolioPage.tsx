
import React, { useState } from 'react';
import { SectionWrapper, Button, GithubIcon, ExternalLinkIcon, FolderIcon } from './Layout';
import { PROJECTS_DATA } from '../constants';
import { Project, SectionProps } from '../types';

interface FeaturedProjectProps {
  project: Project;
  index: number; // To alternate layout
}

const FeaturedProject: React.FC<FeaturedProjectProps> = ({ project, index }) => {
  const isEven = index % 2 === 0;
  const isDemoAvailable = project.liveDemoUrl && project.liveDemoUrl !== "#";
  const isRepoAvailable = project.repoUrl && project.repoUrl !== "#";

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center mb-20 md:mb-28 group relative`}>
      {/* Project Image */}
      <div className={`relative md:col-span-7 ${isEven ? 'md:order-2' : ''}`}>
        <a 
            href={isDemoAvailable ? project.liveDemoUrl : (isRepoAvailable ? project.repoUrl : undefined)} 
            target="_blank" rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-250 ease-custom-ease group-focus-within:ring-2 group-focus-within:ring-green-accent group-focus-within:ring-offset-4 group-focus-within:ring-offset-navy"
            aria-label={`View project: ${project.title}`}
        >
          <img 
            src={project.imageUrl} 
            alt={`Screenshot of ${project.title}`} 
            loading="lazy"
            className="w-full h-auto object-cover object-top rounded-lg filter grayscale group-hover:filter-none brightness-75 group-hover:brightness-100 transition-all duration-250 ease-custom-ease"
          />
           <div className="absolute inset-0 bg-navy/50 group-hover:bg-transparent transition-colors duration-250 ease-custom-ease"></div>
        </a>
      </div>

      {/* Project Details */}
      <div className={`relative md:col-span-5 ${isEven ? 'md:order-1 md:text-left' : 'md:text-right'}`}>
        <p className="font-mono text-sm text-green-accent mb-1.5">Featured Project</p>
        <h3 className="text-2xl font-semibold text-lightest-slate mb-5 hover:text-green-accent transition-colors duration-250">
          <a 
            href={isDemoAvailable ? project.liveDemoUrl : (isRepoAvailable ? project.repoUrl : undefined)} 
            target="_blank" rel="noopener noreferrer"
          >
            {project.title}
          </a>
        </h3>
        
        <div className="bg-light-navy p-6 rounded-md shadow-lg md:relative z-10 text-slate-text text-sm leading-relaxed">
          <p>{project.overview}</p>
        </div>

        <ul className={`flex flex-wrap gap-x-3 gap-y-1.5 mt-5 font-mono text-xs text-slate-text ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
          {project.technologies.map(tech => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <div className={`flex items-center gap-3 mt-6 ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
          {project.repoUrl && (
            <a 
                href={isRepoAvailable ? project.repoUrl : undefined} 
                target="_blank" rel="noopener noreferrer" 
                aria-label="GitHub repository" 
                title={!isRepoAvailable ? "Repository is private or not available" : "View source code on GitHub"}
                className={`text-slate-text hover:text-green-accent transition-colors duration-250 ${!isRepoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => !isRepoAvailable && e.preventDefault()}
            >
              <GithubIcon className="w-5 h-5" />
            </a>
          )}
          {project.liveDemoUrl && (
            <a 
                href={isDemoAvailable ? project.liveDemoUrl : undefined} 
                target="_blank" rel="noopener noreferrer" 
                aria-label="Live demo" 
                title={!isDemoAvailable ? "Demo not available" : "View live demo"}
                className={`text-slate-text hover:text-green-accent transition-colors duration-250 ${!isDemoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => !isDemoAvailable && e.preventDefault()}
            >
              <ExternalLinkIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

interface OtherProjectCardProps {
  project: Project;
}

const OtherProjectCard: React.FC<OtherProjectCardProps> = ({ project }) => {
  const isDemoAvailable = project.liveDemoUrl && project.liveDemoUrl !== "#";
  const isRepoAvailable = project.repoUrl && project.repoUrl !== "#";
  const primaryLink = isDemoAvailable ? project.liveDemoUrl : (isRepoAvailable ? project.repoUrl : undefined);

  return (
    <div className="flex flex-col h-full bg-light-navy rounded-md shadow-lg hover:shadow-xl transition-shadow duration-250 ease-custom-ease group p-6">
      <div className="flex justify-between items-center mb-4">
        <FolderIcon className="w-8 h-8 text-green-accent" />
        <div className="flex items-center gap-3">
          {project.repoUrl && (
            <a 
              href={isRepoAvailable ? project.repoUrl : undefined}
              target="_blank" rel="noopener noreferrer" aria-label="GitHub repository"
              title={!isRepoAvailable ? "Repository is private or not available" : "View source code on GitHub"}
              className={`text-slate-text hover:text-green-accent transition-colors duration-250 ${!isRepoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => !isRepoAvailable && e.preventDefault()}
            >
              <GithubIcon className="w-5 h-5" />
            </a>
          )}
          {project.liveDemoUrl && (
            <a 
              href={isDemoAvailable ? project.liveDemoUrl : undefined}
              target="_blank" rel="noopener noreferrer" aria-label="Live demo"
              title={!isDemoAvailable ? "Demo not available" : "View live demo"}
              className={`text-slate-text hover:text-green-accent transition-colors duration-250 ${!isDemoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => !isDemoAvailable && e.preventDefault()}
            >
              <ExternalLinkIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
      <h4 className="text-lg font-semibold text-lightest-slate mb-2 group-hover:text-green-accent transition-colors duration-250">
        {primaryLink ? (
          <a href={primaryLink} target="_blank" rel="noopener noreferrer">{project.title}</a>
        ) : (
          project.title
        )}
      </h4>
      <p className="text-slate-text text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
        {project.overview}
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-xs text-slate-text">
        {project.technologies.slice(0, 4).map(tech => <li key={tech}>{tech}</li>)} 
        {project.technologies.length > 4 && <li className="text-green-accent/80">...more</li>}
      </ul>
    </div>
  );
};


export const ProjectsSection: React.FC<SectionProps> = ({ id }) => {
  const featuredProjects = PROJECTS_DATA.filter(p => p.featured);
  const otherProjects = PROJECTS_DATA.filter(p => !p.featured);
  
  const initialOtherProjectsCount = 6;
  const [showAllOtherProjects, setShowAllOtherProjects] = useState(false);
  
  const displayedOtherProjects = showAllOtherProjects ? otherProjects : otherProjects.slice(0, initialOtherProjectsCount);

  return (
    <SectionWrapper id={id} title="Some Things I’ve Built" titleNumber="02">
      <div className="space-y-16 md:space-y-28">
        {featuredProjects.map((project: Project, index: number) => (
          <FeaturedProject key={project.id} project={project} index={index} />
        ))}
        {featuredProjects.length === 0 && !otherProjects.length && (
          <p className="text-center text-slate-text text-lg">More projects coming soon, showcasing "Mastery of Detail"!</p>
        )}
      </div>

      {otherProjects.length > 0 && (
        <div className="mt-20 md:mt-28">
          <h3 className="text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 text-center">
            Other Noteworthy Projects
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedOtherProjects.map(project => (
              <OtherProjectCard key={project.id} project={project} />
            ))}
          </div>
          {otherProjects.length > initialOtherProjectsCount && (
            <div className="mt-12 text-center">
              <Button 
                onClick={() => setShowAllOtherProjects(!showAllOtherProjects)}
                variant="secondary"
                aria-expanded={showAllOtherProjects}
              >
                {showAllOtherProjects ? 'Show Fewer Projects' : 'Show More Projects'}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Optional: Button to view an archive of more projects - original comment kept if needed later */}
      {/* <div className="text-center mt-16">
        <Button href="/archive" size="md">View Full Project Archive</Button>
      </div> */}
    </SectionWrapper>
  );
};
