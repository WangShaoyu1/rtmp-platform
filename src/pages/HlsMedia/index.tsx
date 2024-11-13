import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import { Button, Tag } from 'antd';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import VideoPlayer from '@/pages/HlsMedia/VideoPlayer';
import TextToSpeech from '@/pages/HlsMedia/TextToSpeech';
import { io } from 'socket.io-client';
import styles from './index.less';

const HlsMedia: React.FC = () => {
  const LOCAL_VIDEO_PATH = '/static/y2mate.mp4';
  const STREAM_URL = '//localhost:8081/hls/test123.m3u8';

  const [videoSrc, setVideoSrc] = useState({
    src: LOCAL_VIDEO_PATH,
    type: 'video/mp4',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [width, setWidth] = useState(800);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [height, setHeight] = useState(450);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ratio, setRatio] = useState(16 / 9);// 宽高比16：9
  const { audioLikes, setAudioLikes } = useModel('global');


  useEffect(() => {
    // 初始化 Socket.IO 连接
    const socket = io('http://127.0.0.1:5000/test', {
      transports: ['websocket'],
      reconnection: true,
    });

    const switchToLocalVideo = () => {
      setVideoSrc({
        src: LOCAL_VIDEO_PATH,
        type: 'video/mp4',
      });
    };

    const switchToStream = () => {
      setVideoSrc({
        src: STREAM_URL,
        type: 'application/x-mpegURL',
      });
    };

    socket.on('connect', () => {
      console.log('Socket.IO connected!!');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO 断开连接，切换到本地视频');
      switchToLocalVideo();
    });

    socket.on('rtmp', function(data) {
      console.log(`推理状态: ${data}`);
      if (data === 'start') {
        console.log('收到推流信号，切换到推流内容');
        switchToStream(); // 切换到流媒体 URL
      } else if (data === 'stop') {
        console.log('收到停止推流信号，切换到本地视频');
        switchToLocalVideo(); // 切换回本地视频
      }
    });

    // 清理 socket 连接
    return () => {
      socket.close();
    };
  }, [LOCAL_VIDEO_PATH, STREAM_URL]);

  useEffect(() => {
    localStorage.setItem('audioLikes', JSON.stringify(audioLikes));
  }, [audioLikes]);

  // tab 切换
  const onTabChange = (key: string) => {
    console.log(key);
  };

  // Tag 删除
  const onTagClose = (removedTag: string) => {
    const newTags = audioLikes.filter(tag => tag !== removedTag);
    setAudioLikes(newTags);
  };
  const tabItems = [
    {
      tab: '音频设置',
      key: 'audio',
      children:
        <>
          <ProCard gutter={8}>
            <ProCard colSpan={12} bordered>
              <h1>AI 语音生成器</h1>
              <TextToSpeech />
            </ProCard>
            <ProCard colSpan={12} title={'音频收藏'}>
              <ProCard bordered bodyStyle={{ height: 300 }}>
                {audioLikes.map(item => <Tag key={item.key}
                                             onClose={() => onTagClose(item.key)}
                                             closable>{item.label}</Tag>)
                }
              </ProCard>
            </ProCard>
          </ProCard>
        </>,
    },
    {
      tab: '视频设置',
      key: 'video',
      children: <div>视频设置</div>,
    },
    {
      tab: '效果体验',
      key: 'effect',
      children:
        <>
          <ProCard
            title={'视频播放器'}
            extra={<Button>切换视频</Button>}
            split={'vertical'}
            bordered={true}
            headerBordered={true}
          >
            <ProCard title={'左侧详情'} colSpan={'40%'}>
              <div>配置项</div>
            </ProCard>
            <ProCard title={'右侧详情'} colSpan={'60%'} layout="center">
              <VideoPlayer width={width} height={height} videoSrc={videoSrc} />
            </ProCard>

          </ProCard>
        </>,
    },
  ];
  return (
    <PageContainer
      onTabChange={onTabChange}
      ghost={false}
      content="欢迎使用 ProLayout 组件"
      // tabActiveKey={'video'}
      tabList={tabItems}
      extra={[
        <Button key="3">操作一</Button>,
        <Button key="2">操作二</Button>,
        <Button key="1" type="primary">
          发布
        </Button>,
      ]}
    >
      <div className={styles.container}>
        <main>
        </main>
      </div>
    </PageContainer>
  );
};

export default HlsMedia;