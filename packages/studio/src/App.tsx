import { useState, useEffect } from "react";
import { VideoList } from "./components/VideoList";
import { VideoPlayer } from "./components/VideoPlayer";
import { VideoMeta, VideoDetail } from "./types/video";
import "./styles/index.css";

export function App() {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoMeta | null>(null);
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedVideo) {
      setVideoDetail(null);
      return;
    }

    fetch(`/api/video/${selectedVideo.id}`)
      .then((res) => res.json())
      .then((data) => {
        // Map API response to VideoDetail format
        const detail: VideoDetail = {
          id: data.id,
          title: data.title,
          path: data.path,
          outputMp4Path: null,
          outputSrtPath: null,
          scriptPath: data.path,
          duration: data.script?.totalDuration || 0,
          scenesCount: data.script?.scenes?.length || 0,
          createdAt: "",
          modifiedAt: "",
          script: data.script,
          screenshotResources: data.images || {},
        };
        setVideoDetail(detail);
      })
      .catch((err) => {
        console.error("Failed to load video detail:", err);
        setVideoDetail(null);
      });
  }, [selectedVideo]);

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>🎬 Video Script</h1>
          <span className="video-count">{videos.length} videos</span>
        </header>
        <VideoList
          videos={videos}
          selectedVideo={selectedVideo}
          onSelect={setSelectedVideo}
          loading={loading}
          error={error}
        />
      </aside>
      <main className="main">
        {videoDetail ? (
          <VideoPlayer video={videoDetail} />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎥</div>
            <h2>Select a video to preview</h2>
            <p>Choose a video from the sidebar to preview it with Remotion Player</p>
          </div>
        )}
      </main>
    </div>
  );
}
