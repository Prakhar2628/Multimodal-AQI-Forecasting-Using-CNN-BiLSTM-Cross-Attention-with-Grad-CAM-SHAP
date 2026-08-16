import { useEffect, useRef } from 'react';

export default function OrbitalBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ── Dust Particles ───────────────────────────────────────────────
    const particleCount = 90;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.3,
      speedY: -(Math.random() * 0.35 + 0.05),
      speedX: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.5 + 0.15,
      pulseSpeed: Math.random() * 0.015 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#8b5cf6' : '#00E5B0',
    }));

    // ── Orbital Ring Config ──────────────────────────────────────────
    const rings = [
      { rx: 0.48, ry: 0.28, tilt: 0.35, speed: 0.0015, color: 'rgba(0,229,176,0.10)', lineWidth: 1.5, dash: [10, 14] },
      { rx: 0.36, ry: 0.19, tilt: -0.28, speed: -0.002, color: 'rgba(0,255,198,0.07)', lineWidth: 1.0, dash: [6, 10] },
      { rx: 0.26, ry: 0.13, tilt: 0.20, speed: 0.003, color: 'rgba(139,92,246,0.08)', lineWidth: 1.0, dash: [4, 8] },
      { rx: 0.58, ry: 0.10, tilt: 0.60, speed: -0.0008, color: 'rgba(0,229,176,0.04)', lineWidth: 0.8, dash: [8, 20] },
    ];

    // ── Orbiting Node Dots on each ring ────────────────────────────
    const nodes = rings.map((ring, idx) => ({
      ringIdx: idx,
      angle: Math.random() * Math.PI * 2,
      size: 2.5 + idx * 0.5,
      speed: ring.speed * 15,
    }));

    // ── Connection Lines State ───────────────────────────────────────
    let rotationAngle = 0;
    let t = 0;

    const drawRing = (ring, angle) => {
      const cx = width / 2;
      const cy = height * 0.62;
      const rx = width * ring.rx;
      const ry = height * ring.ry;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ring.tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, angle, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.lineWidth;
      ctx.setLineDash(ring.dash);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    const getPointOnRing = (ring, angle, nodeAngle) => {
      const cx = width / 2;
      const cy = height * 0.62;
      const rx = width * ring.rx;
      const ry = height * ring.ry;
      // Apply tilt rotation
      const x0 = rx * Math.cos(nodeAngle);
      const y0 = ry * Math.sin(nodeAngle);
      const cos = Math.cos(ring.tilt + angle);
      const sin = Math.sin(ring.tilt + angle);
      return {
        x: cx + x0 * cos - y0 * sin,
        y: cy + x0 * sin + y0 * cos,
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.62;
      rotationAngle += 0.0008;
      t += 0.016;

      // ── Ambient glow core ──────────────────────────────────────────
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.42);
      grad.addColorStop(0, 'rgba(0,229,176,0.05)');
      grad.addColorStop(0.45, 'rgba(139,92,246,0.025)');
      grad.addColorStop(1, 'rgba(7,9,14,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // ── Secondary glow (bottom) ────────────────────────────────────
      const grad2 = ctx.createRadialGradient(cx * 1.3, height * 0.85, 0, cx * 1.3, height * 0.85, width * 0.3);
      grad2.addColorStop(0, 'rgba(139,92,246,0.04)');
      grad2.addColorStop(1, 'rgba(7,9,14,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // ── Draw orbital rings ─────────────────────────────────────────
      rings.forEach((ring, i) => {
        drawRing(ring, rotationAngle * (i % 2 === 0 ? 1 : -1));
      });

      // ── Update and draw node dots ──────────────────────────────────
      nodes.forEach((node, i) => {
        node.angle += node.speed * 0.016;
        const ring = rings[node.ringIdx];
        const pt = getPointOnRing(ring, rotationAngle * (node.ringIdx % 2 === 0 ? 1 : -1), node.angle);

        // Glow behind node
        const nodeGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, node.size * 4);
        const col = node.ringIdx === 2 ? '139,92,246' : '0,229,176';
        nodeGrad.addColorStop(0, `rgba(${col},0.5)`);
        nodeGrad.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, node.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Node dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.ringIdx === 2 ? 'rgba(139,92,246,0.9)' : 'rgba(0,229,176,0.9)';
        ctx.fill();
      });

      // ── Thin connecting lines between random nodes ─────────────────
      if (nodes.length >= 2) {
        const a = nodes[0];
        const b = nodes[2];
        const ptA = getPointOnRing(rings[a.ringIdx], rotationAngle, a.angle);
        const ptB = getPointOnRing(rings[b.ringIdx], -rotationAngle, b.angle);
        const lineAlpha = 0.06 + 0.04 * Math.sin(t * 0.5);
        ctx.beginPath();
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);
        ctx.strokeStyle = `rgba(0,229,176,${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── Floating dust particles ────────────────────────────────────
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(t * 0.3 + p.pulseOffset) * 0.08;
        const opacity = p.opacity * (0.7 + 0.3 * Math.sin(t * p.pulseSpeed * 60 + p.pulseOffset));

        if (p.y < -5) p.y = height + 5;
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#8b5cf6'
          ? `rgba(139,92,246,${Math.max(0.05, Math.min(0.7, opacity))})`
          : `rgba(0,229,176,${Math.max(0.05, Math.min(0.75, opacity))})`;
        ctx.shadowBlur = p.size * 5;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
