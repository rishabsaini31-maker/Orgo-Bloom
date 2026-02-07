"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

export default function AdminVideosPage() {
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!token) {
      toast.error("Please login to upload videos");
      return;
    }

    const videoFiles = Array.from(files).filter(
      (file) =>
        file.type === "video/mp4" ||
        file.type === "video/webm" ||
        file.type === "video/quicktime",
    );

    if (videoFiles.length === 0) {
      toast.error("Please select valid video files (MP4, WebM, MOV)");
      return;
    }

    if (videos.length + videoFiles.length > 8) {
      toast.error("Maximum 8 videos allowed");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of videoFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          uploadedUrls.push(data.url);
        } else {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Upload failed");
        }
      }

      const newVideos = [...videos, ...uploadedUrls];
      setVideos(newVideos);

      // Save to database
      const saveResponse = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videos: newVideos }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save videos");

      toast.success(`${videoFiles.length} video(s) uploaded successfully!`);
      e.target.value = "";
    } catch (error: any) {
      toast.error(error.message || "Failed to upload videos");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = async (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);

    if (newVideos.length < 3 && newVideos.length > 0) {
      toast.error("Minimum 3 videos required");
      return;
    }

    setVideos(newVideos);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videos: newVideos }),
      });

      if (!response.ok) throw new Error("Failed to update videos");
      toast.success("Video removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove video");
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to remove all videos?")) return;

    setVideos([]);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videos: [] }),
      });

      if (!response.ok) throw new Error("Failed to clear videos");
      toast.success("All videos removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to clear videos");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Homepage Videos
              </h1>
              <p className="text-gray-600 mt-2">
                Upload 3-8 videos that will play sequentially and loop on the
                homepage
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Upload Videos ({videos.length}/8)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {videos.length === 0
                ? "Upload 3-8 videos to get started"
                : videos.length < 3
                  ? `Upload at least ${3 - videos.length} more video(s) (minimum 3 required)`
                  : `You can upload ${8 - videos.length} more video(s)`}
            </p>

            <div className="flex items-center gap-4">
              <label
                className={`btn cursor-pointer ${videos.length >= 8 ? "btn-secondary opacity-50 cursor-not-allowed" : "btn-primary"}`}
              >
                <input
                  type="file"
                  multiple
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  disabled={isUploading || videos.length >= 8}
                  className="hidden"
                />
                {isUploading ? "Uploading..." : "Select Videos"}
              </label>

              {videos.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn bg-red-500 hover:bg-red-600 text-white"
                  disabled={isUploading}
                >
                  Clear All
                </button>
              )}
            </div>

            {videos.length < 3 && videos.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please upload at least 3 videos to display on the homepage
                </p>
              </div>
            )}

            {videos.length >= 3 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Videos will play sequentially and automatically loop back to
                  the first video
                </p>
              </div>
            )}
          </div>

          {/* Videos Grid */}
          {videos.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Uploaded Videos ({videos.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((videoUrl, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-100 rounded-lg overflow-hidden border-4 border-gray-300 shadow-lg hover:border-primary-500 transition-all"
                  >
                    <div className="aspect-video relative">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Video {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveVideo(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isUploading}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No videos uploaded
              </h3>
              <p className="text-gray-500">
                Upload 3-8 videos to display on the homepage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
