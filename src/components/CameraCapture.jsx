import React, { useState, useRef } from 'react';
import { Modal, Button } from 'antd';
import Draggable from 'react-draggable';
import Webcam from 'react-webcam';

const CameraCapture = ({ onCapture }) => {
  const [visible, setVisible] = useState(false);
  const webcamRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null); // 存储摄像头权限状态

  // 检查摄像头权限
  const checkCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true); // 获取到权限
    } catch (error) {
      setHasCameraPermission(false); // 权限被拒绝
    }
  };
  
  // 打开摄像头
  const handleOpenCamera = async () => {
    if (hasCameraPermission === null) {
      await checkCameraPermission(); // 初次点击时检查权限
    }

    if (hasCameraPermission === false) {
      // 如果权限被拒绝，提示用户打开摄像头权限
      message.error('请在浏览器设置中启用摄像头权限');
    } else if (hasCameraPermission === true) {
      // 如果有权限，直接打开摄像头
      setVisible(true);
    } else {
      // 如果没有检查权限，提示用户等待
      message.info('正在检查摄像头权限...');
    }
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc); // Pass the captured image to parent component
      setVisible(false);
    }
  };

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        打开摄像头
      </Button>
      <Draggable handle=".ant-modal-header">
        <Modal
          open={visible}
          title="拍照"
          closable={false}
          onCancel={() => setVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setVisible(false)}>
              取消
            </Button>,
            <Button key="capture" type="primary" onClick={handleCapture}>
              确认
            </Button>,
          ]}
          width={600} // 设置弹窗宽度
          centered // 弹窗居中显示
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                facingMode: 'user',
              }}
            />
          </div>
        </Modal>
      </Draggable>
    </>
  );
};

export default CameraCapture;
