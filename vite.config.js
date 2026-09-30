import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { site, links, hero, projects, experience, testimonials, faq } from "./src/content.js";

/*
 * SEO / AEO build step. The site is a client-rendered React app, and most AI crawlers (and the first
 * pass of Google's) don't run JavaScript, so on their own they'd see an empty <div id="root">.
 * From src/content.js (the same copy the React app renders) this plugin writes:
 *   - the <head> metadata: title, description, canonical, Open Graph, Twitter
 *   - JSON-LD structured data: Person, ProfessionalService, WebSite, ProfilePage, projects, FAQPage
 *   - a semantic HTML copy of the page inside #root, which React replaces on load
 *   - /llms.txt (a plain summary for AI assistants) and /sitemap.xml
 */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (href) => (href.startsWith("http") ? href : `${site.url}${href}`);
const OG_IMAGE = `${site.url}/og-image.png`;

function headTags() {
  return `
    <title>${esc(site.title)}</title>
    <meta name="description" content="${esc(site.description)}" />
    <link rel="canonical" href="${site.url}/" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="author" content="${esc(site.name)}" />
    <meta name="geo.region" content="${site.country}-${site.region}" />
    <meta name="geo.placename" content="${esc(site.city)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="${esc(site.name)}" />
    <meta property="og:locale" content="en_CA" />
    <meta property="og:url" content="${site.url}/" />
    <meta property="og:title" content="${esc(site.title)}" />
    <meta property="og:description" content="${esc(site.description)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(`${site.name}, ${site.jobTitle.toLowerCase()} in ${site.city}`)}" />
    <meta property="profile:first_name" content="Carlos" />
    <meta property="profile:last_name" content="Lopez" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(site.title)}" />
    <meta name="twitter:description" content="${esc(site.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <meta name="twitter:image:alt" content="${esc(`${site.name}, ${site.jobTitle.toLowerCase()} in ${site.city}`)}" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <script type="application/ld+json">${jsonLd()}</script>`;
}

function jsonLd() {
  const person = `${site.url}/#person`;
  const address = {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressRegion: site.region,
    addressCountry: site.country,
  };
  const areaServed = [
    { "@type": "City", name: "Toronto" },
    { "@type": "AdministrativeArea", name: "Greater Toronto Area" },
    { "@type": "AdministrativeArea", name: site.regionName },
    { "@type": "Country", name: "Canada" },
  ];
  const projectNodes = projects.map((p, i) => {
    const primary = p.links.find((l) => /apps\.apple|play\.google|Live site/.test(l.href + l.label)) ?? p.links[0];
    const caseStudy = p.links.find((l) => l.label === "Case study");
    const node = {
      "@type": p.kind === "Mobile app" ? "MobileApplication" : "WebSite",
      "@id": `${site.url}/#project-${i + 1}`,
      name: `${p.name}${p.kind === "Mobile app" ? "" : ` ${p.kind.toLowerCase()}`}`,
      description: p.description,
      url: abs(primary.href),
      creator: { "@id": person },
      keywords: p.tech.join(", "),
      ...(p.image && { image: abs(p.image) }),
      ...(caseStudy && { subjectOf: { "@type": "CreativeWork", name: `${p.name} case study`, url: abs(caseStudy.href) } }),
    };
    if (p.kind === "Mobile app") {
      Object.assign(node, {
        operatingSystem: "iOS, Android",
        applicationCategory: "BusinessApplication",
        sameAs: p.links.filter((l) => /apps\.apple|play\.google/.test(l.href)).map((l) => l.href),
        offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
      });
    }
    return node;
  });

  const graph = [
    {
      "@type": "Person",
      "@id": person,
      name: site.name,
      givenName: "Carlos",
      familyName: "Lopez",
      jobTitle: site.jobTitle,
      description: faq[0].a,
      url: `${site.url}/`,
      image: OG_IMAGE,
      address,
      homeLocation: { "@type": "Place", name: `${site.city}, ${site.regionName}, Canada`, address },
      knowsAbout: site.skills,
      knowsLanguage: site.languages,
      alumniOf: [...new Set(site.education.map((e) => e.name))].map((name) => ({ "@type": "CollegeOrUniversity", name })),
      hasOccupation: {
        "@type": "Occupation",
        name: site.jobTitle,
        occupationLocation: { "@type": "City", name: site.city },
        skills: site.skills.join(", "),
      },
      sameAs: [links.linkedin, links.github],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${site.url}/#service`,
      name: `${site.name}, ${site.jobTitle}`,
      description: site.description,
      url: `${site.url}/`,
      image: OG_IMAGE,
      logo: `${site.url}/apple-touch-icon.png`,
      founder: { "@id": person },
      employee: { "@id": person },
      address,
      areaServed,
      knowsLanguage: site.languages,
      sameAs: [links.linkedin, links.github],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Design and development services",
        itemListElement: site.services.map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, provider: { "@id": person }, areaServed },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      description: site.description,
      inLanguage: "en-CA",
      publisher: { "@id": person },
    },
    {
      "@type": "ProfilePage",
      "@id": `${site.url}/#webpage`,
      url: `${site.url}/`,
      name: site.title,
      description: site.description,
      inLanguage: "en-CA",
      isPartOf: { "@id": `${site.url}/#website` },
      mainEntity: { "@id": person },
      about: { "@id": person },
      primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
      dateModified: new Date().toISOString().slice(0, 10),
      hasPart: projectNodes.map((p) => ({ "@id": p["@id"] })),
    },
    ...projectNodes,
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      isPartOf: { "@id": `${site.url}/#webpage` },
      mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  // "<" escaped so the JSON can never close the <script> tag.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

// Semantic, crawler-readable copy of the page. React replaces it on load.
function snapshot() {
  const linkList = (ls) => `<ul>${ls.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>`;
  return `
<header>
  <a href="/">${esc(site.name)}</a>
  <nav aria-label="Main"><a href="#projects">Projects</a> <a href="#work">Work</a> <a href="${esc(links.resume)}">Resume</a></nav>
</header>
<main>
  <section id="top">
    <h1>${esc(hero.eyebrow)}</h1>
    <h2>${esc(hero.headline)}</h2>
    <p>${esc(hero.subline)}</p>
    <p><a href="#contact">Start a project</a> · <a href="#projects">See my work</a></p>
  </section>
  <section id="projects">
    <h2>Selected projects</h2>
    ${projects
      .map(
        (p) => `<article>
      <h3>${esc(p.name)} (${esc(p.kind)})</h3>
      <p>${esc(p.description)}</p>
      <p>Technologies: ${esc(p.tech.join(", "))}</p>
      ${linkList(p.links)}
    </article>`
      )
      .join("\n    ")}
  </section>
  <section id="work">
    <h2>Where I’ve worked</h2>
    ${experience
      .map(
        (j) => `<article>
      <h3>${esc(j.role)}, ${esc(j.company)}</h3>
      <p>${esc(j.location)} · ${esc(j.dates)}</p>
      <ul>${j.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
    </article>`
      )
      .join("\n    ")}
  </section>
  <section id="testimonials">
    <h2>Testimonials</h2>
    ${testimonials
      .map(
        (t) => `<figure><blockquote><p>${esc(t.quote)}</p></blockquote><figcaption>${esc(t.name)}, ${esc(t.title)}, ${esc(t.company)}</figcaption></figure>`
      )
      .join("\n    ")}
  </section>
  <section id="contact">
    <h2>Have a project in mind? Let’s build it.</h2>
    <p>Tell me who you are and what you’re working on through the contact form, or message me on <a href="${links.linkedin}">LinkedIn</a>.</p>
  </section>
  <section id="faq">
    <h2>Questions, answered</h2>
    ${faq.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n    ")}
  </section>
</main>
<footer>
  <p>${esc(site.name)}, ${esc(site.jobTitle.toLowerCase())} in ${esc(site.city)}, ${esc(site.regionName)}.</p>
  <p><a href="${esc(links.resume)}">Resume</a> · <a href="${links.github}">GitHub</a> · <a href="${links.linkedin}">LinkedIn</a></p>
</footer>`;
}

// https://llmstxt.org: a plain summary AI assistants can read in one request.
function llmsTxt() {
  return `# ${site.name}

> ${site.name} is a product designer and full-stack developer in ${site.city}, ${site.regionName}, Canada. He designs interfaces in Figma and Claude Design, then builds, launches and maintains web and mobile apps: APIs, payments, security, app store releases and deployment. Works in ${site.languages.join(" and ")}.

- Website: ${site.url}/
- Hire / contact: ${site.url}/#contact (contact form) or LinkedIn: ${links.linkedin}
- Resume (PDF): ${abs(links.resume)}
- GitHub: ${links.github}

## Services

${site.services.map((s) => `- ${s}`).join("\n")}

Serves ${site.areaServed.join(", ")}.

## Projects

${projects
  .map((p) => `- ${p.name} (${p.kind}): ${p.description} Technologies: ${p.tech.join(", ")}. Links: ${p.links.map((l) => `[${l.label}](${abs(l.href)})`).join(", ")}`)
  .join("\n")}

## Experience

${experience.map((j) => `- ${j.role}, ${j.company}, ${j.location} (${j.dates}): ${j.points.join("; ")}`).join("\n")}

## Skills

${site.skills.join(", ")}

## Education

${site.education.map((e) => `- ${e.credential}, ${e.name}`).join("\n")}

## Testimonials

${testimonials.map((t) => `- "${t.quote}" (${t.name}, ${t.title}, ${t.company})`).join("\n")}

## FAQ

${faq.map(({ q, a }) => `### ${q}\n\n${a}`).join("\n\n")}
`;
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${site.url}/`, priority: "1.0" },
    { loc: `${site.url}/latinolink`, priority: "0.7" },
    { loc: `${site.url}/latinolink/es`, priority: "0.5" },
    { loc: abs(links.resume), priority: "0.6" },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
}

function seo() {
  return {
    name: "seo-prerender",
    transformIndexHtml(html) {
      return html
        .replace("<!--seo-head-->", headTags())
        .replace('<div id="root"></div>', `<div id="root">${snapshot()}</div>`);
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt() });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml() });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), seo()],
});
