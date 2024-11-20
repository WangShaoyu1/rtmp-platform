// 配置对象，用于管理采样率和其他设置
const config = {
  fromSampleRate: 16000,  // 默认原始采样率
  toSampleRate: 22050,     // 默认目标采样率
};

// 采样率转换函数（线性插值）
function resample(inputArray: any, fromSampleRate: number, toSampleRate: number) {
  const ratio = toSampleRate / fromSampleRate;
  const outputLength = Math.round(inputArray.length * ratio);
  const outputArray = new Float32Array(outputLength);

  // 线性插值采样
  for (let i = 0; i < outputLength; i++) {
    const originalIndex = i / ratio;
    const leftIndex = Math.floor(originalIndex);
    const rightIndex = Math.min(Math.ceil(originalIndex), inputArray.length - 1);
    const weight = originalIndex - leftIndex;
    outputArray[i] = (1 - weight) * inputArray[leftIndex] + weight * inputArray[rightIndex];
  }

  return outputArray;
}

// 将 Base64 字符串转换为 Int16Array
function base64ToInt16Array(base64String: string) {
  const binaryString = atob(base64String);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(buffer.buffer);
}

// 将 Int16Array 转换为 Float32Array，并进行归一化
function int16ToFloat32(int16Array: any) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int16 = int16Array[i];
    float32Array[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
  }
  return float32Array;
}


// 处理音频数据函数
function processAudioData(audioData: any) {
  // 如果是 Base64 编码的字符串，先解码为 Int16Array
  if (typeof audioData === 'string') {
    // eslint-disable-next-line no-param-reassign
    audioData = base64ToInt16Array(audioData);
  }

  // 将 Int16Array 转换为 Float32Array，并进行归一化
  const float32AudioData = int16ToFloat32(audioData);

  // 执行采样率转换
  const resampledData = resample(float32AudioData, config.fromSampleRate, config.toSampleRate);

  return {
    resampledData: resampledData,
    originalPCM: audioData,
  };
}

// 监听来自主线程的消息
self.onmessage = function(event: any) {
  const { type, data } = event.data;

  if (type === 'init') {
    // 初始化采样率设置
    config.fromSampleRate = data.fromSampleRate;
    config.toSampleRate = data.toSampleRate;
  } else if (type === 'processAudio') {
    // 处理音频数据
    const processedAudioData = processAudioData(data);

    // 将处理后的音频数据发送回主线程
    self.postMessage({
      audioData: processedAudioData.resampledData,   // 转换后的 PCM 数据
      pcmAudioData: processedAudioData.originalPCM,   // 原始 PCM 数据
    });
  }
};

