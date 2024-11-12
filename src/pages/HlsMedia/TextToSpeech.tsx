import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, Input, Button, Slider, Select } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import SpeechToSpeech from '@/pages/HlsMedia/SpeechToSpeech';
import SpeechClone from '@/pages/HlsMedia/SpeechClone';
import { getAudioDuration } from '@/utils/audio-tools';
import { openaiTTSGen, moonTTSGen, miniMaxTTSGen } from '@/utils/textToSpeechUtils';

const TextToSpeech = () => {
  const { platforms, openAISpeakers, minMaxSpeakers, moonSpeakers } = useModel('userSpeaker');
  const [platform, setPlatform] = useState('OpenAI');
  const [speaker, setSpeaker] = useState('alloy');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [genBtnStatus, setGenBtnStatus] = useState(false);
  // 根据平台选择发音人
  const speakerOptions = useMemo(() => {
    if (platform === 'OpenAI') return openAISpeakers;
    if (platform === 'Minimax') return minMaxSpeakers;
    return moonSpeakers;
  }, [platform]);

  // Minimax tts，该公司有一款明星产品 海螺AI


  // 生成语音
  const handleTextToSpeech = async () => {
    try {
      let data: Blob;
      let finalText = text?.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      setLoading(true);

      if (platform === 'OpenAI') {
        data = await openaiTTSGen({ text: finalText, speaker, speed });
      } else if (platform === 'Moon') {
        data = await moonTTSGen({ text: finalText, speaker, speed });
      } else {
        data = await miniMaxTTSGen({ text: finalText, speaker, speed });
      }

      if (!data.size) return;

      const url = URL.createObjectURL(data);
      const duration = await getAudioDuration(url);
      console.log(`duration:${duration}`);
      setAudioUrl(url);

      setLoading(false);
    } catch (err) {
      console.log(`err:${err.message}`);
    }
  };

  // 下载音频
  const handleDownload = useCallback(() => {
    if (!audioUrl) {
      console.log('no audioUrl');
      return;
    }

    const a = document.createElement('a');

    a.href = audioUrl;
    a.download = `${text?.slice(0, 10) || 'audio'}.mp3`;
    a.click();
  }, [audioUrl, text]);

  // Slider 标签显示格式化
  const formatter = (value: any) => `${value}x`;

  // Slider 标记
  const marks = {
    0.25: '0.25x',
    0.5: '0.5x',
    0.75: ' ',
    1.0: '1.0x',
    1.25: ' ',
    1.5: '1.5x',
    1.75: ' ',
    2.0: '2.0x',
  };


  useEffect(() => {
    if (platform === 'OpenAI') {
      setSpeaker(openAISpeakers[0]?.value);
    } else if (platform === 'Minimax') {
      setSpeaker(minMaxSpeakers[0]?.value);
    } else if (platform === 'Moon') {
      setSpeaker(moonSpeakers[0]?.value);
    }
  }, [platform]);

  useEffect(() => {
    setGenBtnStatus((!!(text && speed && platform && speaker)));
  }, [text, speed, platform, speaker]);

  return (
    <>
      <ProCard style={{ marginBlockStart: 8 }}>
        <Input.TextArea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="请输入文本"
          maxLength={4096}
          autoSize={{ minRows: 10 }}
        />
      </ProCard>
      <ProCard style={{ marginBlockStart: 8 }}>
        <ProCard colSpan={'300px'} layout="center">
          <Select
            value={platform}
            onChange={setPlatform}
            options={platforms}
            style={{ width: '100%' }}
            size={'large'}
          />
        </ProCard>
        <ProCard>
          <Select
            value={speaker}
            onChange={setSpeaker}
            options={speakerOptions}
            style={{ width: '100%' }}
            size={'large'}
          />
        </ProCard>
      </ProCard>
      <ProCard colSpan={24}>
        <Slider
          value={speed}
          onChange={setSpeed}
          min={0.25}
          max={2}
          step={0.05}
          marks={marks}
          tooltip={{ formatter }}
        />
      </ProCard>
      <ProCard
        direction="column"
        gutter={{ xs: 8, sm: 8, md: 8, lg: 8, xl: 8, xxl: 8 }}>
        <ProCard colSpan={24}>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </ProCard>
        <ProCard colSpan={24} direction={'column'}>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleTextToSpeech} type="primary" loading={loading} disabled={!genBtnStatus}>
              {loading ? '生成中...' : '生成'}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ marginLeft: 10 }}
              disabled={!audioUrl}
            >
              下载
            </Button>
          </div>
        </ProCard>
      </ProCard>
    </>
  );
};

const textToSpeechPlayer = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>AI 语音生成器</h1>
      <Tabs defaultActiveKey="1"
            items={[
              { label: '文本转语音', key: '1', children: <TextToSpeech /> },
              { label: '语音转语音', key: '2', children: <SpeechToSpeech /> },
              { label: '语音克隆', key: '3', children: <SpeechClone /> },
            ]}
      >
      </Tabs>
    </div>
  );
};

export default textToSpeechPlayer;
