import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { faq } from "../content";
import { fadeUpOnEnter, useMotion } from "../lib/motion";
import { SectionLabel } from "./ui";

// Direct answers to what people ask search engines and AI assistants. Native <details> keeps every
// answer in the HTML (readable by crawlers) even while collapsed. Mirrored in the FAQPage JSON-LD.
const Faq = () => {
  const { ready, reduced } = useMotion();
  const section = useRef(null);

  useGSAP(
    () => {
      if (!ready || reduced) return;
      const q = gsap.utils.selector(section);
      fadeUpOnEnter([...q("[data-anim='label'], [data-heading]"), ...q("[data-faq-item]")], section.current, 0.04);
    },
    { scope: section, dependencies: [ready, reduced] }
  );

  return (
    <section id="faq" ref={section} data-theme="light" className="relative">
      <div className="page-x with-rail gap-y-6 py-24 lg:py-32">
        <div className="lg:pt-6">
          <SectionLabel num="05">FAQ</SectionLabel>
        </div>

        <div className="min-w-0">
          <h2 data-heading className="section-heading">
            Questions, <em className="accent-serif">answered</em>
          </h2>

          <div className="mt-10 max-w-[56rem] border-t border-line lg:mt-14">
            {faq.map(({ q, a }) => (
              <details key={q} data-faq-item className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.02em]">{q}</h3>
                  <span
                    className="relative h-4 w-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:bg-current after:transition-transform after:duration-300 group-open:after:scale-y-0"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-[46rem] pb-7 text-[1rem] leading-[1.75] text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;
