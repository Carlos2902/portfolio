import { useEffect, useRef } from "react";

/*
 * "Hover chroma" liquid background: a full-screen shader renders a slow, glossy liquid surface
 * (domain-warped noise shaded like polished chrome, with a slight RGB split at the highlights).
 * The scene sits almost dark; the pointer's trail lights it up and pushes the liquid along.
 * With no pointer (touch, idle), a slow autopilot keeps a faint ribbon moving.
 */

const TRAIL = 48; // pointer history samples sent to the shader
const CONFIG = {
  renderScale: 0.55, // the liquid is smooth, so render below screen resolution and let CSS scale it
  ambient: 0.03, // how much of the liquid shows with no pointer nearby
  trailFade: 1.9, // per second
  trailRadius: 0.0045, // a fine line of light rather than a wide spotlight
  idleAfter: 2200,
};

const VERT = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uAmbient, uRadius;
uniform vec4 uTrail[${TRAIL}]; // xy: position (0..1), zw: velocity
uniform float uStrength[${TRAIL}];
out vec4 fragColor;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float f = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { f += a * noise(p); p = m * p; a *= 0.45; }
  return f;
}
// Liquid height: noise warped by noise, drifting slowly; "push" bends it along the pointer's motion.
float height(vec2 p, vec2 push) {
  float t = uTime * 0.022;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 1.4 * q + vec2(1.7, 9.2) + push), fbm(p + 1.4 * q + vec2(8.3, 2.8) + t * 0.7));
  return fbm(p + 1.6 * r);
}
// Studio "environment" reflected by the chrome: two soft light strips and a faint floor glow.
float env(vec3 r) {
  float strip = pow(max(0.0, 1.0 - abs(r.y - 0.38) * 4.5), 6.0);
  float side = 0.45 * pow(max(0.0, 1.0 - abs(r.x + 0.45) * 5.0), 6.0);
  float floorGlow = 0.05 * smoothstep(-0.2, -0.9, r.y);
  return strip + side + floorGlow;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;

  float glow = 0.0;
  vec2 push = vec2(0.0);
  for (int i = 0; i < ${TRAIL}; i++) {
    vec2 d = (uv - uTrail[i].xy) * vec2(aspect, 1.0);
    float g = exp(-dot(d, d) / uRadius) * uStrength[i];
    glow += g;
    push += uTrail[i].zw * g;
  }
  glow = clamp(glow, 0.0, 0.85);
  push = clamp(push * 0.15, vec2(-0.3), vec2(0.3)); // a gentle bend, no whirlpools

  vec2 p = uv * vec2(aspect, 1.0) * 0.6;
  const float e = 0.003;
  float h = height(p, push);
  vec2 grad = vec2(height(p + vec2(e, 0.0), push) - h, height(p + vec2(0.0, e), push) - h) / e;
  vec3 n = normalize(vec3(-grad * 0.3, 1.0));

  // Slightly different normals per channel: a chromatic split right on the highlights.
  vec3 view = vec3(0.0, 0.0, -1.0);
  vec3 split = vec3(grad.y, -grad.x, 0.0) * 0.014;
  float r = env(reflect(view, normalize(n + split)));
  float g = env(reflect(view, n));
  float b = env(reflect(view, normalize(n - split)));
  vec3 chrome = vec3(r, g, b) * vec3(1.0, 0.97, 0.93);

  // Fresnel-like rim on steep folds.
  chrome += pow(1.0 - n.z, 2.0) * 0.18 * vec3(0.8, 0.86, 1.0);

  float visible = uAmbient + glow;
  vec2 v = uv - 0.5;
  float vignette = smoothstep(0.95, 0.25, length(v * vec2(aspect * 0.8, 1.0)));
  vec3 col = chrome * visible * mix(0.55, 1.0, vignette);
  fragColor = vec4(1.0 - exp(-col * 1.25), 1.0);
}`;

function createLiquid(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const loc = (n) => gl.getUniformLocation(program, n);
  const u = { res: loc("uRes"), time: loc("uTime"), ambient: loc("uAmbient"), radius: loc("uRadius"), trail: loc("uTrail"), strength: loc("uStrength") };

  return {
    render(time, trail, strength) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(u.res, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.ambient, CONFIG.ambient);
      gl.uniform1f(u.radius, CONFIG.trailRadius);
      gl.uniform4fv(u.trail, trail);
      gl.uniform1fv(u.strength, strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    // Free GPU resources but keep the context: React may remount on the same canvas, and
    // getContext() would hand back a lost context (which paints white).
    dispose() {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(quad);
    },
  };
}

const LiquidFlow = ({ area, active = true }) => {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = area.current;
    const sizeCanvas = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * CONFIG.renderScale;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    };
    sizeCanvas();

    const onLost = (e) => {
      e.preventDefault();
      canvas.style.visibility = "hidden";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    let liquid = null;
    try {
      liquid = createLiquid(canvas);
    } catch (e) {
      console.warn("LiquidFlow disabled:", e);
    }
    if (!liquid) {
      canvas.style.visibility = "hidden";
      return () => canvas.removeEventListener("webglcontextlost", onLost);
    }

    // Ring buffer of recent pointer samples: position, velocity and a strength that fades out.
    const trail = new Float32Array(TRAIL * 4);
    const strength = new Float32Array(TRAIL);
    let head = 0;
    const push = (x, y, vx, vy, s) => {
      trail.set([x, y, vx, vy], head * 4);
      strength[head] = s;
      head = (head + 1) % TRAIL;
    };

    const pointer = { x: 0, y: 0, lastInput: -Infinity, lastSample: 0, pending: null };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      const now = performance.now();
      const fresh = now - pointer.lastInput > 500;
      const vx = fresh ? 0 : x - pointer.x;
      const vy = fresh ? 0 : y - pointer.y;
      pointer.pending = { x, y, vx, vy };
      Object.assign(pointer, { x, y, lastInput: now });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(host);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sizeCanvas, 150);
    };
    window.addEventListener("resize", onResize);

    const start = performance.now();
    let last = start;
    let auto = { x: 0.5, y: 0.5 };
    let frame = 0;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden || !activeRef.current) return;

      const fade = Math.exp(-dt * CONFIG.trailFade);
      for (let i = 0; i < TRAIL; i++) strength[i] *= fade;

      if (pointer.pending && now - pointer.lastSample > 12) {
        const { x, y, vx, vy } = pointer.pending;
        const speed = Math.min(1, Math.hypot(vx, vy) * 40);
        // Fill the gap from the previous sample so fast strokes stay one continuous line.
        const steps = Math.min(4, Math.ceil(Math.hypot(vx, vy) / 0.012));
        for (let i = steps - 1; i >= 1; i--) push(x - (vx * i) / steps, y - (vy * i) / steps, vx * 60, vy * 60, 0.3 + speed * 0.5);
        push(x, y, vx * 60, vy * 60, 0.3 + speed * 0.5);
        pointer.pending = null;
        pointer.lastSample = now;
      } else if (now - pointer.lastInput > CONFIG.idleAfter && now - pointer.lastSample > 40) {
        const t = now / 1000;
        const x = 0.5 + 0.34 * Math.sin(t * 0.14);
        const y = 0.5 + 0.26 * Math.sin(t * 0.22 + 1.3);
        push(x, y, (x - auto.x) * 60, (y - auto.y) * 60, 0.22);
        auto = { x, y };
        pointer.lastSample = now;
      }

      liquid.render((now - start) / 1000, trail, strength);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onLost);
      io.disconnect();
      liquid.dispose();
    };
  }, [area]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full mix-blend-screen" aria-hidden="true" />;
};

export default LiquidFlow;
