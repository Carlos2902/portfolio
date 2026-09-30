import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { links } from "../content";
import { fadeUpOnEnter, registerAnchor, splitLines, useMotion } from "../lib/motion";

const FORM_NAME = "contact"; // must match the hidden static form in index.html
const STEPS = [
  { title: "Who are you?", fields: ["name", "email"] },
  { title: "Your project", fields: ["message"] },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field, value) {
  const v = value.trim();
  if (!v) return field === "message" ? "Tell me a little about it." : "Required.";
  if (field === "email" && !EMAIL_RE.test(v)) return "That email doesn’t look right.";
  return null;
}

const encode = (data) => new URLSearchParams(data).toString();

const Field = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="eyebrow block">
      {label}
    </label>
    {children}
    <p id={`${id}-error`} className="mt-2 min-h-[1.25rem] text-[0.82rem] text-accent" aria-live="polite">
      {error}
    </p>
  </div>
);

const ContactForm = () => {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const body = useRef(null);
  const firstInput = useRef({});

  const total = STEPS.length;
  const sent = status === "sent";
  const shownStep = sent ? total : step + 1;
  const progress = sent ? 1 : (step + 1) / (total + 1);

  const animateStep = (next) => {
    const el = body.current;
    gsap.fromTo(el, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" });
    next();
  };

  const checkStep = () => {
    const found = {};
    for (const f of STEPS[step].fields) {
      const e = validate(f, values[f]);
      if (e) found[f] = e;
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) document.getElementById(`contact-${first}`)?.focus();
    return !first;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validate(name, value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!checkStep()) return;
    if (step < total - 1) {
      animateStep(() => setStep(step + 1));
      requestAnimationFrame(() => firstInput.current[step + 1]?.focus());
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": FORM_NAME, "bot-field": e.target["bot-field"].value, ...values }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      animateStep(() => setStatus("sent"));
    } catch {
      setStatus("error");
    }
  };

  const inputProps = (f) => ({
    id: `contact-${f}`,
    name: f,
    value: values[f],
    onChange,
    "aria-invalid": errors[f] ? "true" : "false",
    "aria-describedby": `contact-${f}-error`,
  });

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col"
    >
      <input type="hidden" name="form-name" value={FORM_NAME} />
      <p className="hidden">
        <label>
          Don’t fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className="flex items-baseline justify-between border-b border-white/10 pb-5">
        <p className="tabular-nums">
          <span className="text-[1.9rem] font-medium tracking-[-0.03em]">{String(shownStep).padStart(2, "0")}</span>
          <span className="font-serif text-lg italic text-muted"> / {String(total).padStart(2, "0")}</span>
        </p>
        <p className="font-serif text-xl italic text-white/70">{sent ? "Message sent" : STEPS[step].title}</p>
      </div>

      <div ref={body} className="min-h-[15.5rem] pt-8">
        {sent ? (
          <div className="flex h-full flex-col justify-center gap-4 py-6">
            <p className="font-serif text-[2rem] italic leading-tight">Thanks, {values.name.trim().split(" ")[0]}.</p>
            <p className="max-w-sm text-white/60">Your message is on its way. I’ll get back to you at {values.email.trim()}.</p>
          </div>
        ) : step === 0 ? (
          <div className="space-y-6">
            <Field id="contact-name" label="Full name" error={errors.name}>
              <input
                {...inputProps("name")}
                ref={(el) => (firstInput.current[0] = el)}
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className="field"
              />
            </Field>
            <Field id="contact-email" label="Email" error={errors.email}>
              <input {...inputProps("email")} type="email" autoComplete="email" placeholder="jane@company.com" className="field" />
            </Field>
          </div>
        ) : (
          <Field id="contact-message" label="What are you building?" error={errors.message}>
            <textarea
              {...inputProps("message")}
              ref={(el) => (firstInput.current[1] = el)}
              rows={5}
              placeholder="A few lines about the project, timeline and anything else I should know."
              className="field resize-none leading-relaxed"
            />
          </Field>
        )}
      </div>

      {!sent && (
        <div className="mt-2 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => animateStep(() => setStep(step - 1))}
              className="text-[0.82rem] font-medium uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-paper"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="pill-button border-white/30 hover:border-paper hover:bg-paper hover:text-ink disabled:opacity-60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {step < total - 1 ? "Continue" : status === "sending" ? "Sending…" : "Send message"}
          </button>
        </div>
      )}

      <div className="mt-8 h-px w-full bg-white/10">
        <div className="h-full origin-left bg-paper transition-transform duration-700 ease-out" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="mt-5 text-[0.85rem] text-white/50" aria-live="polite">
        {status === "error" ? (
          <span className="text-accent">
            Something went wrong. Please try again, or reach me on{" "}
            <a href={links.linkedin} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              LinkedIn
            </a>
            .
          </span>
        ) : (
          "Two quick steps. No mailing lists, just a reply."
        )}
      </p>
    </form>
  );
};

const Contact = () => {
  const { ready, pinned, reduced } = useMotion();
  const section = useRef(null);

  useGSAP(
    () => {
      if (!ready || reduced) return;
      const q = gsap.utils.selector(section);

      if (!pinned || section.current.offsetHeight > window.innerHeight) {
        fadeUpOnEnter(q("[data-anim]"), section.current);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.6}`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      });

      tl.from(q("[data-anim='pill']"), { autoAlpha: 0, y: 20, duration: 0.3 }, 0)
        .from(splitLines(q("[data-anim='title']")[0]).lines, { yPercent: 115, duration: 0.45, ease: "power4" }, 0.05)
        .from(splitLines(q("[data-anim='statement']")[0]).lines, { yPercent: 115, duration: 0.5, ease: "power4" }, 0.15)
        .from(q("[data-anim='underline']"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.45, ease: "power2.inOut" }, 0.35)
        .from(q("[data-anim='copy']"), { autoAlpha: 0, y: 24, duration: 0.35 }, 0.4)
        .from(q("[data-anim='card']"), { xPercent: 35, rotation: 4, transformOrigin: "0% 100%", autoAlpha: 0, duration: 0.7 }, 0.1)
        .addLabel("formed")
        .to({}, { duration: 0.2 });

      return registerAnchor("contact", () => tl.scrollTrigger.labelToScroll("formed"));
    },
    { scope: section, dependencies: [ready, pinned, reduced], revertOnUpdate: true }
  );

  return (
    <section id="contact" ref={section} data-theme="dark" className="relative overflow-hidden">
      <div
        className={`page-x grid items-center gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] ${
          pinned ? "min-h-[100svh] py-24" : "py-24 lg:py-32"
        }`}
      >
        <div>
          <p data-anim="pill" className="inline-flex items-center gap-3 rounded-full border border-white/15 px-5 py-2.5 eyebrow">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--accent)] opacity-60 motion-reduce:animate-none" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
            </span>
            Open to new projects
          </p>

          <h2 data-anim="title" className="mt-10 font-serif text-[clamp(2.6rem,5.6vw,5.25rem)] italic leading-[1.02] text-white/55">
            Have a project in mind?
          </h2>

          <div className="mt-4 inline-block">
            <p
              data-anim="statement"
              className="font-semibold leading-[0.95] tracking-[-0.045em] text-[clamp(2.75rem,6.6vw,6.25rem)]"
            >
              Let’s build it.
            </p>
            <span data-anim="underline" className="mt-4 block h-[3px] w-full bg-paper" aria-hidden="true" />
          </div>

          <p data-anim="copy" className="mt-8 max-w-[26rem] text-[1.02rem] leading-[1.7] text-white/60">
            Tell me who you are and what you’re working on. Apps, websites, APIs, payments: if it needs building, I’m interested.
          </p>
        </div>

        <div
          data-anim="card"
          className="relative rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10 lg:-mr-12 lg:rounded-r-none lg:border-r-0 lg:py-12 lg:pl-12 lg:pr-16"
        >
          <span
            className="absolute -left-8 top-[4.4rem] hidden h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-ink lg:flex"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-paper" />
          </span>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default Contact;
