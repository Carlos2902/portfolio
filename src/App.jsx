import { useCallback, useState } from "react";
import MotionProvider from "./components/MotionProvider";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const App = () => {
  const [modelReady, setModelReady] = useState(false);
  const [ready, setReady] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const onPreloaderDone = useCallback(() => setReady(true), []);

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
      </main>
      <Footer />
    </MotionProvider>
  );
};

export default App;
