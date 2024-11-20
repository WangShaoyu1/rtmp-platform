import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, Input, Button, Slider, Select, message, Divider, Flex, Tag } from 'antd';
import { DownloadOutlined, FileTextTwoTone, HeartTwoTone, SoundTwoTone } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import SpeechToSpeech from '@/pages/HlsMedia/SpeechToSpeech';
import SpeechClone from '@/pages/HlsMedia/SpeechClone';
import { getAudioDuration } from '@/utils/audio-tools';
import { openaiTTSGen, moonTTSGen, miniMaxTTSGen, ifytekTTSGen } from '@/utils/textToSpeechUtils';

const TextToSpeech = () => {
  const { platforms, openAISpeakers, minMaxSpeakers, moonSpeakers, ifytekSpeakers } = useModel('userSpeaker');
  const { audioLikes, setAudioLikes } = useModel('global');
  const [platform, setPlatform] = useState('OpenAI');
  const [speaker, setSpeaker] = useState('alloy');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [genBtnStatus, setGenBtnStatus] = useState(false);
  const [exampleText] = useState(['欢迎来到这里', '天气真不错。', '每天都在努力，迎接新的挑战', '知识改变命运，学习是最好的投资',
    '在这个快速变化的世界里，我们每个人都在寻找自己的方向，努力不懈地追求着属于自己的梦想。']);
  const [audioDuration, setAudioDuration] = useState(0);
  const [genDuration, setGenDuration] = useState(0);

  // 根据平台选择发音人
  const speakerOptions = useMemo(() => {
    if (platform === 'OpenAI') return openAISpeakers;
    if (platform === 'Minimax') return minMaxSpeakers;
    if (platform === 'IFYTEK') return ifytekSpeakers;
    return moonSpeakers;
  }, [platform]);

  // 生成语音
  const handleTextToSpeech = async () => {
    try {
      let data: Blob, apiDuration: number;
      let finalText = text?.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      setLoading(true);

      if (platform === 'OpenAI') {
        const result = await openaiTTSGen({ text: finalText, speaker, speed });
        ({ data, apiDuration } = result);
      } else if (platform === 'Moon') {
        const result = await moonTTSGen({ text: finalText, speaker, speed });
        ({ data, apiDuration } = result);
        console.log('Moon-data:', data);
      } else if (platform === 'Minimax') {
        const result = await miniMaxTTSGen({ text: finalText, speaker, speed });
        ({ data, apiDuration } = result);
      } else if (platform === 'IFYTEK') {
        await ifytekTTSGen({
          text: finalText, speaker, speed, callback: async (result: any) => {
            ({ data, apiDuration } = result);
          },
        });
      }

      setLoading(false);
      if (!data?.size) return;

      const url = URL.createObjectURL(data);
      const duration = await getAudioDuration(url);
      setAudioDuration(Number(duration.toFixed(2)));
      setGenDuration(apiDuration);
      setAudioUrl(url);

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

    // 释放内存
    URL.revokeObjectURL(audioUrl);
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

  const addAudioLikes = () => {
    setAudioLikes([...audioLikes, {
        platform,
        speaker,
        label: `${platform}_${speakerOptions.find(({ value }) => value === speaker)?.label}`,
        key: `${platform}_${speaker}`,
        value: `${platform}_${speaker}`,
      }].filter((item, index, arr) => (arr.findIndex(t => t.key === item.key) === index) ||
        !message.error(`${platform}_${speaker}已经添加过了`)),
    );
  };

  useEffect(() => {
    if (platform === 'OpenAI') {
      setSpeaker(openAISpeakers[0]?.value);
    } else if (platform === 'Minimax') {
      setSpeaker(minMaxSpeakers[0]?.value);
    } else if (platform === 'Moon') {
      setSpeaker(moonSpeakers[0]?.value);
    } else if (platform === 'IFYTEK') {
      setSpeaker(ifytekSpeakers[0]?.value);
    }
  }, [platform]);

  useEffect(() => {
    setGenBtnStatus((!!(text && speed && platform && speaker)));
  }, [text, speed, platform, speaker]);


  // @ts-ignore
  // @ts-ignore
  return (
    <>
      <ProCard style={{ marginBlockEnd: 6 }}>
        <Input.TextArea
          value={text}
          showCount
          onChange={e => setText(e.target.value)}
          placeholder="请输入文本"
          maxLength={512}
          autoSize={{ minRows: 6 }}
        />
      </ProCard>
      <ProCard>
        <Divider orientation="left"><FileTextTwoTone /> 示例文本</Divider>
        <Flex gap="4px" wrap>
          {
            exampleText.map((text, index) => <Button key={index} onClick={() => setText(text)}>{text}</Button>)
          }
        </Flex>
      </ProCard>
      <ProCard>
        <Divider orientation="left"><SoundTwoTone /> 声音配置</Divider>
        <Flex justify="space-between">
          <Select
            value={platform}
            onChange={setPlatform}
            /*@ts-ignore*/
            options={platforms}
            style={{ width: 200 }}
            size={'large'}
          />
          <Select
            value={speaker}
            onChange={setSpeaker}
            /*@ts-ignore*/
            options={speakerOptions}
            style={{ width: 300 }}
            size={'large'}
          />
        </Flex>
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
          <Flex justify="space-between">
            <div>
              <Tag style={{ padding: '4px' }}>音频时长：{audioDuration}s</Tag>
              <Tag style={{ padding: '4px' }}>生成耗时：{genDuration}s</Tag>
            </div>
            <div>
              <Button onClick={handleTextToSpeech} type="primary" loading={loading} disabled={!genBtnStatus}>
                {loading ? '生成中...' : '试听'}
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload} style={{ marginLeft: 10 }}
                      disabled={!audioUrl}>下载</Button>
              <Button icon={<HeartTwoTone />} onClick={addAudioLikes} style={{ marginLeft: 10 }}
                      disabled={false}>喜欢</Button>
            </div>
          </Flex>
        </ProCard>
      </ProCard>
    </>
  );
};

const textToSpeechPlayer = () => {
  return (
    <>
      <Tabs defaultActiveKey="1"
            items={[
              { label: '文本转语音', key: '1', children: <TextToSpeech /> },
              { label: '语音转语音', key: '2', children: <SpeechToSpeech /> },
              { label: '语音克隆', key: '3', children: <SpeechClone /> },
            ]}
      >
      </Tabs>
    </>
  );
};

export default textToSpeechPlayer;
