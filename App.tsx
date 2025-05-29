
import React, { useEffect, useContext, useState, useRef } from 'react';
import { HashRouter, useLocation, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { LeftSocialSidebar, RightEmailSidebar } from './components/FixedSidebars';
import { Footer, SectionWrapper } from './components/Layout'; // SectionWrapper might be used for structure
import { HeroSection, AboutSection } from './components/HomePage';
import { ProjectsSection } from './components/PortfolioPage';
import { BlogSection }
from './components/InsightsPage'; // Simplified insights
import { ContactSection } from './components/ConnectPage';
import { SITE_TITLE, NAV_LINKS } from './constants';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';

const SkipToMainContentLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden focus:static focus:w-auto focus:h-auto focus:p-3 focus:m-3 focus:block focus:bg-green-accent focus:text-navy rounded-md shadow-lg z-[9999]"
    >
      Skip to main content
    </a>
  );
};

const ScrollToHashElement: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = SITE_TITLE;
    const FIXED_HEADER_HEIGHT = 80; // Approximate height of the new fixed header

    const hash = location.hash;
    if (hash && hash !== '#') {
      const elementId = hash.substring(1);
      const element = document.getElementById(elementId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - FIXED_HEADER_HEIGHT;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    } else if (location.pathname === '/' && !hash) {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return null;
};

const MainContentLayout: React.FC = () => {
  const { theme } = useContext(ThemeContext); // Theme context still useful for potential future light mode or system preference
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') { // Ensure dark is applied, new default
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [theme]);

  // Header visibility on scroll
  useEffect(() => {
    const SCROLL_THRESHOLD = 5;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < SCROLL_THRESHOLD * 2) { // Always show if near top
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD) { // Scrolling down
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) { // Scrolling up
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Intersection Observer for active section
   useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) { // Adjust ratio as needed
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -60% 0px" } // Adjust to favor sections in middle of viewport
    );

    const sections = NAV_LINKS.map(link => document.getElementById(link.href.substring(1))).filter(Boolean);
    sections.forEach(section => section && observer.observe(section));

    // Check initial hash on load
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      if (sections.find(s => s?.id === id)) {
        setActiveSection(id);
      }
    } else {
        // Default to first section if no hash or if #home (which is hero, not a NAV_LINK href)
        const heroSection = document.getElementById('hero');
        if (heroSection) setActiveSection('hero'); // Special case for hero
    }


    return () => sections.forEach(section => section && observer.unobserve(section));
  }, []);


  return (
    <div className="bg-navy text-light-slate font-sans antialiased selection:bg-green-accent/30 selection:text-green-accent min-h-screen">
      <SkipToMainContentLink />
      <Header isVisible={isHeaderVisible} activeSection={activeSection} />
      <LeftSocialSidebar />
      <RightEmailSidebar />
      
      <main id="main-content" className="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 py-0">
        {/* py-0 because sections will have their own padding. max-w-screen-lg to constrain content width like Brittany's */}
        <Routes>
          <Route path="/*" element={
            <>
              <HeroSection id="hero" /> {/* Use "hero" as ID for hero section */}
              <AboutSection id="about" />
              <ProjectsSection id="projects" /> {/* Corresponds to "Work" nav link */}
              <BlogSection id="insights" />
              <ContactSection id="contact" />
            </>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider> {/* Keep ThemeProvider for potential future use or system preference handling */}
      <HashRouter>
        <ScrollToHashElement />
        <MainContentLayout />
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
