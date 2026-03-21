import { VideoMeta } from "../types/video";

interface VideoListProps {
  videos: VideoMeta[];
  selectedVideo: VideoMeta | null;
  onSelect: (video: VideoMeta) => void;
  loading: boolean;
  error: string | null;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function VideoList({
  videos,
  selectedVideo,
  onSelect,
  loading,
  error,
}: VideoListProps) {
  if (loading) {
    return (
      <div className="video-list-loading">
        <div className="spinner"></div>
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-list-error">
        <p>❌ {error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="video-list-empty">
        <p>No videos found</p>
        <p className="hint">
          Run <code>video-script create</code> to generate videos
        </p>
      </div>
    );
  }

  // Group videos by year/week folder
  const groupedVideos = videos.reduce(
    (groups, video) => {
      const parts = video.path.split("/");
      const groupKey = parts.length >= 2 ? parts[0] : "Other";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(video);
      return groups;
    },
    {} as Record<string, VideoMeta[]>
  );

  return (
    <div className="video-list">
      {Object.entries(groupedVideos).map(([group, groupVideos]) => (
        <div key={group} className="video-group">
          <div className="video-group-header">{group}</div>
          {groupVideos.map((video) => (
            <div
              key={video.id}
              className={`video-item ${selectedVideo?.id === video.id ? "selected" : ""}`}
              onClick={() => onSelect(video)}
            >
              <div className="video-item-title">{video.title}</div>
              <div className="video-item-meta">
                <span className="duration">{formatDuration(video.duration)}</span>
                <span className="scenes">{video.scenesCount} scenes</span>
                <span className="date">{formatDate(video.createdAt)}</span>
              </div>
              {video.outputMp4Path && (
                <div className="video-item-badge">✓ Rendered</div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
