import { useState, useEffect } from 'react';

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
}

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <>
      {/* Hamburger Button */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="mobile-menu-toggle"
          className="relative z-50 p-4 -mr-4 text-green-accent focus:outline-none"
          aria-label="Menu"
        >
          <div className="w-7 h-6 relative">
            <div
              className={`absolute left-0 w-full h-0.5 bg-green-accent rounded-full transition-all duration-200
              ${menuOpen ? 'rotate-45 w-full' : ''}`}
              style={{
                top: menuOpen ? '50%' : '25%',
                transform: menuOpen ? 'rotate(45deg)' : 'translateY(-50%)',
              }}
            />
            <div
              className={`absolute left-0 w-full h-0.5 bg-green-accent rounded-full transition-all duration-200
              ${menuOpen ? '-rotate-45 w-full' : 'w-5/6'}`}
              style={{
                transform: menuOpen ? 'rotate(-45deg)' : 'translateY(-50%)',
                width: menuOpen ? '100%' : '80%',
                top: menuOpen ? '50%' : '75%',
              }}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <nav
        aria-label="Mobile navigation"
        data-testid="mobile-nav"
        className={`fixed top-0 bottom-0 right-0 h-screen w-3/4 max-w-sm bg-light-navy shadow-lg transform transition-transform duration-300 ease-in-out z-40
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ol className="list-none p-0 m-0 w-full">
            {navLinks.map((link, index) => (
              <li key={link.name} className="relative my-5 mx-auto font-mono text-lightest-slate text-lg">
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block p-4"
                >
                  <span className="text-green-accent block text-sm mb-1">0{index + 1}.</span>
                  {link.name}
                </a>
              </li>
            ))}
          </ol>
          <a href="/resume.pdf" className="font-mono text-lg border border-green-accent text-green-accent rounded py-4 px-12 mt-8">
            Resume
          </a>
        </div>
      </nav>
    </>
  );
}
