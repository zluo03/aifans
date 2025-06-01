import { create } from 'zustand';
import { spiritPostsApi } from '@/lib/api/spirit-posts';

interface UnreadMessageCount {
  total: number;
  myPosts: number;
  myClaims: number;
}

interface SpiritPostsStore {
  unreadCount: UnreadMessageCount;
  isLoading: boolean;
  lastUpdated: number | null;
  
  // Actions
  fetchUnreadCount: () => Promise<void>;
  updateUnreadCount: (count: UnreadMessageCount) => void;
  decrementUnreadCount: (postId: number, amount: number) => void;
  resetUnreadCount: () => void;
}

export const useSpiritPostsStore = create<SpiritPostsStore>((set, get) => ({
  unreadCount: {
    total: 0,
    myPosts: 0,
    myClaims: 0,
  },
  isLoading: false,
  lastUpdated: null,

  fetchUnreadCount: async () => {
    try {
      set({ isLoading: true });
      const count = await spiritPostsApi.getUnreadMessageCount();
      set({ 
        unreadCount: count, 
        isLoading: false,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('获取未读消息数失败:', error);
      set({ isLoading: false });
    }
  },

  updateUnreadCount: (count: UnreadMessageCount) => {
    set({ 
      unreadCount: count,
      lastUpdated: Date.now()
    });
  },

  decrementUnreadCount: (postId: number, amount: number) => {
    const { unreadCount } = get();
    set({
      unreadCount: {
        ...unreadCount,
        total: Math.max(0, unreadCount.total - amount),
      },
      lastUpdated: Date.now()
    });
  },

  resetUnreadCount: () => {
    set({
      unreadCount: {
        total: 0,
        myPosts: 0,
        myClaims: 0,
      },
      lastUpdated: null
    });
  },
})); 