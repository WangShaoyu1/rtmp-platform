import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import {io} from 'socket.io-client';
import videojs from 'video.js'
import { useModel } from '@umijs/max';
import styles from './index.less';

const socket = io('http://127.0.0.1:5000/test', {
  transports: ['websocket'],
  reconnection: true,
});

const videoPlayer = videojs('videoPlayer');
const localVideoPath = 'static/sun.mp4';
const streamUrl = '//localhost:8081/hls/test123.m3u8';

// 切换到推流内容
function switchToStream(url) {
  videoPlayer.src({
    src: url,
    type: 'application/x-mpegURL',
  });
  videoPlayer.load();
  videoPlayer.play();
}

// 切换到本地视频
function switchToLocalVideo() {
  videoPlayer.src({
    src: localVideoPath,
    type: 'video/mp4',
  });
  videoPlayer.load();
  videoPlayer.play();
}

socket.on('connect', () => {
  console.log('Socket.IO connected!!');
});

socket.on('disconnect', () => {
  console.log('Socket.IO 断开连接，切换到本地视频');
  switchToLocalVideo();
});

socket.on('message', function(data) {
  console.log(`message-data: ${JSON.stringify(data)}`);
});

// 监听推流信号，start切换推流视频，stop切换本地视频
socket.on('rtmp', function(data) {
  console.log(`推理状态: ${data}`);
  if (data === 'start') {
    console.log('收到推流信号，切换到推流内容');
    switchToStream(streamUrl);
  } else if (data === 'stop') {
    console.log('收到停止推流信号，切换到本地视频');
    switchToLocalVideo();
  }
});

// 默认播放本地视频
switchToLocalVideo();

const HomePage: React.FC = () => {
  const { name } = useModel('global');
  return (
    <PageContainer ghost>
      <div className={styles.container}>
        <main className="content">
          <div className="video-container">
            <video
              id="videoPlayer"
              className="video-js vjs-default-skin"

              preload="auto"
              autoPlay
              muted>
              <source id="videoSource" src="static/y2mate.mp4" type="video/mp4" />
              您的浏览器不支持该视频标签或视频格式。
            </video>
          </div>
        </main>
      </div>
    </PageContainer>
  );
};

export default HomePage;
