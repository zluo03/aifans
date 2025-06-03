'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from './input';
import { Button } from './button';
import { SlideUp } from './animations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { Switch } from './switch';
import { Search, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface Platform {
  id: number;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'BOTH';
  status: string;
  supportedTypes?: ('IMAGE' | 'VIDEO')[];
}

interface SearchFilterProps {
  onSearch: (filters: Record<string, any>) => void;
  filters?: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'boolean';
    options?: { value: string; label: string }[];
    defaultValue?: string | boolean;
  }[];
  sortOptions?: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  platforms?: Platform[];
}

export function SearchFilter({
  onSearch,
  filters = [],
  sortOptions = [
    { value: 'newest', label: '最新发布' },
    { value: 'oldest', label: '最早发布' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'views', label: '最多浏览' },
  ],
  className = '',
  placeholder = '搜索...',
  platforms = [],
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();

  // 状态
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all-types');
  const [selectedPlatform, setSelectedPlatform] = useState('no-platform-filter');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [isInitialized, setIsInitialized] = useState(false);

  // 类型选项（固定）
  const typeOptions = [
    { value: 'all-types', label: '全部类型' },
    { value: 'IMAGE', label: '图片' },
    { value: 'VIDEO', label: '视频' },
  ];

  // 平台选项（根据类型过滤）
  const getPlatformOptions = (forType?: string) => {
    const currentType = forType || selectedType;
    const baseOptions = [{ value: 'no-platform-filter', label: '全部平台' }];
    
    if (!platforms || platforms.length === 0) {
      return baseOptions;
    }

    // 过滤激活的平台
    let activePlatforms = platforms.filter(p => p.status === 'ACTIVE');

    // 根据类型过滤
    if (currentType === 'IMAGE') {
      activePlatforms = activePlatforms.filter(p => {
        // 如果是双属性平台，检查是否支持IMAGE
        if (p.type === 'BOTH' && p.supportedTypes) {
          return p.supportedTypes.includes('IMAGE');
        }
        return p.type === 'IMAGE' || p.type === 'BOTH';
      });
    } else if (currentType === 'VIDEO') {
      activePlatforms = activePlatforms.filter(p => {
        // 如果是双属性平台，检查是否支持VIDEO
        if (p.type === 'BOTH' && p.supportedTypes) {
          return p.supportedTypes.includes('VIDEO');
        }
        return p.type === 'VIDEO' || p.type === 'BOTH';
      });
    }

    // 生成选项
    const platformOptions = activePlatforms.map(p => ({
      value: p.id.toString(),
      label: p.name
    }));

    const result = [...baseOptions, ...platformOptions];
    return result;
  };

  const platformOptions = getPlatformOptions();

  // 执行搜索（接受参数覆盖当前状态）
  const executeSearch = useCallback(debounce((overrides: Partial<{
    searchText: string;
    selectedType: string;
    selectedPlatform: string;
    showFavorites: boolean;
    showMyPosts: boolean;
    sortOrder: string;
  }> = {}) => {
    if (!isInitialized) {
      return;
    }
    
    // 使用当前状态值，但允许参数覆盖
    const finalSearchText = overrides.searchText !== undefined ? overrides.searchText : searchText;
    const finalSelectedType = overrides.selectedType !== undefined ? overrides.selectedType : selectedType;
    const finalSelectedPlatform = overrides.selectedPlatform !== undefined ? overrides.selectedPlatform : selectedPlatform;
    const finalShowFavorites = overrides.showFavorites !== undefined ? overrides.showFavorites : showFavorites;
    const finalShowMyPosts = overrides.showMyPosts !== undefined ? overrides.showMyPosts : showMyPosts;
    const finalSortOrder = overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder;
    
    const searchParams: Record<string, any> = {
      order: finalSortOrder
    };

    if (finalSearchText.trim()) {
      searchParams.search = finalSearchText.trim();
    }

    if (finalSelectedType !== 'all-types') {
      searchParams.type = finalSelectedType;
    }

    if (finalSelectedPlatform !== 'no-platform-filter') {
      searchParams.aiPlatformId = finalSelectedPlatform;
    }

    if (finalShowFavorites) {
      searchParams.onlyFavorites = true;
    }

    if (finalShowMyPosts) {
      searchParams.onlyMyPosts = true;
    }
    
    // 调用回调
    onSearch(searchParams);

    // 更新URL
    const urlParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.set(key, String(value));
      }
    });

    const newUrl = urlParams.toString() 
      ? `${window.location.pathname}?${urlParams.toString()}` 
      : window.location.pathname;
    
    router.replace(newUrl);
  }, 300), [isInitialized, searchText, selectedType, selectedPlatform, showFavorites, showMyPosts, sortOrder, onSearch, router]);

  // 初始化（从URL读取参数）
  useEffect(() => {
    const params = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    
    const urlSearch = params.get('search') || '';
    const urlType = params.get('type') || 'all-types';
    const urlPlatform = params.get('aiPlatformId') || 'no-platform-filter';
    const urlFavorites = params.get('onlyFavorites') === 'true';
    const urlMyPosts = params.get('onlyMyPosts') === 'true';
    const urlSort = params.get('order') || params.get('orderBy') || 'newest';

    // 总是使用默认值进行首次初始化，忽略URL参数
    setSearchText('');
    setSelectedType('all-types');
    setSelectedPlatform('no-platform-filter');
    setShowFavorites(false);
    setShowMyPosts(false);
    setSortOrder('newest');
    
    setIsInitialized(true);
  }, []);

  // 事件处理
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    
    // 检查当前平台是否支持新类型
    let newPlatform = selectedPlatform;
    if (selectedPlatform !== 'no-platform-filter') {
      const platformId = parseInt(selectedPlatform, 10);
      const currentPlatform = platforms.find(p => p.id === platformId);
      
      if (currentPlatform && value !== 'all-types') {
        // 检查平台是否支持新的类型
        let isCompatible = false;
        
        if (currentPlatform.type === 'BOTH') {
          // 双属性平台，检查supportedTypes
          if (currentPlatform.supportedTypes) {
            isCompatible = currentPlatform.supportedTypes.includes(value as 'IMAGE' | 'VIDEO');
          } else {
            // 如果没有supportedTypes，BOTH类型默认支持所有类型
            isCompatible = true;
          }
        } else {
          // 单类型平台，直接比较
          isCompatible = currentPlatform.type === value;
        }
        
        if (!isCompatible) {
          newPlatform = 'no-platform-filter';
          setSelectedPlatform('no-platform-filter');
        }
      }
    }
    
    // 立即执行搜索，使用新的参数值
    executeSearch({
      selectedType: value,
      selectedPlatform: newPlatform
    });
  };

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    executeSearch({ selectedPlatform: value });
  };

  const handleFavoritesChange = (checked: boolean) => {
    if (!isAuthenticated) {
      toast.error('请先登录后再使用收藏筛选功能');
      return;
    }
    setShowFavorites(checked);
    executeSearch({ showFavorites: checked });
  };

  const handleMyPostsChange = (checked: boolean) => {
    if (!isAuthenticated) {
      toast.error('请先登录后再使用我的作品筛选功能');
      return;
    }
    setShowMyPosts(checked);
    executeSearch({ showMyPosts: checked });
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    executeSearch({ sortOrder: value });
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedType('all-types');
    setSelectedPlatform('no-platform-filter');
    setShowFavorites(false);
    setShowMyPosts(false);
    setSortOrder('newest');
    
    // 立即执行搜索
    executeSearch({
      searchText: '',
      selectedType: 'all-types',
      selectedPlatform: 'no-platform-filter',
      showFavorites: false,
      showMyPosts: false,
      sortOrder: 'newest'
    });
  };

  // 获取当前选中类型的显示文本
  const getSelectedTypeLabel = () => {
    const option = typeOptions.find(opt => opt.value === selectedType);
    return option ? option.label : '全部类型';
  };

  // 获取当前选中平台的显示文本
  const getSelectedPlatformLabel = () => {
    const option = platformOptions.find(opt => opt.value === selectedPlatform);
    return option ? option.label : '全部平台';
  };

  if (!isInitialized) {
    return (
      <SlideUp className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-[160px] h-10 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-[160px] h-10 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-[140px] h-10 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </SlideUp>
    );
  }

  return (
    <SlideUp className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        {/* 搜索框 */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full">
            <Input
              placeholder={placeholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeSearch({ searchText: (e.target as HTMLInputElement).value });
                }
              }}
              className="pr-10 h-10"
            />
            {searchText && (
              <button
                onClick={() => {
                  setSearchText('');
                  executeSearch({ searchText: '' });
                }}
                className="absolute right-10 top-0 h-full flex items-center px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => executeSearch()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 作品类型 */}
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue>
              {getSelectedTypeLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AI平台 */}
        <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue>
              {getSelectedPlatformLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 收藏筛选 */}
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <Switch
            checked={showFavorites}
            onCheckedChange={handleFavoritesChange}
            disabled={!isAuthenticated}
          />
          <Label className={`text-sm ${!isAuthenticated ? 'text-gray-400' : ''}`}>
            仅显示我的收藏
            {!isAuthenticated && <span className="text-xs text-gray-400 ml-1">(需登录)</span>}
          </Label>
        </div>

        {/* 我的作品筛选 */}
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <Switch
            checked={showMyPosts}
            onCheckedChange={handleMyPostsChange}
            disabled={!isAuthenticated}
          />
          <Label className={`text-sm ${!isAuthenticated ? 'text-gray-400' : ''}`}>
            仅显示我的灵感
            {!isAuthenticated && <span className="text-xs text-gray-400 ml-1">(需登录)</span>}
          </Label>
        </div>

        {/* 排序 */}
        <Select value={sortOrder} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 重置按钮 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          重置
        </Button>
      </div>
    </SlideUp>
  );
} 