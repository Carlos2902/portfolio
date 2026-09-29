import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Lightformer, PresentationControls, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import fallbackLogo from "../../assets/logo-c-white.png";

const MODEL_URL = "/models/midnight-curl.glb";

// The "sun": same direction as the CSS light rays (above, slightly in front), so the beams seem to hit the logo.
const SUN = [0.8, 6, 3];

// Black satin under a glossy clearcoat: soft body, mirror-like highlight where the sun hits.
const material = new THREE.MeshPhysicalMaterial({
  color: "#070707",
  roughness: 0.34,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  sheen: 0.35,
  sheenColor: new THREE.Color("#8a8a8a"),
  sheenRoughness: 0.5,
  envMapIntensity: 1.25,
});

function Logo({ onReady }) {
  const { scene } = useGLTF(MODEL_URL);
  const logo = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if (o.isMesh) o.material = material;
    });
    return root;
  }, [scene]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  // The model's letter reads correctly from behind, so turn it around.
  return <primitive object={logo} rotation={[0, Math.PI, 0]} />;
}

const Fallback = ({ onReady }) => {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <div className="flex h-full items-center justify-center">
      <img src={fallbackLogo} alt="" className="h-1/2 w-auto opacity-90" />
    </div>
  );
};

const LogoScene = ({ onReady, reduced }) => {
  const wrapper = useRef(null);
  const [visible, setVisible] = useState(true);

  // Stop rendering while the hero is off screen.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(wrapper.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="h-full w-full">
      <ErrorBoundary fallbackRender={() => <Fallback onReady={onReady} />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5.4], fov: 32 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          frameloop={visible ? "always" : "never"}
          style={{ touchAction: "pan-y" }}
          aria-label="3D logo: a black satin calligraphic C. Drag to rotate."
          role="img"
        >
          <Suspense fallback={null}>
            <Environment resolution={256} frames={1}>
              <Lightformer form="rect" intensity={9} color="#fff3e2" position={SUN} rotation-x={Math.PI / 2} scale={[5, 2.5, 1]} />
              <Lightformer form="rect" intensity={0.9} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
              <Lightformer form="rect" intensity={0.6} position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
              <Lightformer form="ring" intensity={0.5} position={[0, -4, 4]} scale={3} />
            </Environment>
            <directionalLight position={SUN} intensity={2.4} color="#fff1df" />
            <ambientLight intensity={0.08} />

            <PresentationControls
              global={false}
              cursor
              snap
              speed={1.6}
              polar={[-0.35, 0.35]}
              azimuth={[-Infinity, Infinity]}
              config={{ mass: 1, tension: 170, friction: 26 }}
            >
              <Float speed={reduced ? 0 : 1.3} rotationIntensity={reduced ? 0 : 0.3} floatIntensity={reduced ? 0 : 0.7} floatingRange={[-0.08, 0.08]}>
                <Logo onReady={onReady} />
              </Float>
            </PresentationControls>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

useGLTF.preload(MODEL_URL);

export default LogoScene;
