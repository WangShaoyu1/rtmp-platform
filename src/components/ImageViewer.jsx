import React, { useState } from 'react';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

const ImageViewer = ({
                       images, isVisible, onClose,
                       selectedImage,
                       setSelectedImage,
                       animationDuration = 300,
                       zoom = true,
                       keyboardNav = true,
                       customClass = 'custom-lightbox',
                       backgroundOpacity = 0.8,
                       loading = <div>加载中...</div>,
                       cursor = 'pointer',
                       preloadNextImage = true,
                     }) => {

  if (!isVisible) return null; // 如果未显示，则返回 null，不渲染组件

  return (
    <div className={`image-viewer-container ${customClass}`}>
      <Lightbox
        mainSrc={images[selectedImage]}
        nextSrc={images[(selectedImage + 1) % images.length]}
        prevSrc={images[(selectedImage + images.length - 1) % images.length]}
        onCloseRequest={onClose}  // 关闭时触发 onClose
        onMovePrevRequest={() =>
          setSelectedImage((selectedImage + images.length - 1) % images.length)
        }
        onMoveNextRequest={() =>
          setSelectedImage((selectedImage + 1) % images.length)
        }
        animationDuration={animationDuration}
        zoom={zoom}
        keyboardNav={keyboardNav}
        backgroundOpacity={backgroundOpacity}
        loading={loading}
        cursor={cursor}
        preloadNextImage={preloadNextImage}
      />
    </div>
  );
};

export default ImageViewer;
