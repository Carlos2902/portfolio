import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, PresentationControls, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import fallbackLogo from "../../assets/logo-c-white.png";

const MODEL_URL = "/models/midnight-curl.glb";

// Key light from above and slightly in front, matching the soft wash at the top of the hero.
const SUN = [0.8, 6, 3];

// Chroma on hover: thin-film iridescence fades in while the pointer is over the logo.
const IRIDESCENCE = { rest: 0.15, hover: 1 };
// On hover the glossy topcoat eases off so the iridescent layer underneath shows its colour.
const CLEARCOAT = { rest: 1, hover: 0.25 };

// Polished ebony, like a chess piece: dark wood grain under a glossy lacquer (clearcoat).
const material = new THREE.MeshPhysicalMaterial({
  color: "#0a0706",
  roughness: 0.32,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: 1.1,
  iridescence: IRIDESCENCE.rest,
  iridescenceIOR: 1.6,
  iridescenceThicknessRange: [260, 820],
});

// The model has no UVs, so the grain is procedural and 3D (object space): it wraps every curve seamlessly.
const EBONY_GLSL = /* glsl */ `
varying vec3 vObjPos;
float ebHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float ebNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ebHash(i), ebHash(i + vec3(1, 0, 0)), f.x), mix(ebHash(i + vec3(0, 1, 0)), ebHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(ebHash(i + vec3(0, 0, 1)), ebHash(i + vec3(1, 0, 1)), f.x), mix(ebHash(i + vec3(0, 1, 1)), ebHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float ebFbm(vec3 p) { float f = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { f += a * ebNoise(p); p *= 2.03; a *= 0.5; } return f; }
// Grain runs along the piece's height, like wood turned on a lathe; an off-centre ring gives long curved streaks.
float ebonyGrain(vec3 p) {
  float warp = ebFbm(p * vec3(2.2, 0.45, 2.2)) * 7.5 + ebFbm(p * vec3(9.0, 1.2, 9.0)) * 1.5;
  float rings = length(p.xz + vec2(0.9, 0.35)) * 17.0 + warp;
  float lines = pow(0.5 + 0.5 * sin(rings * 3.14159), 5.0) * smoothstep(0.25, 0.7, ebFbm(p * vec3(4.0, 0.8, 4.0) + 3.1));
  float fibers = ebFbm(p * vec3(60.0, 3.0, 60.0));
  return clamp(lines * 0.65 + fibers * 0.55 - 0.18, 0.0, 1.0);
}
`;

material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${EBONY_GLSL}`)
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float grain = ebonyGrain(vObjPos);
      diffuseColor.rgb = mix(vec3(0.009, 0.006, 0.0045), vec3(0.074, 0.045, 0.029), grain);`
    )
    .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.24, 0.44, grain);");
};
material.customProgramCacheKey = () => "ebony-v2";

function Logo({ onReady }) {
  const { scene } = useGLTF(MODEL_URL);
  const hovered = useRef(false);
  const logo = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if (o.isMesh) o.material = material;
    });
    return root;
  }, [scene]);

  // Compile the materials in the background (KHR_parallel_shader_compile) before reporting ready,
  // so the preloader lifts onto a smooth first frame instead of a shader-compile stall.
  const gl = useThree((s) => s.gl);
  const scene3d = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const compiled = gl.compileAsync ? gl.compileAsync(scene3d, camera) : Promise.resolve();
    compiled.catch(() => {}).then(() => alive && onReady());
    return () => {
      alive = false;
    };
  }, [gl, scene3d, camera, onReady]);

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 4);
    const on = hovered.current;
    material.iridescence += ((on ? IRIDESCENCE.hover : IRIDESCENCE.rest) - material.iridescence) * k;
    material.clearcoat += ((on ? CLEARCOAT.hover : CLEARCOAT.rest) - material.clearcoat) * k;
  });

  // The model's letter reads correctly from behind, so turn it around.
  return (
    <primitive
      object={logo}
      rotation={[0, Math.PI, 0]}
      onPointerOver={() => (hovered.current = true)}
      onPointerOut={() => (hovered.current = false)}
    />
  );
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
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.4], fov: 32 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          frameloop={visible ? "always" : "never"}
          style={{ touchAction: "pan-y" }}
          aria-label="3D logo: a black satin calligraphic C. Drag to rotate."
          role="img"
        >
          <Suspense fallback={null}>
            <Environment resolution={256} frames={1}>
              <Lightformer form="rect" intensity={3.5} color="#fff3e2" position={SUN} rotation-x={Math.PI / 2} scale={[9, 4, 1]} />
              <Lightformer form="rect" intensity={1.3} color="#f4f1ff" position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[12, 5, 1]} />
              <Lightformer form="rect" intensity={1.1} color="#fff4ea" position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[12, 5, 1]} />
              <Lightformer form="rect" intensity={0.6} position={[0, 0, 7]} scale={[10, 6, 1]} />
              <Lightformer form="ring" intensity={0.4} position={[0, -4, 4]} scale={4} />
            </Environment>
            <directionalLight position={SUN} intensity={1.3} color="#fff1df" />
            <ambientLight intensity={0.22} />

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
