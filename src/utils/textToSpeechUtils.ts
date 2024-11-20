import ky from 'ky';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';
import {
  API_KEY,
  MINIMAX_API_KEY,
  MINIMAX_GROUPID,
  MINIMAX_TTS_API_HOST,
  MOON_SPEAKER_TTS_API,
  OPENAI_SPEAKER_TTS_API,
  IFLYTEK_API_ID,
  IFLYTEK_API_SECRET,
  IFLYTEK_API_KEY,
  IFLYTEK_API_HOST,
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

const ifytekTTSGen = async ({ text, speaker, speed, callback }) => {
  const startTime = performance.now();
  const audioContext = new (window.AudioContext)();
  let audioQueue = [];  // 存储接收到的音频数据（AudioBuffer）
  let isPlaying = false; // 判断当前是否正在播放

  // 获取websocket url、鉴权等等
  function getWebSocketUrl(apiKey: string, apiSecret: string) {
    let host = location.host,
      date = (new Date()).toGMTString(),
      algorithm = 'hmac-sha256',
      headers = 'host date request-line',
      signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`,
      signatureSha = HmacSHA256(signatureOrigin, apiSecret),
      signature = Base64.stringify(signatureSha),
      authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`,
      authorization = btoa(authorizationOrigin);
    console.log(`IFLYTEK_API_HOST:${IFLYTEK_API_HOST}`);
    return `${IFLYTEK_API_HOST}?authorization=${authorization}&date=${date}&host=${host}`;
  }

  // base64编码
  function encodeBase64(text: string) {
    // 创建 TextEncoder 实例，将文本编码为 UTF-8 字节流
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(text);

    // 将字节数组转换为二进制字符串
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    // 使用 btoa 对二进制数据进行 Base64 编码
    return btoa(binary);
  }

  // 将 base64 编码的音频转换为 AudioBuffer
  function base64ToAudioBuffer(base64: string) {
    return new Promise((resolve, reject) => {
      const binary = atob(base64); // 解码 base64 字符串为二进制数据
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);

      for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
      }

      // 使用 AudioContext 解码音频数据并返回 AudioBuffer
      audioContext.decodeAudioData(view.buffer)
        .then(resolve)
        .catch(err => {
          console.error(`decodeAudioData error:${err}`);
          reject(err);
        });
    });
  }

  // 播放音频
  function playAudio() {
    if (audioQueue.length === 0) return alert('音频队列为空');

    isPlaying = true;
    const buffer = audioQueue.shift();  // 获取音频队列中的第一个音频块
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);  // 连接到音频输出

    // 播放音频
    source.start();
    source.onended = function() {
      isPlaying = false;  // 播放结束后标记为不再播放

      // 如果队列中还有音频，则继续播放
      if (audioQueue.length > 0) {
        playAudio();
      }
    };
  }

  function connectWebSocket() {
    if (!('WebSocket' in window)) return alert('浏览器不支持WebSocket');

    const url = getWebSocketUrl(IFLYTEK_API_KEY, IFLYTEK_API_SECRET);
    const ttsWebsocket = new WebSocket(url);

    ttsWebsocket.onopen = () => {
      console.log('Socket.IO connected!!');
      let params = {
        common: { app_id: IFLYTEK_API_ID },
        business: {
          // aue: 'lame',
          aue: 'speex-org-wb;2',
          // sfl: 1,
          tte: 'utf8',
          auf: 'audio/L16;rate=16000',
          vcn: speaker,
          speed,
        },
        data: {
          status: 2,
          text: encodeBase64(text),
        },
      };
      ttsWebsocket.send(JSON.stringify(params));
    };

    ttsWebsocket.onmessage = (e) => {
      let jsonData = JSON.parse(e.data);

      // 合成失败
      if (jsonData.code !== 0) {
        console.error(jsonData);
        return;
      }

      // 合成成功
      const base64Data = jsonData.data.audio;
      console.log(`base64Data:${base64Data.substring(0, 20)}`);
      base64ToAudioBuffer(base64Data).then((audioBuffer) => {
        audioQueue.push(audioBuffer);// 将接收到的音频数据存入 audioQueue

        // 如果当前没有音频在播放，则开始播放
        if (!isPlaying) {
          playAudio();
        }
      }).catch((err) => {
        console.error(`base64ToAudioBuffer error:${err}`);
      });

      // 合成结束
      if (jsonData.code === 0 && jsonData.data.status === 2) {
        const endTime = performance.now();
        ttsWebsocket.close();

        callback({
          // @ts-ignore
          data: new Blob([audioQueue.map((buffer) => buffer.getChannelData(0))], { type: 'audio/wav' }),
          apiDuration: Number(((endTime - startTime) / 1000).toFixed(2)),
        });
        return;
      }

    };

    ttsWebsocket.onclose = () => {
      console.log('Socket.IO 断开连接，讯飞流式');
    };

    ttsWebsocket.onerror = (err) => {
      console.log(`讯飞tts合成出错:${err}`);
    };
  }

  connectWebSocket();
};

export {
  openaiTTSGen,
  moonTTSGen,
  miniMaxTTSGen,
  ifytekTTSGen,
};

// 讯飞 tts 备份
// const ifytekTTSGen_backup = async ({ text, speaker, speed }) => {
//   // Helper function to write a string into DataView
//   function writeString(view, offset, string) {
//     for (let i = 0; i < string.length; i++) {
//       view.setUint8(offset + i, string.charCodeAt(i));
//     }
//   }
//
//   class AudioPlayer {
//     fromSampleRate: number;
//     toSampleRate: number;
//     processor: Worker;
//     audioBlob: any;
//
//     constructor() {
//       this.fromSampleRate = 16000;        // 原始采样率
//       this.toSampleRate = 22050;          // 目标采样率
//       this.processor = new Worker(`audioWorkerTread.ts`); // 创建 Web Worker
//       this.audioBlob = null;              // 存储生成的音频 Blob
//     }
//
//     startProcessing({ sampleRate = 16000 } = {}) {
//       this.fromSampleRate = sampleRate;
//       this.toSampleRate = Math.min(Math.max(sampleRate, 22050), 96000);
//
//       // 初始化 Web Worker
//       this.processor.postMessage({
//         type: 'init',
//         data: { fromSampleRate: this.fromSampleRate, toSampleRate: this.toSampleRate },
//       });
//
//       // 监听 Worker 返回的消息
//       this.processor.onmessage = ({ data }) => {
//         const { audioData, pcmAudioData } = data;
//         this.generateAudioBlob([pcmAudioData]);
//       };
//     }
//
//     generateAudioBlob(pcmDataArray: any) {
//       // 将 PCM 数据转换为 WAV 格式的 Blob
//       const wavBlob = this.convertToWav(pcmDataArray, this.fromSampleRate, 16);
//       this.audioBlob = wavBlob;
//       return wavBlob;
//     }
//
//     convertToWav(pcmDataArray, sampleRate, bitDepth) {
//       const numChannels = 1;
//       const byteRate = (sampleRate * numChannels * bitDepth) / 8;
//       const wavBufferLength = pcmDataArray.reduce((acc, curr) => acc + curr.byteLength, 0);
//       const wavHeaderLength = 44;
//       const totalBufferLength = wavHeaderLength + wavBufferLength;
//
//       const buffer = new ArrayBuffer(totalBufferLength);
//       const view = new DataView(buffer);
//
//       // WAV Header
//       writeString(view, 0, 'RIFF');
//       view.setUint32(4, totalBufferLength - 8, true);
//       writeString(view, 8, 'WAVE');
//       writeString(view, 12, 'fmt ');
//       view.setUint32(16, 16, true);
//       view.setUint16(20, 1, true);
//       view.setUint16(22, numChannels, true);
//       view.setUint32(24, sampleRate, true);
//       view.setUint32(28, byteRate, true);
//       view.setUint16(32, (numChannels * bitDepth) / 8, true);
//       view.setUint16(34, bitDepth, true);
//       writeString(view, 36, 'data');
//       view.setUint32(40, wavBufferLength, true);
//
//       // Write PCM Data
//       let offset = wavHeaderLength;
//       for (let pcmData of pcmDataArray) {
//         const int16Array = new Int16Array(pcmData.buffer);
//         for (let i = 0; i < int16Array.length; i++) {
//           view.setInt16(offset, int16Array[i], true);
//           offset += 2;
//         }
//       }
//
//       return new Blob([buffer], { type: 'audio/wav' });
//     }
//
//     getAudioUrl() {
//       if (this.audioBlob) {
//         return URL.createObjectURL(this.audioBlob); // 生成 URL 供 <audio> 元素使用
//       }
//       return null;
//     }
//   }
//
//   const audioPlayer = new AudioPlayer();
//
//   function getWebSocketUrl(apiKey: string, apiSecret: string) {
//     let host = location.host,
//       date = (new Date()).toString(),
//       algorithm = 'hmac-sha256',
//       headers = 'host date request-line',
//       signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`,
//       signatureSha = HmacSHA256(signatureOrigin, apiSecret),
//       signature = Base64.stringify(signatureSha),
//       authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`,
//       authorization = btoa(authorizationOrigin);
//
//     return `${IFLYTEK_API_HOST}?authorization=${authorization}&date=${date}&host=${host}`;
//   }
//
//   function connectWebSocket() {
//     if (!('WebSocket' in window)) return alert('浏览器不支持WebSocket');
//
//     const url = getWebSocketUrl(IFLYTEK_API_KEY, IFLYTEK_API_SECRET);
//     const ttsWebsocket = io(url, {
//       transports: ['websocket'],
//       reconnection: true,
//     });
//
//     ttsWebsocket.on('connect', () => {
//       console.log('Socket.IO connected!!');
//       // @ts-ignore
//       audioPlayer.start({
//         autoPlay: true,
//         sampleRate: 16000,
//         resumePlayDuration: 1000,
//       });
//
//       let params = {
//         common: { app_id: IFLYTEK_API_ID },
//         business: {
//           aue: 'raw',
//           auf: 'audio/L16;rate=16000',
//           vcn: speaker,
//           speed,
//         },
//         data: {
//           status: 2,
//           text: Base64.stringify(text),
//         },
//       };
//       ttsWebsocket.send(JSON.stringify(params));
//     });
//
//     ttsWebsocket.on('message', (e) => {
//       let jsonData = JSON.parse(e.data);
//       // 合成失败
//       if (jsonData.code !== 0) {
//         console.error(jsonData);
//         return;
//       }
//       // @ts-ignore
//       audioPlayer.postMessage({
//         type: 'base64',
//         data: jsonData.data.audio,
//         isLastData: jsonData.data.status === 2,
//       });
//       if (jsonData.code === 0 && jsonData.data.status === 2) {
//         ttsWebsocket.close();
//       }
//     });
//
//     ttsWebsocket.on('disconnect', () => {
//       console.log('Socket.IO 断开连接，讯飞流式');
//     });
//
//     ttsWebsocket.on('error', err => {
//       console.log(`讯飞tts合成error:${err.message}`);
//     });
//
//   }
//
//   connectWebSocket();
// };