// Soft, blurred beams fanning down from above the logo. Each one sways and breathes on its own clock.
const RAYS = [
  { angle: -30, w: 110, strength: 0.22, sway: 11, pulse: 7.5, delay: -2 },
  { angle: -19, w: 170, strength: 0.34, sway: 13, pulse: 9, delay: -6 },
  { angle: -9, w: 90, strength: 0.42, sway: 9, pulse: 6.5, delay: -1 },
  { angle: -2, w: 220, strength: 0.3, sway: 15, pulse: 10, delay: -4 },
  { angle: 7, w: 120, strength: 0.46, sway: 10, pulse: 8, delay: -7 },
  { angle: 15, w: 190, strength: 0.28, sway: 12, pulse: 11, delay: -3 },
  { angle: 25, w: 100, strength: 0.24, sway: 14, pulse: 7, delay: -5 },
  { angle: 36, w: 150, strength: 0.16, sway: 16, pulse: 9.5, delay: -8 },
];

const LightRays = () => (
  <div className="light-rays [--ray-origin:50%] lg:[--ray-origin:27%]" aria-hidden="true">
    <div className="light-rays__glow" />
    {RAYS.map((r, i) => (
      <span
        key={i}
        className="light-rays__ray"
        style={{
          "--angle": `${r.angle}deg`,
          "--w": `${r.w}px`,
          "--strength": r.strength,
          "--sway-duration": `${r.sway}s`,
          "--pulse-duration": `${r.pulse}s`,
          "--delay": `${r.delay}s`,
        }}
      />
    ))}
  </div>
);

export default LightRays;
