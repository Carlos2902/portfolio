import { useEffect, useRef } from "react";

/*
 * "Hover chroma" flow background: a small WebGL2 fluid simulation (after Pavel Dobryakov's
 * WebGL-Fluid-Simulation, MIT). The pointer stirs silky smoke into the dark; the display pass splits
 * the colour channels along the flow for a chromatic fringe. With no pointer (touch, idle), a slow
 * autopilot keeps a ribbon drifting so the hero never looks dead.
 */

const CONFIG = {
  simRes: 128,
  dyeRes: 1024,
  velocityDissipation: 1.1,
  dyeDissipation: 1.7,
  pressure: 0.8,
  pressureIterations: 20,
  curl: 5,
  splatRadius: 0.0007,
  splatForce: 4200,
  intensity: 0.3,
  autoIntensity: 0.035,
  idleAfter: 2200, // ms without pointer input before the autopilot takes over
};

// Mostly warm white; the display pass adds the blue/amber fringes. Tints drift slowly between these.
const PALETTE = [
  [1.0, 0.96, 0.9],
  [0.72, 0.8, 1.0],
  [1.0, 0.97, 0.93],
  [1.0, 0.8, 0.6],
];

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const frag = (body) => `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
${body}`;

const SHADERS = {
  splat: frag(`
uniform sampler2D uTarget;
uniform float aspectRatio, radius;
uniform vec3 color;
uniform vec2 point;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`),
  advection: frag(`
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`),
  divergence: frag(`
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`),
  curl: frag(`
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`),
  vorticity: frag(`
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`),
  pressure: frag(`
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  fragColor = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`),
  gradient: frag(`
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  fragColor = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`),
  scale: frag(`
uniform sampler2D uTexture;
uniform float value;
void main() { fragColor = value * texture(uTexture, vUv); }`),
  display: frag(`
uniform sampler2D uTexture, uVelocity;
uniform vec2 simTexel;
void main() {
  // Chromatic split along the local flow direction.
  vec2 vel = texture(uVelocity, vUv).xy * simTexel;
  vec2 off = clamp(vel * 0.02, -0.016, 0.016) + vec2(0.002, 0.001);
  float r = texture(uTexture, vUv + off).r;
  float g = texture(uTexture, vUv).g;
  float b = texture(uTexture, vUv - off).b;
  vec3 c = (1.0 - exp(-vec3(r, g, b) * 1.4)) * 0.82; // soft tonemap, capped below pure white
  fragColor = vec4(c, 1.0);
}`),
};

function createFluid(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const vert = compile(gl.VERTEX_SHADER, VERT);
  const programs = Object.fromEntries(
    Object.entries(SHADERS).map(([name, src]) => {
      const program = gl.createProgram();
      gl.attachShader(program, vert);
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, src));
      gl.bindAttribLocation(program, 0, "aPosition");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      const uniforms = {};
      for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
        const { name: u } = gl.getActiveUniform(program, i);
        uniforms[u] = gl.getUniformLocation(program, u);
      }
      return [name, { program, uniforms }];
    })
  );

  // Full-screen quad.
  const quad = gl.createBuffer();
  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const createFBO = (w, h) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, w, h, texel: [1 / w, 1 / h] };
  };
  const createDouble = (w, h) => {
    let read = createFBO(w, h);
    let write = createFBO(w, h);
    return {
      get read() {
        return read;
      },
      get write() {
        return write;
      },
      swap() {
        [read, write] = [write, read];
      },
      dispose() {
        [read, write].forEach((f) => {
          gl.deleteTexture(f.texture);
          gl.deleteFramebuffer(f.fbo);
        });
      },
    };
  };
  const disposeFBO = (f) => {
    gl.deleteTexture(f.texture);
    gl.deleteFramebuffer(f.fbo);
  };

  const resolution = (res) => {
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const min = Math.round(res), max = Math.round(res * Math.max(aspect, 1 / aspect));
    return aspect > 1 ? [max, min] : [min, max];
  };

  let velocity, dye, pressure, divergence, curl;
  const disposeBuffers = () => {
    [velocity, dye, pressure].forEach((b) => b?.dispose());
    [divergence, curl].forEach((b) => b && disposeFBO(b));
  };
  const initBuffers = () => {
    disposeBuffers();
    const [sw, sh] = resolution(CONFIG.simRes);
    const [dw, dh] = resolution(Math.min(CONFIG.dyeRes, Math.max(gl.drawingBufferWidth, gl.drawingBufferHeight) * 0.75));
    velocity = createDouble(sw, sh);
    dye = createDouble(dw, dh);
    pressure = createDouble(sw, sh);
    divergence = createFBO(sw, sh);
    curl = createFBO(sw, sh);
  };

  let bound = 0;
  const use = (name) => {
    const p = programs[name];
    gl.useProgram(p.program);
    bound = 0;
    return p.uniforms;
  };
  const tex = (loc, fbo) => {
    gl.activeTexture(gl.TEXTURE0 + bound);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.uniform1i(loc, bound++);
  };
  const blit = (target) => {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  const splat = (x, y, dx, dy, color) => {
    const aspect = canvas.width / canvas.height;
    const radius = CONFIG.splatRadius * (aspect > 1 ? aspect : 1);
    let u = use("splat");
    gl.uniform2f(u.texelSize, ...velocity.read.texel);
    tex(u.uTarget, velocity.read);
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0);
    gl.uniform1f(u.radius, radius);
    blit(velocity.write);
    velocity.swap();

    u = use("splat");
    tex(u.uTarget, dye.read);
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, ...color);
    gl.uniform1f(u.radius, radius);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt) => {
    gl.disable(gl.BLEND);
    const simTexel = velocity.read.texel;

    let u = use("curl");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uVelocity, velocity.read);
    blit(curl);

    u = use("vorticity");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uVelocity, velocity.read);
    tex(u.uCurl, curl);
    gl.uniform1f(u.curl, CONFIG.curl);
    gl.uniform1f(u.dt, dt);
    blit(velocity.write);
    velocity.swap();

    u = use("divergence");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uVelocity, velocity.read);
    blit(divergence);

    u = use("scale");
    tex(u.uTexture, pressure.read);
    gl.uniform1f(u.value, CONFIG.pressure);
    blit(pressure.write);
    pressure.swap();

    for (let i = 0; i < CONFIG.pressureIterations; i++) {
      u = use("pressure");
      gl.uniform2f(u.texelSize, ...simTexel);
      tex(u.uDivergence, divergence);
      tex(u.uPressure, pressure.read);
      blit(pressure.write);
      pressure.swap();
    }

    u = use("gradient");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uPressure, pressure.read);
    tex(u.uVelocity, velocity.read);
    blit(velocity.write);
    velocity.swap();

    u = use("advection");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uVelocity, velocity.read);
    tex(u.uSource, velocity.read);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, CONFIG.velocityDissipation);
    blit(velocity.write);
    velocity.swap();

    u = use("advection");
    gl.uniform2f(u.texelSize, ...simTexel);
    tex(u.uVelocity, velocity.read);
    tex(u.uSource, dye.read);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, CONFIG.dyeDissipation);
    blit(dye.write);
    dye.swap();
  };

  const render = () => {
    const u = use("display");
    tex(u.uTexture, dye.read);
    tex(u.uVelocity, velocity.read);
    gl.uniform2f(u.simTexel, ...velocity.read.texel);
    blit(null);
  };

  initBuffers();
  return {
    splat,
    step,
    render,
    resize: initBuffers,
    // Free GPU resources but keep the context: React may remount this component on the same canvas,
    // and getContext() would hand back a lost context (which paints white).
    dispose: () => {
      disposeBuffers();
      Object.values(programs).forEach(({ program }) => gl.deleteProgram(program));
      gl.deleteShader(vert);
      gl.deleteBuffer(quad);
      gl.deleteBuffer(indices);
    },
  };
}

const ChromaFlow = ({ area, active = true }) => {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = area.current;
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    sizeCanvas();

    // If the GPU drops the context (driver reset, too many contexts), hide the canvas instead of showing white.
    const onLost = (e) => {
      e.preventDefault();
      canvas.style.visibility = "hidden";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    let fluid;
    try {
      fluid = createFluid(canvas);
    } catch (e) {
      console.warn("ChromaFlow disabled:", e);
    }
    if (!fluid) {
      canvas.style.visibility = "hidden";
      return () => canvas.removeEventListener("webglcontextlost", onLost);
    }

    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, lastInput: -Infinity, hue: Math.random() * PALETTE.length };
    const colorAt = (h, strength) => {
      const i = Math.floor(h) % PALETTE.length;
      const j = (i + 1) % PALETTE.length;
      const f = h - Math.floor(h);
      return PALETTE[i].map((c, k) => (c * (1 - f) + PALETTE[j][k] * f) * strength);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      const aspect = rect.width / rect.height;
      let dx = x - pointer.x;
      let dy = y - pointer.y;
      if (aspect < 1) dx *= aspect;
      if (aspect > 1) dy /= aspect;
      // Accumulate movement between frames; a long pause starts a fresh stroke instead of a jump.
      const fresh = performance.now() - pointer.lastInput > 500;
      if (!fresh) {
        pointer.dx += dx;
        pointer.dy += dy;
        pointer.moved = true;
      }
      Object.assign(pointer, { x, y, lastInput: performance.now() });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(host);

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeCanvas();
        fluid.resize();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    // Autopilot: a slow Lissajous path that drifts a faint ribbon across the hero.
    const auto = { x: 0.3, y: 0.55 };
    let last = performance.now();
    let frame = 0;
    const loop = (now) => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden || !activeRef.current) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 1 / 60);
      last = now;
      pointer.hue += dt * 0.15;

      if (pointer.moved) {
        fluid.splat(pointer.x, pointer.y, pointer.dx * CONFIG.splatForce, pointer.dy * CONFIG.splatForce, colorAt(pointer.hue, CONFIG.intensity));
        Object.assign(pointer, { dx: 0, dy: 0, moved: false });
      } else if (now - pointer.lastInput > CONFIG.idleAfter) {
        const t = now / 1000;
        const x = 0.5 + 0.38 * Math.sin(t * 0.23);
        const y = 0.5 + 0.28 * Math.sin(t * 0.37 + 1.3);
        fluid.splat(x, y, (x - auto.x) * CONFIG.splatForce, (y - auto.y) * CONFIG.splatForce, colorAt(pointer.hue, CONFIG.autoIntensity));
        Object.assign(auto, { x, y });
      }
      fluid.step(dt);
      fluid.render();
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      fluid.dispose();
    };
  }, [area]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full mix-blend-screen" aria-hidden="true" />;
};

export default ChromaFlow;
