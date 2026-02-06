"use client";

import { useState, useEffect, useRef } from "react";

const defaultHeroImages = [
  {
    id: 1,
    title: "Healthy Plants",
    description: "Nourish your plants with 100% organic nutrients",
    image: "/images/healthy-plants.jpg",
    fallbackIcon: "eye",
    color: "from-primary-400 to-primary-600",
  },
  {
    id: 2,
    title: "Natural Process",
    description: "Chemical-free, naturally enriched soil",
    image: "/images/natural-process.jpg",
    fallbackIcon: "leaf",
    color: "from-green-400 to-green-600",
  },
  {
    id: 3,
    title: "Cost Effective",
    description: "Affordable quality for all gardeners",
    image: "/images/cost-effective.jpg",
    fallbackIcon: "coin",
    color: "from-yellow-400 to-yellow-600",
  },
  {
    id: 4,
    title: "Eco Friendly",
    description: "Sustainable farming for a better future",
    image: "/images/eco-friendly.jpg",
    fallbackIcon: "globe",
    color: "from-blue-400 to-blue-600",
  },
];

interface HeroImage {
  id: number;
  title: string;
  description: string;
  image?: string;
  color?: string;
}

const getIconPath = (iconName: string) => {
  const icons: { [key: string]: string } = {
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    leaf: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    coin: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    globe:
      "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return icons[iconName] || icons.eye;
};

export default function HeroImages() {
  const [images, setImages] = useState<HeroImage[]>(defaultHeroImages);
  const [animateIndices, setAnimateIndices] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = itemRefs.current.indexOf(
            entry.target as HTMLDivElement,
          );
          if (index !== -1 && !animateIndices.includes(index)) {
            setAnimateIndices((prev) => [...prev, index]);
          }
        }
      });
    }, observerOptions);

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [animateIndices]);

  const getAnimationClass = (index: number) => {
    if (!animateIndices.includes(index)) return "opacity-0";
    switch (index % 4) {
      case 0:
        return "animate-fade-in-up";
      case 1:
        return "animate-slide-in-left";
      case 2:
        return "animate-slide-in-right";
      case 3:
        return "animate-scale-in";
      default:
        return "animate-fade-in-up";
    }
  };

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 text-center opacity-0 animate-fade-in-down"
            style={{ animationDelay: "0.1s" }}
          >
            Our Products & Impact
          </h2>
          <p
            className="text-lg md:text-xl text-gray-600 text-center mb-16 opacity-0 animate-fade-in-down"
            style={{ animationDelay: "0.2s" }}
          >
            Experience the transformation with Orgobloom organic fertilizers
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <div
                key={image.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`relative h-48 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group transform hover:scale-105 ${getAnimationClass(index)}`}
                style={{
                  transitionDelay: animateIndices.includes(index)
                    ? `${index * 0.1}s`
                    : "0s",
                }}
              >
                {/* Background with Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${image.color || "from-primary-400 to-primary-600"}`}
                ></div>

                {/* Image Overlay (if image available, show it; otherwise show icon) */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4 group-hover:scale-105 transition-transform duration-300">
                  <svg
                    className="w-16 h-16 mb-3 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={getIconPath(
                        image.color
                          ? image.id % 4 === 0
                            ? "eye"
                            : image.id % 4 === 1
                              ? "leaf"
                              : image.id % 4 === 2
                                ? "coin"
                                : "globe"
                          : "eye",
                      )}
                    />
                  </svg>
                  <h3 className="font-bold text-lg mb-1 group-hover:translate-y-1 transition-transform duration-300">
                    {image.title}
                  </h3>
                  <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    {image.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
