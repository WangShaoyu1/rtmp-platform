// 全局共享数据示例
import { PLATFORMS, OPENAI_SPEAKERS, MINMAX_SPEAKERS, MOON_SPEAKERS, IFYTEK_SPEAKERS } from '@/constants';
import { useState } from 'react';

const Speakers = () => {
  const [platforms, setPlatforms] = useState<object>(PLATFORMS);
  const [openAISpeakers, setOpenAISpeakers] = useState<object>(OPENAI_SPEAKERS);
  const [minMaxSpeakers, setMinMaxSpeakers] = useState<object>(MINMAX_SPEAKERS);
  const [moonSpeakers, setMoonSpeakers] = useState<object>(MOON_SPEAKERS);
  const [ifytekSpeakers, setIfytekSpeakers] = useState<object>(IFYTEK_SPEAKERS);
  return {
    platforms,
    setPlatforms,
    openAISpeakers,
    setOpenAISpeakers,
    minMaxSpeakers,
    setMinMaxSpeakers,
    moonSpeakers,
    setMoonSpeakers,
    ifytekSpeakers,
    setIfytekSpeakers,
  };
};


export default Speakers;
