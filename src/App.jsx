import { useCallback, useLayoutEffect, useState } from "react";
import MotionProvider from "./components/MotionProvider";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

const App = () => {
  const [modelReady, setModelReady] = useState(false);
  const [ready, setReady] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const onPreloaderDone = useCallback(() => setReady(true), []);

  // index.html ships a crawler-readable copy of the content inside #root (see vite.config.js), hidden from
  // visitors by a cover. React has replaced it by now and the preloader is up, so lift the cover.
  useLayoutEffect(() => document.documentElement.classList.add("app-ready"), []);

  return (
    <MotionProvider ready={ready}>
      <Preloader modelReady={modelReady} onDone={onPreloaderDone} />
      <Navbar />
      <main>
        <Hero onModelReady={onModelReady} />
        <Projects />
        <Experience />
        <Testimonials />
        <Contact />
        <Faq />
      </main>
      <Footer />
    </MotionProvider>
  );
};

export default App;
