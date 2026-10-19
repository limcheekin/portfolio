import { useState, useEffect, useRef } from 'react';

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
  currentPath: string;
}

// Page regions behind the open drawer: dimmed, and `inert` so focus and clicks stay in the header.
const BEHIND = ['#main-content', 'body > footer'];
const DIM = ['blur-sm', 'brightness-50'];

export default function MobileMenu({ navLinks, currentPath }: MobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const behind = BEHIND.map((s) => document.querySelector<HTMLElement>(s)).filter((el) => el !== null);
    const setBehind = (open: boolean) => {
      behind.forEach((el) => {
        el.inert = open;
        DIM.forEach((c) => el.classList.toggle(c, open));
      });
      document.body.style.overflow = open ? 'hidden' : '';
    };
    setBehind(menuOpen);
    if (!menuOpen) return () => setBehind(false);

    navRef.current?.querySelector('a')?.focus();

    const close = () => {
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    return () => {
      setBehind(false);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <div className="md:hidden">
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="mobile-menu-toggle"
          data-state={menuOpen ? 'open' : 'closed'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="relative z-50 p-4 -mr-4 text-green-accent"
          aria-label="Menu"
        >
          <div className="w-7 h-6 relative">
            {/* Both bars sit on the centre line and move only by transform: closed, they are offset 6px up and
                down (the lower one scaled to 80% from its left end); open, they rotate into an X. */}
            <div
              className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-green-accent rounded-full transition-transform duration-200 motion-reduce:transition-none"
              style={{ transform: menuOpen ? 'rotate(45deg)' : 'translateY(-6px)' }}
            />
            <div
              className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-green-accent rounded-full transition-transform duration-200 motion-reduce:transition-none"
              style={{ transform: menuOpen ? 'rotate(-45deg)' : 'translate(-10%, 6px) scaleX(0.8)' }}
            />
          </div>
        </button>
      </div>

      {/* Drawer. Closed, it slides off-screen and is inert, so its links are out of the tab order. */}
      <nav
        ref={navRef}
        id="mobile-nav"
        aria-label="Mobile navigation"
        data-testid="mobile-nav"
        inert={!menuOpen}
        className={`fixed top-0 bottom-0 right-0 h-[100dvh] w-3/4 max-w-sm bg-card border-l border-edge transform transition-transform duration-300 ease-in-out motion-reduce:transition-none z-40
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ol className="list-none p-0 m-0 w-full">
            {navLinks.map((link, index) => {
              const isActive = currentPath.startsWith(link.href);
              return (
                <li key={link.name} className="relative my-5 mx-auto font-mono text-lg">
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block p-4 transition-colors duration-250 hover:text-green-accent ${isActive ? 'text-green-accent' : 'text-lightest-slate'}`}
                  >
                    <span className="text-green-accent block text-sm mb-1">0{index + 1}.</span>
                    {link.name}
                  </a>
                </li>
              );
            })}
          </ol>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-lg border border-green-accent text-green-accent rounded py-4 px-12 mt-8 transition-colors duration-250 hover:bg-green-tint"
          >
            Résumé
          </a>
        </div>
      </nav>
    </>
  );
}
