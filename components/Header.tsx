
import React, { useState, useContext, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { NAV_LINKS, ENGINEER_NAME } from '../constants';
import { ThemeContext } from '../contexts/ThemeContext'; // If theme toggle is desired in header
import { Button } from './Layout';
import { FiMenu, FiX } from 'react-icons/fi'; // For mobile menu

interface HeaderProps {
  isVisible: boolean;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({ isVisible, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  // const { theme, toggleTheme } = useContext(ThemeContext); // If adding theme toggle to header

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);
  
  const initials = ENGINEER_NAME.split(' ').map(n => n[0]).join('');

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-20 md:h-24 px-6 md:px-12
                  bg-navy/80 backdrop-blur-md shadow-lg 
                  transition-transform duration-300 ease-custom-ease
                  ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="container mx-auto h-full flex items-center justify-between max-w-screen-xl">
        {/* Logo / Initials */}
        <RouterLink 
          to="/#hero" 
          className="text-2xl font-bold text-green-accent border-2 border-green-accent rounded w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-green-tint transition-colors duration-250"
          onClick={() => setMenuOpen(false)}
          aria-label="Homepage"
        >
          {initials[0]} {/* Just first initial for very small logo */}
        </RouterLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {NAV_LINKS.map((link, index) => (
            <RouterLink
              key={link.name}
              to={link.href}
              className={`font-mono text-sm transition-colors duration-250
                ${activeSection === link.href.substring(1) ? 'text-green-accent' : 'text-light-slate hover:text-green-accent'}`}
            >
              <span className="text-green-accent">0{index + 1}.</span> {link.name}
            </RouterLink>
          ))}
          <Button href="/resume.pdf" size="sm" target="_blank" rel="noopener noreferrer"> {/* Placeholder for Resume */}
            Resume
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-green-accent focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX className="w-7 h-7" /> : <FiMenu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <aside 
            className="fixed inset-0 top-20 md:top-24 bg-navy p-6 z-40 flex flex-col items-center justify-center md:hidden animate-fadeIn"
            onClick={() => setMenuOpen(false)}
        >
          <nav className="flex flex-col items-center space-y-8">
            {NAV_LINKS.map((link, index) => (
              <RouterLink
                key={link.name}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={`font-mono text-lg transition-colors duration-250
                    ${activeSection === link.href.substring(1) ? 'text-green-accent' : 'text-lightest-slate hover:text-green-accent'}`}
              >
                <span className="text-green-accent block mb-1">0{index + 1}.</span> {link.name}
              </RouterLink>
            ))}
            <Button href="/resume.pdf" size="md" className="mt-6" target="_blank" rel="noopener noreferrer">
              Resume
            </Button>
          </nav>
        </aside>
      )}
    </header>
  );
};
