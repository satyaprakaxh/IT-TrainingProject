
import { useMemo } from "react";
import "./bubbles.css";

const rand = (min, max) => Math.random() * (max - min) + min;

export default function FloatingBubbles({ count = 18 }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        size: rand(14, 35),
        left: rand(0, 100),
        duration: rand(10, 13),
        delay: -rand(0, 10),
        drift: rand(-90, 90),
        opacity: rand(0.25, 0.6),
      })),
    [count]
  );

  return (
    <div className="bubbles" aria-hidden="true">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            "--drift": `${b.drift}px`,
            "--op": b.opacity,
          }}
        />
      ))}
    </div>
  );
}
