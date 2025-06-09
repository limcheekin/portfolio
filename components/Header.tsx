import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { NAV_LINKS, ENGINEER_NAME } from '../constants';
import { Button } from './Layout';

interface HeaderProps {
  isVisible: boolean;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({ isVisible, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('footer');

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      mainContent?.classList.add('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.add('blur-sm', 'brightness-50', 'pointer-events-none');
    } else {
      document.body.style.overflow = 'unset';
      mainContent?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
    }

    const onResize = (e: UIEvent) => {
      if ((e.currentTarget as Window).innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      document.body.style.overflow = 'unset';
      mainContent?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const initials = ENGINEER_NAME.split(' ').map(n => n[0]).join('');

  return (
    <header 
      className={`fixed top-0 z-50 px-6 md:px-12 w-full h-24 flex items-center
                  bg-navy/80 backdrop-blur-md shadow-md
                  transition-transform duration-300 ease-in-out
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
          {initials[0]}
        </RouterLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <ol className="flex items-center space-x-6 lg:space-x-8 list-none p-0 m-0">
            {NAV_LINKS.map((link, index) => (
              <li key={link.name} className="relative font-mono text-sm">
                <RouterLink
                  to={link.href}
                  className={`px-2.5 py-2 transition-colors duration-250
                    ${activeSection === link.href.substring(1) ? 'text-green-accent' : 'text-light-slate hover:text-green-accent'}`}
                >
                  <span className="text-green-accent text-xs mr-1">0{index + 1}.</span>
                  {link.name}
                </RouterLink>
              </li>
            ))}
          </ol>
          <div className="ml-4">
            <Button href="/resume.pdf" size="sm" target="_blank" rel="noopener noreferrer">
              Resume
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Button (Hamburger) */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="relative z-50 p-4 -mr-4 text-green-accent focus:outline-none"
            aria-label="Menu"
          >
            <div className="w-7 h-6 relative">
              <div
                className={`absolute top-1/2 left-0 w-full h-0.5 bg-green-accent rounded-full transform -translate-y-1/2 transition-all duration-200
                ${menuOpen ? 'rotate-45 w-full' : ''}`}
                style={{
                  top: menuOpen ? '50%' : '25%',
                  transform: menuOpen ? 'rotate(45deg)' : 'translateY(-50%)'
                }}
              />
              <div
                className={`absolute top-1/2 left-0 w-full h-0.5 bg-green-accent rounded-full transform -translate-y-1/2 transition-all duration-200
                ${menuOpen ? '-rotate-45 w-full' : 'w-5/6'}`}
                 style={{
                  transform: menuOpen ? 'rotate(-45deg)' : 'translateY(-50%)',
                  width: menuOpen ? '100%' : '80%',
                  top: menuOpen ? '50%' : '75%'
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
        <aside 
            className={`fixed top-0 bottom-0 right-0 h-screen w-3/4 max-w-sm bg-light-navy shadow-lg transform transition-transform duration-300 ease-in-out z-40
            ${menuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
            aria-hidden={!menuOpen}
            tabIndex={menuOpen ? 1 : -1}
        >
          <nav className="flex flex-col items-center justify-center h-full text-center">
            <ol className="list-none p-0 m-0 w-full">
                {NAV_LINKS.map((link, index) => (
                <li key={link.name} className="relative my-5 mx-auto font-mono text-lightest-slate text-lg">
                    <RouterLink
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block p-4"
                    >
                    <span className="text-green-accent block text-sm mb-1">0{index + 1}.</span>
                    {link.name}
                    </RouterLink>
                </li>
                ))}
            </ol>
            <a href="resume.pdf" className="font-mono text-lg border border-green-accent text-green-accent rounded py-4 px-12 mt-8">
              Resume
            </a>
          </nav>
        </aside>
    </header>
  );
};
