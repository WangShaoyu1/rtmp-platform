import ky from 'ky';
import {
  API_KEY,
  MINIMAX_API_KEY,
  MINIMAX_GROUPID,
  MINIMAX_TTS_API_HOST,
  MOON_SPEAKER_TTS_API,
  OPENAI_SPEAKER_TTS_API,
} from '@/config/mode';

// OpenAI tts
const openaiTTSGen = async ({ text, speaker, speed }) => {
  const startTime = performance.now();
  const resp = await ky.post(OPENAI_SPEAKER_TTS_API, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    json: {
      model: 'tts-1',
      input: text,
      voice: speaker,
      speed,
    },
    timeout: 10000,
  });
  const endTime = performance.now();
  return {
    data: await resp.blob(),
    apiDuration: Number(((endTime - startTime) / 1000).toFixed(2)),
  };
};

// 豆包AI tts
const moonTTSGen = async ({ text, speaker, speed }) => {
  const startTime = performance.now();
  const resp = (await ky.post(MOON_SPEAKER_TTS_API, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    json: {
      audio: {
        voice_type: speaker,
        encoding: 'wav',
        speed_ratio: speed,
      },
      request: {
        reqid: new Date().getTime().toString(),
        text,
        operation: 'query',
      },
    },
    timeout: 10000,
  }).json()) as { data: string };

  const base64Data = resp.data;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const endTime = performance.now();

  return {
    data: new Blob([bytes.buffer], { type: 'audio/wav' }),
    apiDuration: Number(((endTime - startTime) / 1000).toFixed(2)),
  };
};

// Minimax tts，该公司有一款明星产品 海螺AI
const miniMaxTTSGen = async ({ text, speaker, speed, ...options }) => {
  const startTime = performance.now();
  const resp = (await ky.post(`${MINIMAX_TTS_API_HOST}?GroupId=${MINIMAX_GROUPID}`, {
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    json: {
      model: 'speech-01-turbo',
      text,
      stream: options?.stream || false,
      voice_setting: {
        voice_id: speaker,
        speed,
        vol: 1,
        pitch: 1,
      },
      audio_setting: {
        audio_sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 2,
      },
    },
    timeout: 10000,
  }).json()) as { data: { audio: string } };

  const hexData = resp.data.audio;
  const byteArray = new Uint8Array(hexData.length / 2);
  for (let i = 0; i < hexData.length; i += 2) {
    byteArray[i / 2] = parseInt(hexData.substr(i, 2), 16);
  }
  const endTime = performance.now();
  return {
    data: new Blob([byteArray], { type: 'audio/wav' }),
    apiDuration: Number(((endTime - startTime) / 1000).toFixed(2)),
  };
};

export {
  openaiTTSGen,
  moonTTSGen,
  miniMaxTTSGen,
};
