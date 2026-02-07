"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Video {
  url: string;
  type: "youtube" | "upload";
  rank: number;
}

const MIN_VIDEOS = 1;
const MAX_VIDEOS = 8;

export default function AdminSettingsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/admin/login");
      return;
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Parse videos from the response
        if (data.videos && Array.isArray(data.videos)) {
          const parsedVideos: Video[] = data.videos.map(
            (video: any, index: number) => {
              if (typeof video === "string") {
                return {
                  url: video,
                  type: video.startsWith("/uploads/") ? "upload" : "youtube",
                  rank: index + 1,
                };
              }
              return video;
            },
          );
          setVideos(parsedVideos);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      toast.error("Please login to upload videos");
      return;
    }

    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      return;
    }

    setUploadingVideo(true);
    try {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      toast.loading(`Uploading video (${fileSizeMB}MB)...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(600000), // 10 minute timeout for 150MB files
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload video");
      }

      const data = await response.json();
      const newVideo: Video = {
        url: data.url,
        type: "upload",
        rank: videos.length + 1,
      };
      setVideos([...videos, newVideo]);
      toast.success("Video uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleAddYoutubeVideo = () => {
    if (!newYoutubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (videos.length >= MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      return;
    }

    if (
      !newYoutubeUrl.includes("youtube.com/embed/") &&
      !newYoutubeUrl.includes("youtu.be")
    ) {
      toast.error("Invalid YouTube URL format");
      return;
    }

    const newVideo: Video = {
      url: newYoutubeUrl,
      type: "youtube",
      rank: videos.length + 1,
    };
    setVideos([...videos, newVideo]);
    setNewYoutubeUrl("");
    toast.success("YouTube video added successfully");
  };

  const handleDeleteVideo = (index: number) => {
    if (videos.length <= MIN_VIDEOS) {
      toast.error(`At least ${MIN_VIDEOS} video is required`);
      return;
    }
    const newVideos = videos.filter((_, i) => i !== index);
    // Recalculate ranks
    const rerankedVideos = newVideos.map((v, i) => ({ ...v, rank: i + 1 }));
    setVideos(rerankedVideos);
    toast.success("Video removed");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index - 1], newVideos[index]] = [
      newVideos[index],
      newVideos[index - 1],
    ];
    // Recalculate ranks
    const rerankedVideos = newVideos.map((v, i) => ({ ...v, rank: i + 1 }));
    setVideos(rerankedVideos);
  };

  const handleMoveDown = (index: number) => {
    if (index === videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [
      newVideos[index + 1],
      newVideos[index],
    ];
    // Recalculate ranks
    const rerankedVideos = newVideos.map((v, i) => ({ ...v, rank: i + 1 }));
    setVideos(rerankedVideos);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videos.length < MIN_VIDEOS) {
      toast.error(`Please add at least ${MIN_VIDEOS} video`);
      return;
    }
    if (videos.length > MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videos: videos.map((v) => v.url),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-gray-600 mt-1">Manage and rank home page videos</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            Videos: {videos.length} / {MAX_VIDEOS}
          </span>
          {videos.length >= MAX_VIDEOS && (
            <span className="text-xs text-blue-700">(Max reached)</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Add YouTube Video */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add YouTube Video
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddYoutubeVideo}
                  disabled={videos.length >= MAX_VIDEOS}
                  className="btn btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add YouTube
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Enter YouTube embed URL (e.g.,
                https://www.youtube.com/embed/VIDEO_ID)
              </p>
            </div>
          </div>

          {/* Upload Video File */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Video File
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <input
                type="file"
                id="video-upload"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploadingVideo || videos.length >= MAX_VIDEOS}
                className="hidden"
              />
              <label
                htmlFor="video-upload"
                className={`block ${uploadingVideo || videos.length >= MAX_VIDEOS ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-2"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={30} cy={20} r={4} strokeWidth={2} />
                  <path
                    d="M44 8l-8.5 8.5M44 8l-8.5-8.5M44 8v0"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {uploadingVideo
                    ? "Uploading..."
                    : "Click to upload video (Up to 150MB)"}
                </p>
                <p className="text-xs text-gray-500">MP4, WebM, or MOV</p>
              </label>
            </div>
          </div>

          {/* Videos List with Ranking */}
          {videos.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Video Ranking ({videos.length} videos)
              </h2>
              <div className="space-y-3">
                {videos.map((video, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-bold">
                        {index + 1}
                      </div>
                    </div>

                    {/* Video Type Icon and URL */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {video.type === "youtube" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            YouTube
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {video.url}
                      </p>
                    </div>

                    {/* Ranking Controls */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === videos.length - 1}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(index)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                      title="Delete video"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The first video in this list will be
                  displayed on the home page. Use the up/down arrows to change
                  the ranking order. You can add between {MIN_VIDEOS} to {MAX_VIDEOS} videos.
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || videos.length < MIN_VIDEOS || videos.length > MAX_VIDEOS}
              className="btn btn-primary"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
