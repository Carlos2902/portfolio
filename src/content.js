// All site copy lives here so it can be edited without touching the components.

export const links = {
  github: "https://github.com/Carlos2902",
  linkedin: "https://www.linkedin.com/in/carloslopezdev",
};

export const hero = {
  headline: "Hey, I’m",
  name: "Carlos",
  subtitle: "A full-stack engineer building applications with React, Python, Node.js and Google Cloud.",
  body: "I specialize in crafting modern UI/UX experiences, backed by robust API design, payments, security, automated testing and performance optimization.",
};

// `image`: add a path (e.g. "/projects/latinolink-app.webp" in public/) once the real images arrive.
// Until then each card shows a placeholder built from `placeholder`.
export const projects = [
  {
    name: "LatinoLink",
    kind: "Mobile app",
    description:
      "Service marketplace app on the App Store and Google Play with 100+ users, with in-app purchases via RevenueCat, role-based security and Spanish/English/French support.",
    tech: ["Flutter", "FlutterFlow", "Firebase", "Google Cloud", "RevenueCat", "Figma"],
    links: [
      { label: "App Store", href: "https://apps.apple.com/ca/app/latinolink/id6768405081" },
      {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.mycompany.latinolinkapp&pcampaignid=web_share",
      },
      { label: "Case study", href: "/latinolink" },
      { label: "Case study (ES)", href: "/latinolink/es", hrefLang: "es" },
    ],
    image: null,
    placeholder: { from: "#1E2A78", to: "#5B6CF0", label: "LatinoLink", note: "App" },
  },
  {
    name: "LatinoLink",
    kind: "Website",
    description: "Website for the LatinoLink app.",
    tech: ["Figma", "JavaScript", "CSS"],
    links: [{ label: "Live site", href: "https://latinolinkapp.ca/" }],
    image: null,
    placeholder: { from: "#C2410C", to: "#FB923C", label: "LatinoLink", note: "Web" },
  },
  {
    name: "Crecer Mexico",
    kind: "Website",
    description:
      "Proposed, designed and built a responsive full-stack web app to replace the organization’s outdated static site, including its first secure online donation system (Stripe webhooks).",
    tech: ["Django REST Framework", "JavaScript", "Stripe", "Google Maps API", "CSS animations", "Figma"],
    links: [{ label: "Live site", href: "https://crecermexico.org/" }],
    image: null,
    placeholder: { from: "#3F4A3C", to: "#9AA890", label: "Crecer", note: "Web" },
  },
];

export const projectsIntro =
  "A few products I’ve designed, built and shipped, from a marketplace app on both app stores to a nonprofit’s first online donations.";

export const experience = [
  {
    role: "Full-Stack Developer",
    company: "LatinoLink",
    location: "Toronto, ON",
    dates: "Feb 2026 – Present",
    link: { label: "Case study", href: "/latinolink" },
    points: [
      "Shipped a Flutter-based service marketplace app to App Store and Google Play, onboarding 100+ users",
      "Built payment processing for in-app purchases using RevenueCat webhooks, idempotency keys and atomic Firestore transactions to prevent duplicate or lost credits and subscriptions",
      "Secured user and transaction data against IDOR, mass assignment, and privilege escalation via default-deny, role-based Firestore rules, validated by 81 automated security tests (63 negative cases)",
      "Redesigned provider matching algorithm to cut database calls from 201 to 2, reducing query load and cost",
      "Localized client screens into Spanish, English and French with an in-app language switcher",
    ],
  },
  {
    role: "Full-Stack Developer",
    company: "Xeo Marketing and Strategic Consultancy",
    location: "Toronto, ON",
    dates: "Nov 2025 – Sep 2026",
    points: [
      "Built a summit site for 500+ attendees with CSS animations and an integrated ticket purchase flow",
      "Routed 40 leads into the client CRM with JavaScript validation and Gravity Forms REST API integration",
      "Developed 26 WordPress pages for marketing campaigns with technical SEO, AEO and structured data",
    ],
  },
  {
    role: "Backend Developer",
    company: "Shipd",
    location: "Toronto, ON",
    dates: "Nov 2024 – Sep 2025",
    points: [
      "Expanded a Large Language Model training dataset by developing and refactoring 50+ Django, Flask, and PyQt projects, improving code completion accuracy by 25% (Pass@1)",
      "Improved a Django language-learning application’s user-facing API latency by 95.4% (3.18s → 145ms) by implementing Celery Beat with Redis task queues to asynchronously pre-generate OpenAI-powered lessons",
    ],
  },
  {
    role: "Web Development Intern",
    company: "rCycle",
    location: "Toronto, ON",
    dates: "May 2024 – Sep 2024",
    points: [
      "Migrated the dev team’s WordPress test environment to AWS EC2 and automated user onboarding in JS/PHP",
    ],
  },
];

// How many bullets each timeline entry shows (the horizontal timeline gets crowded past this).
export const MAX_POINTS = 3;

export const testimonials = [
  {
    quote:
      "Carlos worked as a web development intern for his co-op at Humber College. He contributed invaluable work to our website and communications initiative, changing our position as a startup, platform and our brand's online presence. Carlos created the communications flow, content, and management system to run our beta test program publicly. This work included web forums, email templates, unique communication paths, testing environments, and documentation, and the pace and quality of his output were high-level professional exceeding his expected level as a student.",
    name: "Jason Greenberg",
    title: "CEO",
    company: "rCycle",
  },
  {
    quote:
      "Carlos was an excellent student of mine, whom I taught in both WDDM 115 and WDDM 121. Carlos received a 97% and 99% in both courses. His group project was very well done, and has proved to produce great work while in a team. I would recommend Carlos to anyone who needs a strong developer and team player. Carlos will go very far in whatever path he takes. Good luck Carlos..",
    name: "Mark Meritt Jr.",
    title: "CEO",
    company: "Apptist Inc.",
  },
];
