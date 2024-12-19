import React, { useState, useEffect } from 'react';
import { Button, Card, Form, InputNumber, message, Col, Row, Slider, Upload } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import CameraCapture from '@/components/CameraCapture';
import ImageViewer from '@/components/ImageViewer';
import { useGlobal } from '@/models/global';
import './index.less';

const App = () => {
  const { images, addImage, removeImage } = useGlobal();
  const defaultImages = ['/static/images/danbao.png', '/static/images/wanxiaoan.png', '/static/images/wanxiaomei.png'];
  const [selectedImage, setSelectedImage] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);  // 控制ImageViewer的显示
  const [form] = Form.useForm();

  // 加载本地存储的图片
  useEffect(() => {
    if (images.length === 0) {
      defaultImages.forEach(image => {
        addImage({ id: Date.now(), src: image });
      });
    }
  }, [images, addImage]);

  // 上传图片的处理
  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        addImage({ id: Date.now(), src: e.target.result }); // 调用 global.ts 中的 addImage 方法
        message.success('图片上传成功');
      }
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload behavior
  };

  // 拍照
  const handleCapture = (imageSrc) => {
    addImage({ id: Date.now(), src: imageSrc }); // 通过 addImage 添加图片
    message.success('图片上传成功');
  };

  // 选择图片
  const handleSelectImage = (index) => {
    setSelectedImage(index);
    setIsViewerVisible(true);  // 显示ImageViewer
  };

  // 删除图片
  const handleRemoveImage = (id) => {
    removeImage(id);  // 通过 removeImage 删除图片
    message.success('图片删除成功');
  };

  // 关闭ImageViewer
  const handleCloseViewer = () => {
    setIsViewerVisible(false);  // 关闭ImageViewer
  };

  // 表单提交
  const onFinish = (values) => {
    console.log('Success:', values);
  };

  return (
    <div className="image-to-video-container">
      <div className="image-to-video-upload-section">
        <Upload
          accept="image/*"
          customRequest={() => {
          }} // Disable default upload behavior
          beforeUpload={handleUpload}
          listType="picture-card"
          showUploadList={false}
          multiple
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上 传</div>
          </div>
        </Upload>

        {/* 中间的 OR */}
        <div className="image-to-video-or-container">
          <span>或 者</span>
        </div>
        <div className="camera-button">
          <CameraCapture onCapture={handleCapture} />
        </div>

      </div>
      <div className="image-to-video-card-container">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`image-to-video-image-container ${selectedImage === index ? 'selected' : ''}`}
            onClick={() => handleSelectImage(index)}
          >
            <img alt={`img-${index}`} src={image.src} />
            {/* 删除按钮：隐藏并在 hover 时显示 */}
            <Button
              icon={<DeleteOutlined />}
              shape="circle"
              className="image-to-video-delete-button"
              onClick={(e) => {
                e.stopPropagation();  // 阻止点击删除  按钮时触发图片选择
                handleRemoveImage(image.id);
              }}
            />
          </div>
        ))}
      </div>
      {/* 图片查看器 */}
      <ImageViewer
        images={images.map(item => item.src)}  // 传入图片列表
        isVisible={isViewerVisible}  // 控制是否显示
        onClose={handleCloseViewer}  // 关闭时的回调
        selectedImage={selectedImage}  // 默认展示选中的图片
        setSelectedImage={setSelectedImage} // 用于更新选中图片索引的函数
      />
      {selectedImage !== null && (
        <div className="image-to-video-form-container">
          <h1>参数配置</h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item label="提示词"
                       name="prompt">
              <InputNumber placeholder="请输入提示词" style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="种子（seed=-1表示每次运行的种子都不一样）"
                           name="seed"
                           initialValue={-1}>
                  <InputNumber placeholder="请输入一个值" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="视频长度（需小于 144）"
                           name="videoDuration"
                           initialValue={12}>
                  <InputNumber placeholder="请输入一个值" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="生成视频 FPS"
                       name="fps"
                       initialValue={6}>
              <Slider />
            </Form.Item>
            <Form.Item style={{ textAlign: 'center' }}>
              <Button type="primary" size="large" htmlType="submit">
                生成视频
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
};

export default App;
