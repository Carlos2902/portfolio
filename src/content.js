// All site copy lives here so it can be edited without touching the components.
// It also feeds the SEO build step (vite.config.js): the crawler-readable HTML, JSON-LD and llms.txt.

export const links = {
  github: "https://github.com/Carlos2902",
  linkedin: "https://www.linkedin.com/in/carloslopezdev",
  resume: "/Carlos-Lopez-Resume.pdf",
};

// Search and AI-assistant facing facts. Keep them true and in sync with the resume.
export const site = {
  url: "https://carloslopezdev.com",
  name: "Carlos Lopez",
  title: "Carlos Lopez | Full-Stack Developer & Product Designer in Toronto",
  description:
    "Toronto full-stack developer and product designer. I design, build and launch web and mobile apps with React, Flutter, Node.js, Python and Google Cloud, and keep them running.",
  jobTitle: "Full-Stack Developer and Product Designer",
  city: "Toronto",
  region: "ON",
  regionName: "Ontario",
  country: "CA",
  areaServed: ["Toronto", "Greater Toronto Area", "Ontario", "Canada"],
  languages: ["English", "Spanish"],
  services: [
    "Web application development",
    "Mobile app development (iOS and Android)",
    "UI/UX and product design",
    "API and backend development",
    "Payment integration (Stripe, RevenueCat)",
    "Deployment, hosting and maintenance",
  ],
  skills: [
    "React", "Flutter", "FlutterFlow", "Node.js", "Python", "Django", "Flask", "JavaScript", "Dart", "SQL",
    "REST APIs", "Webhooks", "Firebase", "Google Cloud", "AWS", "PostgreSQL", "Firestore", "MongoDB",
    "Stripe", "RevenueCat", "Celery", "Redis", "Tailwind CSS", "Figma", "Claude Design", "UI/UX design",
  ],
  education: [
    { name: "Universidad del Valle de México", credential: "Bachelor in Software Design and Networks Engineering" },
    { name: "Humber Polytechnic", credential: "Web Development (Ontario College Diploma)" },
    { name: "Humber Polytechnic", credential: "Graphic Design (Ontario College Diploma)" },
  ],
};

// Answers to what people ask search engines and AI assistants. Shown on the page (FAQ section) and
// mirrored in the FAQPage structured data, so both always match.
export const faq = [
  {
    q: "Who is Carlos Lopez?",
    a: "Carlos Lopez is a product designer and full-stack developer based in Toronto, Ontario. He designs interfaces in Figma and Claude Design, then builds, launches and maintains the web and mobile apps behind them, including APIs, payments, security and deployment.",
  },
  {
    q: "Who can build and design my app in Toronto?",
    a: "Carlos Lopez is a Toronto-based developer who handles the whole process on his own: product and interface design, front end, back end, payments, app store release and maintenance. You work with one person from idea to launch instead of coordinating a designer, a developer and a hosting provider.",
  },
  {
    q: "What kind of projects does he take on?",
    a: "Web applications, mobile apps for iOS and Android, marketplaces, business and nonprofit websites, and APIs. Recent work includes LatinoLink, a service marketplace live on the App Store and Google Play, and a full-stack website with online donations for the nonprofit Crecer México.",
  },
  {
    q: "What technologies does he use?",
    a: "React, Flutter and FlutterFlow on the front end; Node.js, Python (Django and Flask), Firebase and Google Cloud on the back end; PostgreSQL, Firestore and MongoDB for data; Stripe and RevenueCat for payments; and Figma and Claude Design for interface design.",
  },
  {
    q: "Can he handle payments and security?",
    a: "Yes. For LatinoLink he built in-app purchase processing with RevenueCat webhooks, idempotency keys and atomic database transactions so credits and subscriptions are never duplicated or lost, and protected user data with role-based access rules checked by 81 automated security tests.",
  },
  {
    q: "Does he work in Spanish?",
    a: "Yes. Carlos works in English and Spanish, and has shipped apps localized into Spanish, English and French.",
  },
  {
    q: "How do I hire Carlos Lopez?",
    a: "Send a short description of your project through the contact form on carloslopezdev.com, or message him on LinkedIn. He replies by email.",
  },
];

// Hero: lead with the outcome for the client, back it with proof, end with a clear next step.
export const hero = {
  // Rendered as the page's <h1>: name, role and city are what people search for.
  eyebrow: "Carlos Lopez · Product designer & full-stack developer in Toronto",
  headline: "I take your app from idea to launch, and keep it running.",
  subline:
    "I design every interface in Figma and Claude Design, then build the APIs, payments and security behind it and ship it to production. Designer and sole engineer behind LatinoLink, live on the App Store and Google Play.",
};

// `image`: a path in public/ (the card falls back to `placeholder` if it's null).
// `imagePosition`: which part of the screenshot stays in view when the card crops it.
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
      { label: "Case study", href: "/latinolink_case_study.pdf" },
      { label: "Case study (ES)", href: "/latinolink_case_study_es.pdf", hrefLang: "es" },
    ],
    image: "/projects/latinolink-app.webp",
    imagePosition: "50% 70%",
    placeholder: { from: "#1E2A78", to: "#5B6CF0", label: "LatinoLink", note: "App" },
  },
  {
    name: "LatinoLink",
    kind: "Website",
    description: "Website for the LatinoLink app.",
    tech: ["Figma", "HTML5", "JavaScript", "CSS"],
    links: [{ label: "Live site", href: "https://latinolinkapp.ca/" }],
    image: "/projects/latinolink-website.webp",
    imagePosition: "50% 0%",
    placeholder: { from: "#C2410C", to: "#FB923C", label: "LatinoLink", note: "Web" },
  },
  {
    name: "Crecer Mexico",
    kind: "Website",
    description:
      "Proposed, designed and built a responsive full-stack web app to replace the organization’s outdated static site, including its first secure online donation system (Stripe webhooks).",
    tech: ["Django REST Framework", "JavaScript", "Stripe", "Google Maps API", "CSS animations", "Figma"],
    links: [
      { label: "Live site", href: "https://crecermexico.org/" },
      {
        label: "Case study",
        href: "https://medium.com/@carloslopezr29/from-broken-buttons-to-a-full-stack-application-a-deep-dive-into-rebuilding-a-nonprofits-digital-892b9f2fdb3a",
      },
    ],
    image: "/projects/crecer-mexico.webp",
    imagePosition: "50% 0%",
    placeholder: { from: "#3F4A3C", to: "#9AA890", label: "Crecer", note: "Web" },
  },
];

export const experience = [
  {
    role: "Full-Stack Developer",
    company: "LatinoLink",
    location: "Toronto, ON",
    dates: "Feb 2026 – Present",
    link: { label: "Case study", href: "/latinolink_case_study.pdf" },
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
