"use client";

import { useCallback, useRef } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { VideoInputNodeData } from "@/types";
import { useVideoBlobUrl } from "@/hooks/useVideoBlobUrl";

type VideoInputNodeType = Node<VideoInputNodeData, "videoInput">;

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ACCEPTED_FORMATS = "video/mp4,video/webm,video/quicktime";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoInputNode({ id, data, selected }: NodeProps<VideoInputNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use blob URL for efficient playback of large base64 videos
  const playbackUrl = useVideoBlobUrl(nodeData.video ?? null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.match(/^video\//)) {
        alert("Unsupported format. Use MP4, WebM, or QuickTime video files.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("Video file too large. Maximum size is 200MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;

        // Extract duration and dimensions using HTML Video element
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          updateNodeData(id, {
            video: base64,
            videoRef: undefined,
            filename: file.name,
            format: file.type,
            duration: video.duration,
            dimensions: { width: video.videoWidth, height: video.videoHeight },
          });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
          // Still load the file even if metadata extraction fails
          updateNodeData(id, {
            video: base64,
            videoRef: undefined,
            filename: file.name,
            format: file.type,
            duration: null,
            dimensions: null,
          });
          URL.revokeObjectURL(video.src);
        };
        // Use blob URL for metadata extraction to avoid base64 parsing overhead
        const blob = new Blob([Uint8Array.from(atob(base64.split(",")[1]), c => c.charCodeAt(0))], { type: file.type });
        video.src = URL.createObjectURL(blob);
      };
      reader.readAsDataURL(file);
    },
    [id, updateNodeData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRemove = useCallback(() => {
    updateNodeData(id, {
      video: null,
      videoRef: undefined,
      filename: null,
      duration: null,
      dimensions: null,
      format: null,
    });
  }, [id, updateNodeData]);

  return (
    <BaseNode
      id={id}
      selected={selected}
      minWidth={250}
      minHeight={200}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleFileChange}
        className="hidden"
      />

      {nodeData.video ? (
        <div className="relative group flex-1 flex flex-col min-h-0 gap-2">
          {nodeData.isOptional && (
            <span className="absolute top-1 left-1 z-10 text-[9px] font-medium text-neutral-300 bg-black/50 px-1.5 py-0.5 rounded">
              Optional
            </span>
          )}
          {/* Filename and duration */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] text-neutral-400 truncate max-w-[150px]" title={nodeData.filename || ""}>
              {nodeData.filename}
            </span>
            <div className="flex items-center gap-1">
              {nodeData.duration != null && (
                <span className="text-[10px] text-neutral-500 bg-neutral-700/50 px-1.5 py-0.5 rounded">
                  {formatDuration(nodeData.duration)}
                </span>
              )}
              {nodeData.dimensions && (
                <span className="text-[10px] text-neutral-500 bg-neutral-700/50 px-1.5 py-0.5 rounded">
                  {nodeData.dimensions.width}x{nodeData.dimensions.height}
                </span>
              )}
            </div>
          </div>

          {/* Video player */}
          <div className="flex-1 min-h-[120px] bg-neutral-900/50 rounded overflow-hidden">
            <video
              src={playbackUrl ?? undefined}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            />
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload video file"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`w-full h-full bg-neutral-900/40 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-800/60 transition-colors ${nodeData.isOptional ? "border-2 border-dashed border-neutral-600" : ""}`}
        >
          <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="text-xs text-neutral-500 mt-2">
            {nodeData.isOptional ? "Optional" : "Drop video or click"}
          </span>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="video"
        data-handletype="video"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="video"
        data-handletype="video"
      />
    </BaseNode>
  );
}
