"use client";

import { useState, useEffect, useRef } from "react";

interface VideoPlayerProps {
  videos: string[];
}

export default function VideoPlayer({ videos }: VideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videos.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // Move to next video, or loop back to first
      setCurrentVideoIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % videos.length;
        return nextIndex;
      });
    };

    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("ended", handleEnded);
    };
  }, [videos.length]);

  useEffect(() => {
    // Reset and play video when index changes
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [currentVideoIndex]);

  if (videos.length === 0) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <svg
            className="w-24 h-24 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-2">No Videos Configured</h2>
          <p className="text-lg opacity-90">
            Upload 1-8 videos in the admin panel to display here
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={videos[currentVideoIndex]}
        className="absolute inset-0 w-full h-full object-cover border-8 border-primary-600/30 shadow-2xl"
        autoPlay
        muted
        playsInline
      />

      {/* Video indicator dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentVideoIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
