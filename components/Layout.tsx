import React from 'react';
import { FiGithub, FiLinkedin, FiExternalLink, FiMail, FiFolder, FiFileText } from 'react-icons/fi'; // Added FiFolder
import { FOOTER_TEXT } from '../constants';

// Icon Components (using react-icons) - kept for utility
export const GithubIcon: React.FC<{ className?: string }> = ({ className }) => <FiGithub className={className} />;
export const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => <FiLinkedin className={className} />;
export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => <FiExternalLink className={className} />;
export const EmailIcon: React.FC<{ className?: string }> = ({ className }) => <FiMail className={className} />;
export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => <FiFolder className={className} />;
export const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => <FiFileText className={className} />;
// Sun/Moon/Menu/Close/ChevronRight icons are removed as old sidebar is gone.

// Footer Component - Simplified
export const Footer: React.FC = () => {
  return (
    <footer className="text-center py-8 px-6">
      <a 
        href="https://github.com/yourgithub/yourportfolio-repo" // Link to your portfolio's repo if public
        target="_blank" 
        rel="noopener noreferrer"
        className="font-mono text-xs text-slate-text hover:text-green-accent transition-colors duration-250"
      >
        {FOOTER_TEXT}
      </a>
    </footer>
  );
};

// Section Wrapper Component - Updated for Numbered Titles
interface SectionWrapperProps {
  id: string;
  title?: string;
  titleNumber?: string; // e.g., "01"
  children: React.ReactNode;
  className?: string;
  contentClassName?: string; // Class for the direct content wrapper div
  fullWidth?: boolean; // Retained, but new design is mostly constrained
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, title, titleNumber, children, className = '', contentClassName = '', fullWidth = false }) => {
  const content = (
    <>
      {title && (
        <h2 className="flex items-center text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 md:mb-12 whitespace-nowrap relative w-full">
          {titleNumber && <span className="text-xl md:text-2xl text-green-accent font-mono mr-2.5">{titleNumber}.</span>}
          {title}
          <span className="block h-px bg-lightest-navy/30 ml-5 w-full max-w-xs md:max-w-sm"></span> {/* Decorative line */}
        </h2>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </>
  );

  // Sections have significant vertical padding
  return (
    <section id={id} className={`py-20 md:py-24 lg:py-28 ${className}`}>
      {/* {fullWidth ? content : <div className="w-full">{content}</div>} */}
      {/* max-w-screen-lg and padding are handled by main layout in App.tsx now */}
      {content}
    </section>
  );
};


// Generic Card component - Deprecated / Simplified
// The new design moves away from heavy card usage. 
// Specific boxed styling for project descriptions will be handled locally.
// This is a placeholder if some very light card-like structure is needed somewhere.
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
}
export const Card: React.FC<CardProps> = ({ children, className, onClick, as: Component = 'div' }) => {
  // Base flat styling. Hover effects are specific to usage now.
  const baseClasses = `transition-all duration-250 ease-custom-ease`;
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  return (
    <Component className={`${baseClasses} ${clickableClasses} ${className}`} onClick={onClick}>
      {children}
    </Component>
  );
};


// Generic Button component - Re-styled
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string; // Added to allow anchor target attribute
  rel?: string;    // Added to allow anchor rel attribute
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'a';
  variant?: 'primary' | 'secondary'; // simplified variants
}

export const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  className = '',
  href,
  leftIcon,
  rightIcon,
  as = 'button',
  variant = 'primary', // Default to primary outline style
  ...props // `props` here captures rest attributes, including `target`, `rel`, `type`, etc.
}) => {
  const baseStyles = `
    font-mono inline-flex items-center justify-center rounded 
    border border-green-accent 
    text-green-accent 
    hover:bg-green-tint focus:bg-green-tint
    transition-all duration-250 ease-custom-ease 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy
    disabled:opacity-50 disabled:cursor-not-allowed group
  `;

  const sizeStyles = {
    sm: "px-5 py-2.5 text-xs", // Adjusted for BC style
    md: "px-7 py-3.5 text-sm", // Adjusted for BC style
    lg: "px-8 py-4 text-base",  // Adjusted for BC style
  };
  
  const variantStyles = {
      primary: "text-green-accent border-green-accent hover:bg-green-tint", // This is the main style
      secondary: "text-light-slate border-light-slate hover:bg-lightest-navy/10" // For less prominent actions
  };

  const composedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  const content = (
    <>
      {leftIcon && <span className="mr-2 -ml-0.5 h-4 w-4">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 -mr-0.5 h-4 w-4">{rightIcon}</span>}
    </>
  );

  if (as === 'a' || href) {
    // `props.target` and `props.rel` refer to these attributes if they exist in the `...props` rest object.
    return (
      <a 
        href={href} 
        className={composedClassName} 
        target={props.target || (href && (href.startsWith('http') || href.startsWith('mailto')) ? '_blank' : undefined)} 
        rel={props.rel || (href && href.startsWith('http') ? 'noopener noreferrer' : undefined)}
        {...((props as unknown) as React.AnchorHTMLAttributes<HTMLAnchorElement>)} // Fixed line 156
      >
        {content}
      </a>
    );
  }

  return (
    <button type={props.type || 'button'} className={composedClassName} {...props}>
      {content}
    </button>
  );
};