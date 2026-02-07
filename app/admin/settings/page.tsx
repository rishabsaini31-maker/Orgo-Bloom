"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(false);

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
        setVideoUrl(data.videoUrl || "");
        // Detect if it's a file upload or URL
        setUseFileUpload(data.videoUrl?.startsWith("/uploads/") || false);
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

    setUploadingVideo(true);
    try {
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
      setVideoUrl(data.url);
      setUseFileUpload(true);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl }),
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
        <p className="text-gray-600 mt-1">
          Configure home page video and other site settings
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Home Page Video
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!useFileUpload}
                    onChange={() => setUseFileUpload(false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">YouTube URL</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={useFileUpload}
                    onChange={() => setUseFileUpload(true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Upload Video File</span>
                </label>
              </div>

              {!useFileUpload ? (
                <>
                  <div>
                    <label
                      htmlFor="videoUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      YouTube Video URL
                    </label>
                    <input
                      id="videoUrl"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="input w-full"
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the YouTube embed URL. Format:
                      https://www.youtube.com/embed/VIDEO_ID
                    </p>
                  </div>

                  {videoUrl && videoUrl.includes("youtube") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Preview
                      </label>
                      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          className="w-full h-full"
                          src={`${videoUrl.replace("watch?v=", "embed/")}?controls=1`}
                          title="Video Preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          How to get YouTube embed URL:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                          <li>Go to your YouTube video</li>
                          <li>Click &quot;Share&quot; button</li>
                          <li>Click &quot;Embed&quot;</li>
                          <li>Copy the URL from the src attribute</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Video File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                      <input
                        type="file"
                        id="video-upload"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        className="hidden"
                      />
                      <label
                        htmlFor="video-upload"
                        className={`cursor-pointer block ${uploadingVideo ? "opacity-50" : ""}`}
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
                            : "Click to upload video"}
                        </p>
                        <p className="text-xs text-gray-500">
                          MP4, WebM, or MOV up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {videoUrl && videoUrl.startsWith("/uploads/") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Preview
                      </label>
                      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                        <video
                          className="w-full h-64"
                          controls
                          src={videoUrl}
                        ></video>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
