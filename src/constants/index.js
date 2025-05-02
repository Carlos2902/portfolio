import {
    nodejs,
    mobile,
    creator,
    web,
    javascript,
    html,
    css,
    reactjs,
    cplusplus,
    tailwind,
    git,
    figma,
    mysql,
    threejs,
    oaxaca,
    gpt,
    travel,
    mongodb,
    python,
    chlavm,
    shipd,
    rcycle,
    mobile_project,
    skill2go,
    jason,
    mark,
  } from "../assets";
  
  export const navLinks = [
    {
      id: "about",
      title: "About",
    },
    {
      id: "work",
      title: "Work",
    },
    {
      id: "contact",
      title: "Contact",
    },
  ];
  
  const services = [
    {
      title: "Web Developer",
      icon: web,
    },
    {
      title: "Backend Developer",
      icon: mobile,
    },

    {
      title: "UX/UI Designer",
      icon: creator,
    },
  ];
  
  const technologies = [
    {
      name: "HTML 5",
      icon: html,
    },
    {
      name: "CSS 3",
      icon: css,
    },
    {
      name: "JavaScript",
      icon: javascript,
    },
    {
      name: "Python",
      icon: python,
    },
    {
      name: "React JS",
      icon: reactjs,
    },
    {
      name: "C++",
      icon: cplusplus,
    },
    {
      name: "Three JS",
      icon: threejs,
    },
    {
      name: "Tailwind CSS",
      icon: tailwind,
    },

    {
      name: "SQL",
      icon: mysql,
    },

    {
      name: "Node js",
      icon: nodejs,
    },
    {
      name: "MongoDB",
      icon: mongodb,
    },

    {
      name: "git",
      icon: git,
    },
    {
      name: "figma",
      icon: figma,
    },

  ];
  const experiences = [
    {
      title: "Software Developer",
      company_name: "Shipd",
      icon: shipd,
      iconBg: "#FFFFFF",
      place: "Toronto, ON.",
      date: "Nov 2024 - Present ",
      points: [
        "Optimized an LLM for code generation by developing and refactoring 50+ projects in Django, Flask, and PyQt expanding the training dataset leading to a 25% increase in code completion accuracy (Pass@1).",
        "Enhanced applications performance by implementing multi-threading, Celery workers, and API caching, reducing execution time by 40% and improving data consistency for a higher-quality training dataset",
        "Developed full-stack AI apps integrating open-source and proprietary (OpenAI, Gemini) models",
        "Designed interactive UIs for data visualization using Streamlit, Bootstrap, and PyQt to improve usability",
      ],
    },
    {
      title: "Software Developer Intern",
      company_name: "rCycle",
      icon: rcycle,
      iconBg: "#FFFFFF",
      date: "May 2024 - Sept 2024",
      place: "Toronto, ON.",
      points: [
        "Developed an onboarding system with JavaScript and PHP, automating user registration and email workflows",
        "Migrated a WordPress test environment to AWS, enabling API testing previously restricted in local development",
        "Researched and applied an email automation API, streamlining the onboarding workflow to enhance user engagement while maintaining zero additional operational expenses",
        "Enhanced UI/UX by implementing CSS animations, grid layouts, responsive design, and dynamic forms",
      ],
    },
    {
      title: "Software Developer Intern",
      company_name: "CHLAVM",
      icon: chlavm,
      iconBg: "#FFFFFF",
      date: "Mar 2024 - May 2024",
      place: "Toronto, ON.",
      points: [
        "Integrated 3D scenes into the DOM with Three.js and React JS, optimizing rendering for better performance",
        "Leveraged WebXR API to enable Virtual Reality mode, delivering an immersive VR tour experience",
      ],
    },
  
  ]

  const testimonials = [
    {
      testimonial:
      "Carlos worked as a web development intern for his co-op at Humber College. He contributed invaluable work to our website and communications initiative, changing our position as a startup, platform and our brand's online presence. Carlos created the communications flow, content, and management system to run our beta test program publicly. This work included web forums, email templates, unique communication paths, testing environments, and documentation, and the pace and quality of his output were high-level professional exceeding his expected level as a student.",
      name: "Jason Greenberg",
      designation: "CEO",
      company: "rCycle",
      image: jason,
    },
    {
      testimonial:
      "Carlos was an excellent student of mine, whom I taught in both WDDM 115 and WDDM 121. Carlos received a 97% and 99% in both courses. His group project was very well done, and has proved to produce great work while in a team. I would recommend Carlos to anyone who needs a strong developer and team player. Carlos will go very far in whatever path he takes. Good luck Carlos..",
      name: "Mark Meritt Jr.",
      designation: "CEO",
      company: "Apptist Inc.",
      image: mark,
    },
  ];
  

  
  const projects = [
    {
      name: "Oaxaca Restaurant Landing Page",
      description: "The Oaxaca Restaurant project webpage features Oaxacan cuisine, highlighting the rich culinary heritage of where I come from",
      tags: [
        {
          name: "React",
          color: "blue-text-gradient",
        },
        {
          name: "Figma",
          color: "green-text-gradient",
        },
        {
          name: "Tailwind CSS",
          color: "pink-text-gradient",
        },
      ],
      image: oaxaca,
      source_code_link: "https://github.com/Carlos2902/oaxaca-restaurant",
    },
    
        {
      name: "Skill2Go",
      description: "Developed a Django REST Framework platform for skill exchange with intelligent AI-driven matchmaking (Mixtral-v8) and interactive language learning (Kokoro TTS). Integrated a Ganache blockchain for provider skill certifications and admin approval.",
      tags: [
        {
          name: "Django",
          color: "blue-text-gradient",
        },
        {
          name: "Blockchain",
          color: "green-text-gradient",
        },
        {
          name: "Mixtral-v8",
          color: "pink-text-gradient",
        },
      ],
      image: skill2go,
      source_code_link: "https://github.com/Carlos2902/Skill2Go",
    },



    {
      name: "GPT-SummarizeHub Rapid Article Summarizer",
      description:"Web application summarizer created with the use of the Article Extractor and Summarizer API.  The API efficiently extracts and summarizes articles from specified URLs.      ",
      tags: [
        {
          name: "React",
          color: "blue-text-gradient",
        },
        {
          name: "API",
          color: "green-text-gradient",
        },
        {
          name: "Tailwind",
          color: "pink-text-gradient",
        },
      ],
      image: gpt,
      source_code_link: "https://github.com/Carlos2902/GPT-SummarizeHub-Rapid-Article-Summarizer",
    },
    
    {
      name: "Airhub Travel Tracker Web Application",
      description:"Web application designed to assist travelers in tracking flights. it offers complex functionalities for flying radar, tracking planes, accessing arrival schedule and weather checking",
      tags: [
        {
          name: "Javascript",
          color: "blue-text-gradient",
        },
        {
          name: "API",
          color: "green-text-gradient",
        },
        {
          name: "Bootstrap",
          color: "pink-text-gradient",
        },
      ],
      image: travel,
      source_code_link: "https://github.com/Carlos2902/AirHub-Travel-Tracker",
    },

    {
      name: "Mobile project",
      description:"Designed a mobile app prototype in Figma  to help truck drivers across North America locate nearby service stations along their routes. Followed a full UX process from paper sketches and low-fidelity wireframes to high-fidelity mockups and interactive prototypes. Focused on intuitive navigation, user testing, and design accessibility to support the critical needs of the transportation industry.",
      tags: [
        {
          name: "Figma",
          color: "blue-text-gradient",
        },
      ],
      image: mobile_project,
      source_code_link: "https://www.figma.com/design/dLO0Hud92h9uPotfeWG2hu/Group-Presentation-for-the-Mobile-App?node-id=64-2&t=JbEDN3f14Rgkzw2s-1",
    },
    

 
  ];
  
  export { services, technologies, experiences, testimonials, projects };