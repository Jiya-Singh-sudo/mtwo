import { useEffect, useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import "./Carousel.css";

export interface CarouselProps {
  images: string[];
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;

export default function Carousel({
  images,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false
}: CarouselProps) {
  // const containerPadding = 0;

  // Full-screen width: responsive on resize
  const [itemWidth, setItemWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const update = () => setItemWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const trackItemOffset = itemWidth + GAP;
  const carouselItems = loop ? [...images, images[0]] : images;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pause autoplay on hover
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const c = containerRef.current;
      const enter = () => setIsHovered(true);
      const leave = () => setIsHovered(false);

      c.addEventListener("mouseenter", enter);
      c.addEventListener("mouseleave", leave);

      return () => {
        c.removeEventListener("mouseenter", enter);
        c.removeEventListener("mouseleave", leave);
      };
    }
  }, [pauseOnHover]);

  // Autoplay logic
  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === images.length - 1 && loop) return prev + 1;
          if (prev === carouselItems.length - 1) return loop ? 0 : prev;
          return prev + 1;
        });
      }, autoplayDelay);

      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, loop, images.length, carouselItems.length, pauseOnHover]);

  // Motion One transition (correct API)
  const effectiveTransition = isResetting
    ? { duration: 0 }
    : { easing: "spring", duration: 0.35 };

  // Loop reset
  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  // Drag logic
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex((p) => Math.min(p + 1, carouselItems.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(images.length - 1);
      } else {
        setCurrentIndex((p) => Math.max(p - 1, 0));
      }
    }
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0
        }
      };

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? "round" : ""}`}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        ...(round && { height: "400px", borderRadius: "50%" })
      }}
    >
      <motion.div
        className="carousel-track"
        drag="x"
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((src, index) => {
          const range = [
            -(index + 1) * trackItemOffset,
            -index * trackItemOffset,
            -(index - 1) * trackItemOffset
          ];
          const outputRange = [90, 0, -90];
          const rotateY = useTransform(x, range, outputRange, { clamp: false });

          return (
            <motion.div
              key={index}
              className={`carousel-item ${round ? "round" : ""}`}
              style={{
                width: itemWidth,
                height: "400px",
                rotateY,
                ...(round && { borderRadius: "50%" })
              }}
              transition={effectiveTransition}
            >
              <img src={src} alt="" className="carousel-image" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Indicators */}
      <div className="carousel-indicators-container">
        <div className="carousel-indicators">
          {images.map((_, index) => (
            <motion.div
              key={index}
              className={`carousel-indicator ${
                currentIndex % images.length === index ? "active" : "inactive"
              }`}
              animate={{
                scale: currentIndex % images.length === index ? 1.2 : 1
              }}
              onClick={() => setCurrentIndex(index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
