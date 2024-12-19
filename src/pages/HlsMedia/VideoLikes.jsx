import React, { useState, useEffect } from 'react';
import { Button, Upload, message } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useGlobal } from '@/models/global';
import './index.less';
import axios from 'axios';

const App = () => {
  const { videoLikes, addVideoLike, removeVideoLike, updateVideoLike } = useGlobal();

  const defaultVideos = [
    { src: '/static/videos/man.mp4', name: 'man.mp4', avatarName: 'man', uploaded: false },
    { src: '/static/videos/man_15.mp4', name: 'man_15.mp4', avatarName: 'man_15', uploaded: false },
    { src: '/static/videos/girl.mp4', name: 'girl.mp4', avatarName: 'girl', uploaded: false },
    { src: '/static/videos/girl_15.mp4', name: 'girl_15.mp4', avatarName: 'girl_15', uploaded: false },
    { src: '/static/videos/cartoon.mp4', name: 'cartoon.mp4', avatarName: 'cartoon', uploaded: false },
    { src: '/static/videos/cartoon_15.mp4', name: 'cartoon_15.mp4', avatarName: 'cartoon_15', uploaded: false },
    { src: '/static/videos/franceGirl.mp4', name: 'franceGirl.mp4', avatarName: 'franceGirl', uploaded: false },
    {
      src: '/static/videos/franceGirl_15.mp4',
      name: 'franceGirl_15.mp4',
      avatarName: 'franceGirl_15',
      uploaded: false,
    },
  ];

  // 加载本地存储的视频
  useEffect(() => {
    if (videoLikes.length === 0) {
      const addDefaultVideos = async () => {
        for (const video of defaultVideos) {
          await addVideoLike({ id: Date.now(), ...video });
        }
      };
      addDefaultVideos().then(() => {
        message.success('视频初始化成功');
      });
    }
  }, [videoLikes, addVideoLike]);


  // 通过文件路径获取文件对象
  function getFile(filePath, videoName) {
    return fetch(filePath)
      .then(response => response.blob())  // 将文件转换为 Blob
      .then(blob => new File([blob], videoName, { type: 'video/mp4' }));  // 创建文件对象
  }

  // 上传视频的处理
  const handleUpload = (file) => {
    // 只允许上传视频文件
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      message.error('只能上传视频文件!');
      return false;
    }
    // 检查文件是否已经存在
    const isDuplicate = videoLikes.some((video) => video.name === file.name);
    if (isDuplicate) {
      message.warning('该视频已经上传过了');
      return false; // 阻止重复上传
    }
    console.log('OK');
    // 将视频转换为 URL 并存储到 state 和 localStorage
    const reader = new FileReader();
    reader.onload = (e) => {
      addVideoLike({ id: Date.now(), src: e.target.result, name: file.name, uploaded: false });
      message.success('视频上传成功');
    };
    reader.readAsDataURL(file);  // 将视频文件转换为 dataURL
    return false; // Prevent default upload behavior
  };

  // 删除视频
  const handleRemoveVideo = (id) => {
    removeVideoLike(id);
    message.success('视频删除成功');
  };

  //上传视频
  const handleSubmitVideo = (video) => {
    getFile(video.src, video.name).then((file) => {
      const formData = new FormData();
      formData.append('avatar_name', video.avatarName);  // 假设的 avatar_name
      formData.append('video', file);  // 将文件附加到请求中

      axios({
        method: 'post',
        url: 'http://127.0.0.1:5000/upload_video',
        data: formData,
      }).then(({ data }) => {
        if (data?.video_path) {
          updateVideoLike({ ...video, uploaded: true });
        }
        message.success(data?.message);
      }).catch(({ response }) => {
        const { data } = response;
        message.error(data.message);
      });
    });
  };

  return (
    <div className="video-like-container">
      <div className="upload-section">
        {/* 上传视频 */}
        <Upload
          accept="video/*"
          customRequest={() => {
          }} // Disable default upload behavior
          beforeUpload={handleUpload}
          listType="picture-card"
          showUploadList={false}
          multiple={false}
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传视频</div>
          </div>
        </Upload>
      </div>

      {/* 视频列表展示 */}
      <div className="video-list">
        {videoLikes.map((video, index) => (
          <div key={video.id} className="video-item">
            <h4>{video.name} {video.uploaded ? '已建模' : ''}</h4>
            <video width="200" controls loop>
              <source src={video.src} />
              您的浏览器不支持视频标签.
            </video>
            {/* 删除按钮：隐藏并在 hover 时显示 */}
            <Button
              icon={<DeleteOutlined />}
              shape="circle"
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();  // 阻止点击删除  按钮时触发视频选择
                handleRemoveVideo(video.id);
              }}
            />
            <Button
              icon={<UploadOutlined />}
              shape="circle"
              className="upload-button"
              onClick={(e) => {
                e.stopPropagation();  // 阻止点击删除  按钮时触发视频选择
                handleSubmitVideo(video);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
