"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Image from "next/image";

const ShoppingPlatforms = () => {
  interface Platform {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    url: string;
  }

  const sectionRef = useRef(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [animateIndices, setAnimateIndices] = useState<number[]>([]);

  const platforms: Platform[] = [
    {
      id: 1,
      name: "Amazon India",
      description: "Shop with Prime eligibility for fast delivery",
      icon: "/Amazon.jpg",
      color: "from-orange-500 to-yellow-600",
      url: "https://www.amazon.in",
    },
    {
      id: 2,
      name: "Flipkart",
      description: "Assured quality with Flipkart Plus benefits",
      icon: "/flipkart.jpeg",
      color: "from-blue-500 to-blue-700",
      url: "https://www.flipkart.com",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indices = Array.from(
              { length: platforms.length },
              (_, i) => i,
            );
            setAnimateIndices(indices);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [platforms.length]);

  const getAnimationClass = (index: number) => {
    if (animateIndices.includes(index)) {
      return "opacity-100 translate-y-0";
    }
    return "opacity-0 translate-y-10";
  };

  return (
    <section
      ref={sectionRef}
      className="py-32 bg-gradient-to-b from-white via-green-50/50 to-white relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl -ml-48 -mt-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl -mr-48 -mb-48"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-3 mb-8 bg-gradient-to-r from-green-100 to-primary-100 px-6 py-3 rounded-full border border-green-200">
              <span className="text-3xl">📦</span>
              <span className="text-base font-bold bg-gradient-to-r from-green-700 to-primary-700 bg-clip-text text-transparent">
                Shop Conveniently
              </span>
            </div>

            <h2
              className="text-6xl md:text-7xl font-black mb-6 text-gray-900 opacity-0 animate-fade-in-down leading-tight tracking-tight"
              style={{ animationDelay: "0.1s" }}
            >
              Available on Major
              <br />
              <span className="bg-gradient-to-r from-green-600 via-primary-600 to-green-600 bg-clip-text text-transparent">
                E-Commerce Platforms
              </span>
            </h2>

            <p
              className="text-2xl text-gray-700 max-w-3xl mx-auto opacity-0 animate-fade-in-down font-light"
              style={{ animationDelay: "0.2s" }}
            >
              Shop on your favorite platforms with trusted sellers and fast
              delivery
            </p>
          </div>

          {/* Platform Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {platforms.map((platform, index) => (
              <div
                key={platform.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border-2 border-white/50 hover:border-white transform ${getAnimationClass(index)}`}
                style={{
                  transitionDelay: animateIndices.includes(index)
                    ? `${index * 0.1}s`
                    : "0s",
                  transitionDuration: "600ms",
                }}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-95 group-hover:opacity-100 transition-all duration-500`}
                ></div>

                {/* Animated Overlay Pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[radial-gradient(circle_at_20%_50%,white,transparent_50%)]"></div>

                {/* Shine Effect */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700"></div>

                {/* Content Container */}
                <div className="relative h-80 flex flex-col items-center justify-center text-center text-white p-8 z-10">
                  {/* Icon - Very Large */}
                  <div className="mb-8 w-32 h-32 relative drop-shadow-xl group-hover:scale-125 transition-transform duration-500">
                    <Image
                      src={platform.icon}
                      alt={platform.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Platform Name - Bold and Large */}
                  <h3 className="font-black text-4xl mb-4 transition-transform duration-300 group-hover:translate-y-0 transform leading-tight">
                    {platform.name}
                  </h3>

                  {/* Description */}
                  <p className="text-lg opacity-95 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed font-medium mb-6">
                    {platform.description}
                  </p>

                  {/* Visit Store Button - Non-Interactive */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold text-sm border border-white/30">
                    Visit Store
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>

                  {/* Bottom accent line */}
                  <div className="mt-auto h-1 w-12 bg-white/40 group-hover:w-16 group-hover:bg-white transition-all duration-300 rounded-full"></div>
                </div>

                {/* Bottom shine accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShoppingPlatforms;
