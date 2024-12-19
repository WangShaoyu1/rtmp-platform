import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Form, message, Modal, Row, Col, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import './index.less';
import { ProCard } from '@ant-design/pro-components';
import VideoPlayer from '@/pages/HlsMedia/VideoPlayer';
import { io } from 'socket.io-client';
import { useGlobal } from '@/models/global';
import { openaiTTSGen, moonTTSGen, miniMaxTTSGen, ifytekTTSGen } from '@/utils/textToSpeechUtils';
import axios from 'axios';

const App = () => {
    const [mode, setMode] = useState('text-to-speech'); // 模式选择
    const { audioLikes, videoLikes } = useGlobal();
    const [selectedVideo, setSelectedVideo] = useState(null); // 存储选择的视频
    const [videoModalVisible, setVideoModalVisible] = useState(false); // 控制视频选择弹窗显示
    const [width, setWidth] = useState(315);
    const [height, setHeight] = useState(560);
    const [form] = Form.useForm();

    const LOCAL_VIDEO_PATH = '/static/videos/girl_15.mp4';
    const STREAM_URL = '//localhost:8081/hls/test123.m3u8';

    const [videoSrc, setVideoSrc] = useState({
      src: LOCAL_VIDEO_PATH,
      type: 'video/mp4',
    });

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
        console.log('Socket.IO connected!!!');
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO 断开连接，切换到本地视频');
        switchToLocalVideo();
      });

      socket.on('rtmp', data => {
        console.log(`推理状态1: ${data}`);
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

    // 生成按钮的处理逻辑
    const onFinish = async (values) => {
      if (!values?.text) {
        message.error('请输入文本！');
        return;
      }

      // 如果是文本提问模式，需要选择大模型
      if (values.mode === 'text-to-question' && !values?.modelType) {
        message.error('请选择大模型！');
        return;
      }

      // 确定音频平台和发音人
      const [platform, speaker] = values?.selectedAudio.split('_');

      let ttsGen = null;
      switch (platform) {
        case 'OpenAI':
          ttsGen = openaiTTSGen;
          break;
        case 'Moon':
          ttsGen = moonTTSGen;
          break;
        case 'Minimax':
          ttsGen = miniMaxTTSGen;
          break;
        case 'IFYTEK':
          ttsGen = ifytekTTSGen;
          break;
      }

      // 生成音频
      const { data: audioFile } = await ttsGen({ text: values.text, speaker, speed: 1 });

      // 构造参数
      const formData = new FormData();
      formData.append('audio', audioFile, `${values.text.slice(0, 3)}_${Date.now()}.mp3`);
      formData.append('video', values.selectedVideo);
      // 提交数据
      axios({
        method: 'post',
        url: 'http://127.0.0.1:5000/start_inference',
        data: formData,
      }).then(({ data }) => {
        console.log('生成推理视频成功_result：', data);
        message.success(data?.message);
      }).catch(({ response }) => {
        const { data } = response;
        message.error(data.message);
      });
    };

// 选择视频并更新
    const handleSelectVideo = (video) => {
      setVideoModalVisible(false);
      setSelectedVideo(video);
      form.setFieldValue('selectedVideo', video.avatarName);
      message.success(`已选择视频： ${video.name}`);
    };


    return (
      <ProCard
        title={'视频播放器'}
        extra={<Button>切换视频</Button>}
        split={'vertical'}
        bordered={true}
        headerBordered={true}
        gutter={8}
        style={{ 'minHeight': 700 }}
      >
        <ProCard title={''} colSpan={'40%'}>
          <h2>配置页面</h2>
          <Form form={form}
                layout="horizontal"
                onFinish={onFinish}
          >
            <Form.Item label="输入文本" name="text" initialValue={'请跟着我第一遍，我们是神会主义接班人'}
                       rules={[{
                         required: true,
                         message: '请输入文本',
                       }]}>
              <Input.TextArea
                placeholder="请输入文本"
                rows={4}
              />
            </Form.Item>
            <Row gutter={24}>
              <Col span={24}>
                {/* 模式选择 */}
                <Form.Item label="选择模式" name="handleType">
                  <Select allowClear={true} onSelect={value => setMode(value)}>
                    <Select.Option value="text-to-speech">文本播报</Select.Option>
                    <Select.Option value="text-to-question">文本提问</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                {/* 如果是文本提问模式，则显示选择大模型的下拉框 */}
                {mode === 'text-to-question' && (
                  <Form.Item label="选择大模型" name="modelType">
                    <Select placeholder="选择一个大模型" allowClear={true}>
                      <Select.Option value="openai">OpenAI</Select.Option>
                      <Select.Option value="alibaba">阿里通义千问</Select.Option>
                    </Select>
                  </Form.Item>
                )
                }
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={24}>
                {/* 音频选择 */}
                <Form.Item label="选择音频" name="selectedAudio"
                           rules={[{
                             required: true,
                             message: '请选择一个音频',
                           }]}>
                  <Select
                    placeholder="选择一个音频"
                    allowClear={true}
                  >
                    {audioLikes.map(({ key, value, label }, index) => (
                      <Select.Option key={key} value={value}>
                        {label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={18}>
                {/* 视频选择 */}
                <Form.Item label="选择视频" name="selectedVideo"
                           rules={[{
                             required: true,
                             message: '请选择一个视频',
                           }]}>
                  <Space.Compact>
                    <Input value={selectedVideo?.name} />
                    <Button type="default" onClick={() => setVideoModalVisible(true)}>选择视频</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
            {/* 生成按钮 */}
            <Form.Item style={{ textAlign: 'center' }}>
              <Button color="primary" variant="solid" size="large" htmlType="submit">
                生成视频
              </Button>
            </Form.Item>
          </Form>
        </ProCard>
        <ProCard title={'效果体验'} colSpan={'60%'} layout="center">
          <VideoPlayer width={width} height={height} videoSrc={videoSrc} />
        </ProCard>

        {/* 视频选择弹窗 */}
        <Modal
          title="选择视频"
          open={videoModalVisible}
          onCancel={() => setVideoModalVisible(false)}
          footer={null}
          width={800}
        >
          <Row gutter={[16, 16]}>
            {videoLikes.map((video, index) => (
              <Col span={8} key={index}>
                <div
                  className={`result-video-container ${selectedVideo === video ? 'selected' : ''}`}
                  onClick={() => handleSelectVideo(video)}
                  style={{ position: 'relative', cursor: 'pointer' }}
                >
                  <video width="100%" controls loop title={video.name}>
                    <source src={video.src} />
                    您的浏览器不支持视频标签
                  </video>

                  {/* 删除按钮去掉 */}
                </div>
              </Col>
            ))}
          </Row>
        </Modal>
      </ProCard>
    );
  }
;

export default App;
