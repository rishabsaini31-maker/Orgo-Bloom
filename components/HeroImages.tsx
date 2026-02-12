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
    <section ref={sectionRef} className="py-32 bg-gradient-to-b from-white via-green-50 to-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-green-100/30 rounded-full blur-3xl -mr-36 -mt-36"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-100/30 rounded-full blur-3xl -ml-36 -mb-36"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-3 mb-8 bg-gradient-to-r from-green-100 to-primary-100 px-6 py-3 rounded-full border border-green-200">
              <span className="text-3xl animate-bounce">🌱</span>
              <span className="text-base font-bold bg-gradient-to-r from-green-700 to-primary-700 bg-clip-text text-transparent">Why Orgobloom?</span>
            </div>
            
            <h2
              className="text-6xl md:text-7xl font-black mb-6 text-gray-900 opacity-0 animate-fade-in-down leading-tight tracking-tight"
              style={{ animationDelay: "0.1s" }}
            >
              Grow Organic,
              <br />
              <span className="bg-gradient-to-r from-green-600 via-primary-600 to-green-600 bg-clip-text text-transparent">Grow Better</span>
            </h2>
            
            <p
              className="text-2xl text-gray-700 max-w-3xl mx-auto opacity-0 animate-fade-in-down font-light"
              style={{ animationDelay: "0.2s" }}
            >
              Organic fertilizers that nourish soil, grow plants, and protect the planet
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {images.map((image, index) => (
              <div
                key={image.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border-2 border-white/50 hover:border-green-300 transform ${getAnimationClass(index)}`}
                style={{
                  transitionDelay: animateIndices.includes(index)
                    ? `${index * 0.1}s`
                    : "0s",
                }}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${image.color || "from-green-500 to-green-700"} opacity-95 group-hover:opacity-100 transition-all duration-500`}
                ></div>

                {/* Animated Overlay Pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[radial-gradient(circle_at_20%_50%,white,transparent_50%)]"></div>

                {/* Shine Effect */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700"></div>

                {/* Content Container */}
                <div className="relative h-72 flex flex-col items-center justify-center text-center text-white p-8 z-10">
                  {/* Icon Container - Much Larger */}
                  <div className="mb-6 p-6 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 group-hover:scale-125 transition-transform duration-500 group-hover:bg-white/30">
                    <svg
                      className="w-16 h-16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
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
                  </div>

                  {/* Title - Larger and Bolder */}
                  <h3 className="font-black text-3xl mb-3 transition-transform duration-300 group-hover:translate-y-0 transform leading-tight">
                    {image.title}
                  </h3>

                  {/* Description - Better Spacing */}
                  <p className="text-lg opacity-95 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed font-medium">
                    {image.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-1 w-12 bg-white/40 group-hover:w-16 group-hover:bg-white transition-all duration-300 rounded-full"></div>
                </div>

                {/* Bottom shine accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>

          {/* CTA Button - More Prominent */}
          <div className="text-center">
            <a
              href="/products"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 via-primary-600 to-green-600 hover:from-green-700 hover:via-primary-700 hover:to-green-700 text-white px-10 py-5 rounded-full font-black text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-110 border-2 border-white/20 hover:border-white/50 group"
            >
              <span>Shop Conveniently</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
