// 全局共享数据示例
import { DEFAULT_NAME } from '@/constants';
import { useState } from 'react';

const useUser = () => {
  const [name, setName] = useState<string>(DEFAULT_NAME);
  const [audioLikes, setAudioLikes] = useState(localStorage.getItem('audioLikes') ? JSON.parse(localStorage.getItem('audioLikes') as string) : []);
  return {
    name,
    setName,
    audioLikes,
    setAudioLikes,
  };
};

export default useUser;