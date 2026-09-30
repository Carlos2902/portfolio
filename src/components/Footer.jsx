import logo from "../assets/logo-c-white.png";
import { links } from "../content";
import { scrollToSection } from "../lib/motion";
import { TextLink } from "./ui";

const Footer = () => (
  <footer data-theme="dark" className="page-x border-t border-white/10 py-10">
    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection("top");
        }}
        className="flex items-center gap-3"
        aria-label="Back to top"
      >
        <img src={logo} alt="" width="25" height="32" className="h-8 w-auto" />
        <span className="font-medium tracking-[-0.01em]">Carlos Lopez</span>
      </a>

      <ul className="flex gap-8 text-[0.92rem] text-white/70">
        <li>
          <TextLink href={links.resume} className="hover:text-paper">
            Resume
          </TextLink>
        </li>
        <li>
          <TextLink href={links.github} className="hover:text-paper">
            GitHub
          </TextLink>
        </li>
        <li>
          <TextLink href={links.linkedin} className="hover:text-paper">
            LinkedIn
          </TextLink>
        </li>
      </ul>

      <p className="text-[0.85rem] text-white/45">© 2026 Carlos Lopez</p>
    </div>
  </footer>
);

export default Footer;
