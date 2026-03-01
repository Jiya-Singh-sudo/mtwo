import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import "./Carousel.css";

export default function Carousel({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0);

  // Measure actual container — not the window
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      setSize({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  // simple autoplay
  useEffect(() => {
    const t = setInterval(() => {
      setIndex((p) => (p + 1) % images.length);
    }, 4000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div ref={containerRef} className="carousel-root">
      <motion.div
        className="carousel-track"
        animate={{ x: -(index * size.w) }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ width: size.w * images.length }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="carousel-slide"
            style={{ width: size.w, height: size.h }}
          >
            <img src={src} className="carousel-img" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
