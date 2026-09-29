import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { testimonials } from "../content";
import { fadeUpOnEnter, registerAnchor, splitLines, useMotion } from "../lib/motion";
import { SectionLabel } from "./ui";

const initials = (name) =>
  name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

const Testimonials = () => {
  const { ready, pinned, reduced } = useMotion();
  const section = useRef(null);

  useGSAP(
    () => {
      if (!ready || reduced) return;
      const q = gsap.utils.selector(section);
      const cards = q("[data-quote]");

      // Only pin when the whole layout fits on screen; otherwise just reveal on enter.
      if (!pinned || section.current.offsetHeight > window.innerHeight) {
        fadeUpOnEnter([...q("[data-anim='label'], [data-heading]"), ...cards], section.current);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 1.1}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          refreshPriority: 2,
        },
      });

      tl.from(q("[data-anim='label']"), { autoAlpha: 0, x: -20, duration: 0.3 }, 0)
        .from(splitLines(q("[data-heading]")[0]).lines, { yPercent: 115, duration: 0.45, ease: "power4", stagger: 0.06 }, 0)
        .from(
          cards,
          {
            xPercent: (i) => (i % 2 ? 45 : -45),
            yPercent: 12,
            rotation: (i) => (i % 2 ? 5 : -5),
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          0.1
        )
        .from(q("[data-quote-mark]"), { scale: 0.4, autoAlpha: 0, duration: 0.3, stagger: 0.12, ease: "back.out(2)" }, 0.5)
        .addLabel("formed")
        .to({}, { duration: 0.2 });

      return registerAnchor("testimonials", () => tl.scrollTrigger.labelToScroll("formed"));
    },
    { scope: section, dependencies: [ready, pinned, reduced], revertOnUpdate: true }
  );

  return (
    <section id="testimonials" ref={section} data-theme="light" className="relative overflow-hidden">
      <div className={`page-x with-rail gap-y-6 ${pinned ? "min-h-[100svh] content-center py-24" : "py-24 lg:py-32"}`}>
        <div className="lg:pt-6">
          <SectionLabel num="03">Testimonials</SectionLabel>
        </div>

        <div className="min-w-0">
          <h2 data-heading className="section-heading">
            Testimonials
          </h2>

          <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-7">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                data-quote
                className="flex flex-col justify-between rounded-3xl bg-[color:var(--chip)] p-7 sm:p-9 lg:p-10"
              >
                <div>
                  <span
                    data-quote-mark
                    className="block h-12 font-serif text-[5.5rem] leading-[0.9] text-accent"
                    aria-hidden="true"
                  >
                    “
                  </span>
                  <blockquote className="mt-2 text-[0.98rem] leading-[1.7] text-ink/80 lg:text-[1.02rem]">
                    <p>{t.quote}</p>
                  </blockquote>
                </div>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-[0.8rem] font-medium tracking-wide text-paper"
                    aria-hidden="true"
                  >
                    {initials(t.name)}
                  </span>
                  <span>
                    <span className="block font-semibold tracking-[-0.01em]">{t.name}</span>
                    <span className="block font-serif text-[1.05rem] italic text-muted">
                      {t.title}, {t.company}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
