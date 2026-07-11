"use client";

import { useEffect, useRef } from "react";

import { CHAOS_ICONS } from "./icons";

interface ChaosNode {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angleV: number;
  pulse: number;
}

const SIZE = 44; // px — matches the icon box (size-11)

/**
 * The "your knowledge today…" panel: brand-tool icons drifting, bouncing off
 * the walls, gently rotating + pulsing, and repelling from the cursor — a
 * requestAnimationFrame physics loop ported from the prototype. Respects
 * reduced-motion (static placement, no loop) and cleans up on unmount.
 */
export function ChaosField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const els = iconRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    );

    let w = 0;
    let h = 0;
    const measure = () => {
      w = field.clientWidth;
      h = field.clientHeight;
    };
    measure();

    const nodes: ChaosNode[] = els.map((el) => {
      const maxX = Math.max(0, w - SIZE);
      const maxY = Math.max(0, h - SIZE);
      return {
        el,
        x: Math.random() * maxX,
        y: Math.random() * maxY,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        angle: (Math.random() - 0.5) * 20,
        angleV: (Math.random() - 0.5) * 0.6,
        pulse: Math.random() * Math.PI * 2,
      };
    });

    const render = (n: ChaosNode) => {
      const scale = 1 + Math.sin(n.pulse) * 0.08;
      n.el.style.transform = `translate(${n.x}px,${n.y}px) rotate(${n.angle}deg) scale(${scale.toFixed(3)})`;
    };

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      nodes.forEach(render);
      return;
    }

    const mouse = { x: -999, y: -999, active: false };
    const onMove = (e: MouseEvent) => {
      const rect = field.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onResize = () => {
      measure();
      const maxX = Math.max(0, w - SIZE);
      const maxY = Math.max(0, h - SIZE);
      nodes.forEach((n) => {
        n.x = Math.min(n.x, maxX);
        n.y = Math.min(n.y, maxY);
      });
    };

    field.addEventListener("mousemove", onMove);
    field.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    let raf = 0;
    const REPEL = 90; // px radius
    const CENTER = SIZE / 2;
    const MAX = 2.6;

    const step = () => {
      const maxX = Math.max(0, w - SIZE);
      const maxY = Math.max(0, h - SIZE);

      for (const n of nodes) {
        if (mouse.active) {
          const dx = n.x + CENTER - mouse.x;
          const dy = n.y + CENTER - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL && dist > 0.01) {
            const force = (1 - dist / REPEL) * 0.8;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        n.vx *= 0.99;
        n.vy *= 0.99;

        const sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (sp > MAX) {
          n.vx = (n.vx / sp) * MAX;
          n.vy = (n.vy / sp) * MAX;
        }
        if (sp < 0.15) {
          n.vx += (Math.random() - 0.5) * 0.2;
          n.vy += (Math.random() - 0.5) * 0.2;
        }

        n.x += n.vx;
        n.y += n.vy;

        if (n.x <= 0) {
          n.x = 0;
          n.vx = Math.abs(n.vx);
        } else if (n.x >= maxX) {
          n.x = maxX;
          n.vx = -Math.abs(n.vx);
        }
        if (n.y <= 0) {
          n.y = 0;
          n.vy = Math.abs(n.vy);
        } else if (n.y >= maxY) {
          n.y = maxY;
          n.vy = -Math.abs(n.vy);
        }

        n.angle += n.angleV;
        if (n.angle > 22 || n.angle < -22) n.angleV *= -1;
        n.pulse += 0.03;

        render(n);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      field.removeEventListener("mousemove", onMove);
      field.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="flex h-[340px] flex-col rounded-[14px] border border-[rgba(236,72,153,0.18)] bg-[linear-gradient(180deg,var(--m-surface),var(--m-bg-soft))] p-[18px]">
      <span className="mb-3 block text-center text-[0.82rem] font-semibold text-[var(--m-text-mute)]">
        Your knowledge today…
      </span>
      <div
        ref={fieldRef}
        aria-hidden="true"
        className="relative flex-1 overflow-hidden rounded-[10px]"
      >
        {CHAOS_ICONS.map((icon, i) => (
          <div
            key={icon.name}
            ref={(el) => {
              iconRefs.current[i] = el;
            }}
            role="img"
            aria-label={icon.name}
            className="absolute left-0 top-0 grid size-11 place-items-center rounded-[11px] border border-[var(--m-border-2)] bg-[var(--m-surface-2)] text-[var(--m-text-dim)] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)] will-change-transform [&_svg]:size-6"
          >
            {icon.svg}
          </div>
        ))}
      </div>
    </div>
  );
}
