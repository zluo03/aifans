// 从 auth-store 重新导出并提供兼容性别名
import { useAuthStore } from '@/lib/store/auth-store';
export { useAuthStore };

// 兼容性别名
export const useAuth = useAuthStore; 