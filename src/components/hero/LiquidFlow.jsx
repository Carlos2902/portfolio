import { useEffect, useRef } from "react";

/*
 * "Hover chroma" liquid background: a full-screen shader renders a slow, glossy liquid surface
 * (domain-warped noise shaded like polished chrome, with a slight RGB split at the highlights).
 * The scene sits almost dark; the pointer's trail lights it up and pushes the liquid along.
 * With no pointer (touch, idle), a slow autopilot keeps a faint ribbon moving.
 */

const TRAIL = 48; // pointer history samples sent to the shader
const CONFIG = {
  // The liquid is smooth, so it renders below screen resolution (CSS scales it up) within a pixel budget.
  pixelBudget: { fine: 650_000, coarse: 300_000 },
  ambient: 0.03, // how much of the liquid shows with no pointer nearby
  trailFade: 1.9, // per second
  trailRadius: 0.0045, // a fine line of light rather than a wide spotlight
  pushRadius: 0.03, // the bend spreads wider and softer than the light line, so the surface stays silky
  idleAfter: 2200,
};

const VERT = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const HEADER = `#version 300 es
precision highp float;
out vec4 fragColor;
`;

// Liquid surface: noise warped by noise, drifting slowly; the pointer trail lights it and bends it.
const SURFACE = `
uniform float uTime, uRadius, uPushRadius;
uniform vec4 uTrail[${TRAIL}]; // xy: position (0..1), zw: velocity
uniform float uStrength[${TRAIL}];

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
float height(vec2 p, vec2 push) {
  float t = uTime * 0.022;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 1.4 * q + vec2(1.7, 9.2) + push), fbm(p + 1.4 * q + vec2(8.3, 2.8) + t * 0.7));
  return fbm(p + 1.6 * r);
}
// Pointer trail: how lit this spot is, and which way the liquid is being pushed.
void trailAt(vec2 uv, float aspect, out float glow, out vec2 push) {
  glow = 0.0;
  push = vec2(0.0);
  for (int i = 0; i < ${TRAIL}; i++) {
    if (uStrength[i] < 0.003) continue;
    vec2 d = (uv - uTrail[i].xy) * vec2(aspect, 1.0);
    float d2 = dot(d, d);
    glow += exp(-d2 / uRadius) * uStrength[i];
    push += uTrail[i].zw * exp(-d2 / uPushRadius) * uStrength[i];
  }
  glow = clamp(glow, 0.0, 0.85);
  push = clamp(push * 0.022, vec2(-0.3), vec2(0.3)); // a gentle bend, no whirlpools
}
`;

// Chrome shading from the surface slope.
const SHADING = `
uniform float uAmbient;
// Studio "environment" reflected by the chrome: two soft light strips and a faint floor glow.
float env(vec3 r) {
  float strip = pow(max(0.0, 1.0 - abs(r.y - 0.38) * 4.5), 6.0);
  float side = 0.45 * pow(max(0.0, 1.0 - abs(r.x + 0.45) * 5.0), 6.0);
  float floorGlow = 0.05 * smoothstep(-0.2, -0.9, r.y);
  return strip + side + floorGlow;
}
vec4 shade(vec2 uv, float aspect, vec2 grad, float glow) {
  vec3 n = normalize(vec3(-grad * 0.3, 1.0));
  // Slightly different normals per channel: a chromatic split right on the highlights.
  vec3 view = vec3(0.0, 0.0, -1.0);
  vec3 split = vec3(grad.y, -grad.x, 0.0) * 0.014;
  float r = env(reflect(view, normalize(n + split)));
  float g = env(reflect(view, n));
  float b = env(reflect(view, normalize(n - split)));
  vec3 chrome = vec3(r, g, b) * vec3(1.0, 0.97, 0.93);
  chrome += pow(1.0 - n.z, 2.0) * 0.18 * vec3(0.8, 0.86, 1.0); // rim on steep folds

  float visible = uAmbient + glow;
  vec2 v = uv - 0.5;
  float vignette = smoothstep(0.95, 0.25, length(v * vec2(aspect * 0.8, 1.0)));
  vec3 col = chrome * visible * mix(0.55, 1.0, vignette);
  // Light "screened" over the page's near-black (#0E0E0D), so no CSS blend mode is needed.
  vec3 ink = vec3(0.0549, 0.0549, 0.051);
  vec3 light = 1.0 - exp(-col * 1.25);
  return vec4(ink + (1.0 - ink) * light, 1.0);
}
`;

// Pass 1: surface height (+ trail glow) once per pixel into a float texture.
const HEIGHT_FRAG = `${HEADER}
uniform vec2 uRes;
${SURFACE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float glow; vec2 push;
  trailAt(uv, aspect, glow, push);
  fragColor = vec4(height(uv * vec2(aspect, 1.0) * 0.6, push), glow, 0.0, 1.0);
}`;

// Pass 2: shade from the stored surface, with the exact slope from neighbouring texels.
const SHADE_FRAG = `${HEADER}
uniform vec2 uRes;
uniform sampler2D uSurface;
${SHADING}
void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  ivec2 size = textureSize(uSurface, 0);
  vec4 c = texelFetch(uSurface, px, 0);
  float aspect = uRes.x / uRes.y;
  // Sample the slope over the same span as the single-pass version (0.003 in surface units),
  // which keeps the silky look regardless of render resolution.
  vec2 texelP = 0.6 * vec2(aspect, 1.0) / vec2(size);
  ivec2 k = max(ivec2(1), ivec2(floor(0.0015 / texelP + 0.5)));
  float hl = texelFetch(uSurface, clamp(px - ivec2(k.x, 0), ivec2(0), size - 1), 0).r;
  float hr = texelFetch(uSurface, clamp(px + ivec2(k.x, 0), ivec2(0), size - 1), 0).r;
  float hd = texelFetch(uSurface, clamp(px - ivec2(0, k.y), ivec2(0), size - 1), 0).r;
  float hu = texelFetch(uSurface, clamp(px + ivec2(0, k.y), ivec2(0), size - 1), 0).r;
  vec2 grad = vec2(hr - hl, hu - hd) / (2.0 * vec2(k) * texelP);
  fragColor = shade(gl_FragCoord.xy / uRes, aspect, grad, c.g);
}`;

// Fallback when float render targets aren't available: one pass, three height samples per pixel.
const SINGLE_FRAG = `${HEADER}
uniform vec2 uRes;
${SURFACE}
${SHADING}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float glow; vec2 push;
  trailAt(uv, aspect, glow, push);
  vec2 p = uv * vec2(aspect, 1.0) * 0.6;
  const float e = 0.003;
  float h = height(p, push);
  vec2 grad = vec2(height(p + vec2(e, 0.0), push) - h, height(p + vec2(0.0, e), push) - h) / e;
  fragColor = shade(uv, aspect, grad, glow);
}`;

function createLiquid(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const twoPass = !!gl.getExtension("EXT_color_buffer_float");
  // Compile in the background where supported (KHR_parallel_shader_compile): asking for the status
  // right away would block the main thread until the GPU driver finishes.
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const shaders = [];
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    shaders.push(s);
    return s;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const link = (fragSrc) => {
    const fs = shader(gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    return { program, fs, u: null };
  };
  const passes = twoPass ? { surface: link(HEIGHT_FRAG), shade: link(SHADE_FRAG) } : { single: link(SINGLE_FRAG) };

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  // Surface texture, matched to the canvas size.
  let target = null;
  const ensureTarget = (w, h) => {
    if (target && target.w === w && target.h === h) return;
    if (target) {
      gl.deleteTexture(target.tex);
      gl.deleteFramebuffer(target.fbo);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Full 32-bit floats: the slope comes from tiny height differences that half floats would round off.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    target = { tex, fbo, w, h };
  };

  const setCommon = (u, w, h, time, trail, strength) => {
    gl.uniform2f(u.uRes, w, h);
    if (u.uTime) gl.uniform1f(u.uTime, time);
    if (u.uRadius) gl.uniform1f(u.uRadius, CONFIG.trailRadius);
    if (u.uPushRadius) gl.uniform1f(u.uPushRadius, CONFIG.pushRadius);
    if (u.uAmbient) gl.uniform1f(u.uAmbient, CONFIG.ambient);
    if (u.uTrail) gl.uniform4fv(u.uTrail, trail);
    if (u.uStrength) gl.uniform1fv(u.uStrength, strength);
  };

  return {
    // True once every program is linked (without blocking); throws if compilation failed.
    ready() {
      for (const pass of Object.values(passes)) {
        if (pass.u) continue;
        if (parallel && !gl.getProgramParameter(pass.program, parallel.COMPLETION_STATUS_KHR)) return false;
        if (!gl.getProgramParameter(pass.program, gl.LINK_STATUS)) {
          throw new Error(gl.getShaderInfoLog(pass.fs) || gl.getProgramInfoLog(pass.program));
        }
        const loc = (n) => gl.getUniformLocation(pass.program, n);
        pass.u = Object.fromEntries(
          ["uRes", "uTime", "uRadius", "uPushRadius", "uAmbient", "uTrail", "uStrength", "uSurface"].map((n) => [n, loc(n)])
        );
      }
      return true;
    },
    render(time, trail, strength) {
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      gl.viewport(0, 0, w, h);
      if (!twoPass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(passes.single.program);
        setCommon(passes.single.u, w, h, time, trail, strength);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return;
      }
      ensureTarget(w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.useProgram(passes.surface.program);
      setCommon(passes.surface.u, w, h, time, trail, strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(passes.shade.program);
      setCommon(passes.shade.u, w, h, time, trail, strength);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target.tex);
      gl.uniform1i(passes.shade.u.uSurface, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    // Free GPU resources but keep the context: React may remount on the same canvas, and
    // getContext() would hand back a lost context (which paints white).
    dispose() {
      Object.values(passes).forEach((pass) => gl.deleteProgram(pass.program));
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteBuffer(quad);
      if (target) {
        gl.deleteTexture(target.tex);
        gl.deleteFramebuffer(target.fbo);
      }
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
    const budget = window.matchMedia("(pointer: coarse)").matches ? CONFIG.pixelBudget.coarse : CONFIG.pixelBudget.fine;
    const sizeCanvas = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, Math.sqrt(budget / Math.max(1, w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
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

      try {
        if (!liquid.ready()) return;
      } catch (e) {
        console.warn("LiquidFlow disabled:", e);
        canvas.style.visibility = "hidden";
        cancelAnimationFrame(frame);
        return;
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

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
};

export default LiquidFlow;
