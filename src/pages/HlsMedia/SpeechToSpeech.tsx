import React, { useState, useMemo, useEffect } from 'react';
import { ProCard } from '@ant-design/pro-components';

const SpeechClone = () => {
  // 语音转文本的逻辑，可以在此实现
  return (
    <>
      <ProCard
        style={{ height: 507 }}
      >
        <div>语音转文本组件</div>
      </ProCard>
    </>
  );
};

const speechClonePlayer = () => {
  return (
    <>
      <SpeechClone />
    </>
  );
};

export default speechClonePlayer;
