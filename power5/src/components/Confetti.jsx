import { useEffect } from "react";

export default function Confetti({ active }) {
  useEffect(() => {
    if (!active) return;

    const canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#C9A84C", "#E2BB6A", "#FFD700", "#ffffff", "#3fb950", "#C9A84C"];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 3,
      d: Math.random() * 120 + 80,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 3 + 2,
    }));

    let frame;
    let elapsed = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.vy;
        p.x += p.vx;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.4, p.tilt, 0, Math.PI * 2);
        ctx.fill();
      });
      elapsed++;
      if (elapsed < 180) {
        frame = requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }

    draw();
    return () => { cancelAnimationFrame(frame); canvas.remove(); };
  }, [active]);

  return null;
}
