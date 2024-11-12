import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  width: number;
  height: number;
  videoSrc: {
    src: string;
    type: string;
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ width, height, videoSrc }) => {
  const videoNode = useRef(null);
  const player = useRef(null);

  useEffect(() => {
    // 初始化 Video.js 播放器
    player.current = videojs(videoNode.current, {
      autoplay: true,
      controls: true,
      muted: true,
      width: width,
      height: height,
      sources: [videoSrc],
    });

    return () => {
      if (player.current) {
        player.current.dispose();
        player.current = null;
      }
    };
  }, [width, height]);

  // 当 videoSrc 发生变化时更新视频源
  useEffect(() => {
    if (player.current) {
      player.current.src(videoSrc);
      player.current.play();
    }
  }, [videoSrc]);

  return (
    <div data-vjs-player>
      <video ref={videoNode} className="video-js" />
    </div>
  );
};

export default VideoPlayer;