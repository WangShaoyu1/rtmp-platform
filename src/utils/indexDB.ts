// 示例方法，没有实际意义
import { openDB } from 'idb';

// 初始化 IndexedDB
const initDB = async () => {
  return await openDB('GlobalStore', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('audioLikes')) {
        db.createObjectStore('audioLikes', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('videoLikes')) {
        db.createObjectStore('videoLikes', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// 存储数据到 IndexedDB
const storeData = async (storeName: string, data: any) => {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  await store.put(data);
  await transaction.done;
};

// 获取数据从 IndexedDB
const fetchData = async (storeName: string) => {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const allData = await store.getAll();
  return allData;
};

const deleteData = async (storeName: string, id: string | number) => {
  const db = await initDB();
  await db.delete(storeName, id);
};

const updateData = async (storeName: string, updatedItem: any) => {
  const db = await initDB();
  await db.put(storeName, updatedItem); // put用于更新已存在的记录
};
export { initDB, storeData, fetchData, deleteData, updateData };