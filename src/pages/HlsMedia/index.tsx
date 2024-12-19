import React, { useEffect, useState } from 'react';
import { Button, message, Tag } from 'antd';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import TextToSpeech from '@/pages/HlsMedia/TextToSpeech';
import ImageToVideo from '@/pages/HlsMedia/ImageToVideo';
import VideoLikes from '@/pages/HlsMedia/VideoLikes';
import ResultEffect from '@/pages/HlsMedia/ResultEffect';
import { useGlobal } from '@/models/global';
import styles from './index.less';

const HlsMedia: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const info = ({ type = 'info', content }) => {
    messageApi[type](content);
  };
  const { audioLikes, removeAudioLike } = useGlobal();

  useEffect(() => {

  }, []);

  // tab 切换
  const onTabChange = (key: string) => {
    console.log(key);
  };

  // Tag 删除
  const onTagClose = (id: string) => {
    console.log('onTagClose:', id);
    removeAudioLike(id).then(() => {
      info({ content: '音频删除成功', type: 'success' });
    });
  };

  const tabItems = [
    {
      tab: '音频设置',
      key: 'audio',
      children:
        <>
          <ProCard gutter={8}>
            <ProCard colSpan={12} bordered style={{ 'minHeight': 600 }}>
              <h1>AI 语音生成器</h1>
              <TextToSpeech />
            </ProCard>
            <ProCard bordered style={{ 'minHeight': 600 }}>
              <h1>音频收藏</h1>
              {audioLikes.map(item => <Tag key={item.key}
                                           onClose={() => onTagClose(item.id)}
                                           style={{ padding: '4px' }}
                                           closable>{item.label}</Tag>)
              }
            </ProCard>
          </ProCard>
        </>,
    },
    {
      tab: '视频设置',
      key: 'video',
      children:
        <>
          <ProCard gutter={8}>
            <ProCard colSpan={12} bordered style={{ 'minHeight': 600 }}>
              <h1>MuseV视频生成器</h1>
              <ImageToVideo />
            </ProCard>
            <ProCard colSpan={12} bordered title={'MuseV视频'} style={{ 'minHeight': 600 }}>
              <VideoLikes />
            </ProCard>
          </ProCard>
        </>,
    },
    {
      tab: '效果体验',
      key: 'effect',
      children:
        <>
          <ResultEffect />
        </>,
    },
  ];
  return (
    <>
      {contextHolder}
      <PageContainer
        onTabChange={onTabChange}
        ghost={false}
        content="欢迎使用虚拟人生成平台"
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
    </>
  );
};

export default HlsMedia;