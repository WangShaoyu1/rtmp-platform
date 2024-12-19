import { DEFAULT_NAME } from '@/constants';
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { storeData, fetchData, deleteData, updateData } from '@/utils/indexDB';

// ========================= 通用数据操作封装 =========================
const useDataStore = (storeName: string) => {
  const [data, setData] = useState<any[]>([]);

  // 加载数据
  const loadData = async () => {
    try {
      const result = await fetchData(storeName);
      setData([...result]); // 确保状态不可变
    } catch (error) {
      console.error(`Failed to load data from ${storeName}:`, error);
    }
  };

  // 添加数据
  const addData = async (item: any) => {
    try {
      await storeData(storeName, item);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error(`Failed to add data to ${storeName}:`, error);
    }
  };

  // 删除数据
  const removeData = async (id: string | number) => {
    try {
      await deleteData(storeName, id);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error(`Failed to remove data from ${storeName}:`, error);
    }
  };

  // 接受完整的更新后对象（必须包含id）
  const updateRecord = async (updatedItem: any) => {
    try {
      await updateData(storeName, updatedItem);
      await loadData(); // 更新后重新加载数据
    } catch (error) {
      console.error(`Failed to update data in ${storeName}:`, error);
    }
  };

  // 更新数据
  useEffect(() => {
    loadData();
  }, []);

  return { data, addData, removeData, updateData: updateRecord };
};

// ========================= 创建上下文 =========================
interface GlobalContextType {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  audioLikes: any[];
  addAudioLike: (audio: any) => void;
  removeAudioLike: (id: string) => void;
  videoLikes: any[];
  addVideoLike: (video: any) => void;
  removeVideoLike: (id: string) => void;
  updateVideoLike: (updateItem: object) => void;
  images: any[];
  addImage: (image: any) => void;
  removeImage: (id: number) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ========================= Provider 组件 =========================
export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState<string>(DEFAULT_NAME);

  // 使用自定义 Hook 管理数据存储
  const { data: audioLikes, addData: addAudioLike, removeData: removeAudioLike } = useDataStore('audioLikes');
  const {
    data: videoLikes,
    addData: addVideoLike,
    removeData: removeVideoLike,
    updateData: updateVideoLike,
  } = useDataStore('videoLikes');
  const { data: images, addData: addImage, removeData: removeImage } = useDataStore('images');

  return (
    <GlobalContext.Provider
      value={{
        name,
        setName,
        audioLikes,
        addAudioLike,
        removeAudioLike,
        videoLikes,
        addVideoLike,
        removeVideoLike,
        updateVideoLike,
        images,
        addImage,
        removeImage,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// ========================= 自定义 Hook =========================
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
