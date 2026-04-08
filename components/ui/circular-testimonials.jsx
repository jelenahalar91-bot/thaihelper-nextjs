"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function calculateGap(width) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  colors = {},
  fontSizes = {},
}) => {
  // Color & font config
  const colorName = colors.name ?? "#000";
  const colorDesignation = colors.designation ?? "#6b7280";
  const colorTestimony = colors.testimony ?? "#4b5563";
  const colorArrowBg = colors.arrowBackground ?? "#141414";
  const colorArrowFg = colors.arrowForeground ?? "#f1f1f7";
  const colorArrowHoverBg = colors.arrowHoverBackground ?? "#00a6fb";
  const fontSizeName = fontSizes.name ?? "1.5rem";
  const fontSizeDesignation = fontSizes.designation ?? "0.925rem";
  const fontSizeQuote = fontSizes.quote ?? "1.125rem";

  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const imageContainerRef = useRef(null);
  const autoplayIntervalRef = useRef(null);

  const testimonialsLength = useMemo(() => testimonials.length, [testimonials]);
  const activeTestimonial = useMemo(
    () => testimonials[activeIndex],
    [activeIndex, testimonials]
  );

  // Responsive gap calculation
  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonialsLength);
      }, 5000);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, testimonialsLength]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [activeIndex, testimonialsLength]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [testimonialsLength]);
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonialsLength) % testimonialsLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [testimonialsLength]);

  // Compute transforms for each image
  function getImageStyle(index) {
    const gap = Math.min(calculateGap(containerWidth), 50);
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + testimonialsLength) % testimonialsLength === index;
    const isRight = (activeIndex + 1) % testimonialsLength === index;
    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 0.5,
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(8px) scale(0.88) rotateY(12deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 0.5,
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(8px) scale(0.88) rotateY(-12deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      };
    }
    return {
      zIndex: 1,
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
      transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
    };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="testimonial-container">
      <div className="testimonial-grid">
        {/* Images with overlay label */}
        <div className="image-wrapper">
          {/* Title above image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              className="image-overlay-label"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <span className="overlay-name">{activeTestimonial.name}</span>
              {activeTestimonial.designation && (
                <span className="overlay-designation">{activeTestimonial.designation}</span>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="image-container" ref={imageContainerRef}>
            {testimonials.map((testimonial, index) => (
              <Image
                key={testimonial.src}
                src={testimonial.src}
                alt={testimonial.name}
                fill
                sizes="(max-width: 1023px) 75vw, 600px"
                priority={index === 0}
                className="testimonial-image"
                data-index={index}
                style={getImageStyle(index)}
              />
            ))}
          </div>
        </div>
        {/* Arrows below */}
        <div className="testimonial-content">
          <div className="arrow-buttons">
            <button
              className="arrow-button"
              onClick={handlePrev}
              style={{ backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
              aria-label="Previous"
            >
              <FaArrowLeft size={18} color={colorArrowFg} />
            </button>
            <button
              className="arrow-button"
              onClick={handleNext}
              style={{ backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
              aria-label="Next"
            >
              <FaArrowRight size={18} color={colorArrowFg} />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .testimonial-container {
          width: 100%;
          max-width: 40rem;
          margin: 0 auto;
          padding: 0;
        }
        .testimonial-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .image-wrapper {
          position: relative;
          padding: 0.5rem 0.5rem 0.5rem;
          overflow: hidden;
        }
        .image-container {
          position: relative;
          width: 75%;
          margin: 0 auto;
          height: 20rem;
          perspective: 800px;
        }
        .testimonial-image {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 1.25rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .image-overlay-label {
          position: relative;
          z-index: 10;
          text-align: center;
          padding-bottom: 0.5rem;
        }
        .overlay-name {
          font-weight: 800;
          font-size: 1.1rem;
          color: #001b3d;
          display: block;
        }
        .overlay-designation {
          font-weight: 500;
          font-size: 0.8rem;
          color: #006a62;
          display: block;
          margin-top: 0.15rem;
          letter-spacing: 0.03em;
        }
        .testimonial-content {
          padding: 0.5rem 0 0;
        }
        .arrow-buttons {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          padding-top: 0.25rem;
        }
        .arrow-button {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s;
          border: none;
        }
        @media (max-width: 1023px) {
          .image-container {
            width: 75%;
            height: 15rem;
          }
        }
        @media (min-width: 1024px) {
          .image-container {
            width: 80%;
            height: 16rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CircularTestimonials;
