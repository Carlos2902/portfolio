import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo-c-white.png";
import { links } from "../content";
import { lockScroll, scrollToSection } from "../lib/motion";

const NAV_LINKS = [
  { id: "projects", label: "Projects", num: "01" },
  { id: "work", label: "Work", num: "02" },
];

// Theme of whatever section sits under the navbar's vertical middle.
function sectionThemeUnder(nav) {
  const y = nav.getBoundingClientRect().height / 2;
  for (const el of document.elementsFromPoint(window.innerWidth / 2, y)) {
    if (nav.contains(el)) continue;
    const themed = el.closest("[data-theme]");
    if (themed) return themed.dataset.theme;
  }
  return "dark";
}

const Navbar = () => {
  const header = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!header.current) return;
        setTheme(sectionThemeUnder(header.current));
        setScrolled(window.scrollY > 60);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    // Let the menu unlock scrolling before travelling.
    requestAnimationFrame(() => scrollToSection(id));
  };

  const light = theme === "light" && !open;

  return (
    <header
      ref={header}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${light ? "text-ink" : "text-paper"} ${
        // Past the hero, a soft tinted blur keeps the nav legible over scrolling content.
        scrolled && !open ? `backdrop-blur-md ${light ? "bg-white/75" : "bg-ink/70"}` : "bg-transparent"
      }`}
    >
      <nav className="page-x relative flex h-20 items-center justify-between" aria-label="Main">
        <a href="#top" onClick={go("top")} className="relative z-10 -m-2 p-2" aria-label="Carlos Lopez, back to top">
          <img
            src={logo}
            alt=""
            width="31"
            height="40"
            className="h-9 w-auto transition-[filter] duration-500"
            style={{ filter: light ? "invert(1)" : "none" }}
          />
        </a>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-12 lg:flex">
          {NAV_LINKS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={go(id)}
                className="group relative py-2 text-[0.95rem] font-medium tracking-[-0.01em]"
              >
                {label}
                <span className="absolute inset-x-0 bottom-0.5 h-px origin-right scale-x-0 bg-current transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
              </a>
            </li>
          ))}
          <li>
            <a
              href={links.resume}
              target="_blank"
              rel="noreferrer"
              className="group relative py-2 text-[0.95rem] font-medium tracking-[-0.01em]"
            >
              Resume
              <span className="sr-only"> (PDF, opens in a new tab)</span>
              <span className="absolute inset-x-0 bottom-0.5 h-px origin-right scale-x-0 bg-current transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
            </a>
          </li>
        </ul>

        <a
          href="#contact"
          onClick={go("contact")}
          className={`pill-button hidden border-current lg:inline-flex ${
            light ? "hover:bg-ink hover:text-paper" : "hover:bg-paper hover:text-ink"
          }`}
        >
          Contact
        </a>

        <button
          type="button"
          className="relative z-10 -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[7px] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`h-px w-6 bg-current transition-transform duration-500 ${open ? "translate-y-[4px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-current transition-transform duration-500 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`fixed inset-0 flex flex-col justify-between bg-ink page-x pb-10 pt-28 text-paper transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {[...NAV_LINKS, { id: "contact", label: "Contact", num: "04" }].map(({ id, label, num }, i) => (
            <li
              key={id}
              className="transition-[transform,opacity] duration-700 ease-out"
              style={{
                transform: open ? "none" : "translateY(24px)",
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
              }}
            >
              <a
                href={`#${id}`}
                onClick={go(id)}
                tabIndex={open ? 0 : -1}
                className="flex items-baseline gap-4 py-2 text-[clamp(2.75rem,12vw,5rem)] font-semibold leading-none tracking-[-0.04em]"
              >
                <span className="font-serif text-lg italic tracking-normal text-white/40">{num}</span>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex gap-6 text-sm text-white/60">
          <a href={links.resume} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1} className="hover:text-paper">
            Resume
          </a>
          <a href={links.github} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1} className="hover:text-paper">
            GitHub
          </a>
          <a href={links.linkedin} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1} className="hover:text-paper">
            LinkedIn
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
