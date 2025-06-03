"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postsApi } from "@/lib/api/posts";
import { Combobox } from "@/components/ui/combobox";
import { api } from "@/lib/api/api";
import axios from "axios";

interface Post {
  id: number;
  type: "IMAGE" | "VIDEO";
  title?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  aiPlatform: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  likesCount: number;
  favoritesCount: number;
  viewsCount: number;
  prompt: string;
  modelUsed: string;
  videoCategory?: string;
  allowDownload: boolean;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
  };
  hasLiked?: boolean;
  hasFavorited?: boolean;
}

interface Platform {
  id: number;
  name: string;
  logoUrl?: string;
  type: "IMAGE" | "VIDEO";
  status: "ACTIVE" | "INACTIVE";
}

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  platforms: Platform[];
  onSuccess: () => void;
}

// 视频类别选项
const VIDEO_CATEGORIES = [
  { value: 'IMAGE_TO_VIDEO', label: '图片到视频' },
  { value: 'TEXT_TO_VIDEO', label: '文本到视频' },
  { value: 'FRAME_INTERPOLATION', label: '首尾帧' },
  { value: 'MULTI_IMAGE_REF', label: '多图像参考' }
];

export default function EditPostModal({
  isOpen,
  onClose,
  post,
  platforms,
  onSuccess
}: EditPostModalProps) {
  const [formData, setFormData] = useState({
    title: post.title || '',
    prompt: post.prompt || '',
    modelUsed: post.modelUsed || '',
    aiPlatformId: post.aiPlatform.id,
    videoCategory: post.videoCategory || '',
    allowDownload: post.allowDownload
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platformModels, setPlatformModels] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState('');

  // 重置表单数据当post改变时
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        prompt: post.prompt || '',
        modelUsed: post.modelUsed || '',
        aiPlatformId: post.aiPlatform.id,
        videoCategory: post.videoCategory || '',
        allowDownload: post.allowDownload
      });
    }
  }, [post]);

  // 当选择平台时，获取该平台的模型列表
  useEffect(() => {
    if (formData.aiPlatformId) {
      fetchPlatformModels(formData.aiPlatformId);
    } else {
      setPlatformModels([]);
    }
  }, [formData.aiPlatformId]);

  // 获取模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/ai-platforms');
        if (response.data && Array.isArray(response.data)) {
          const platformList = response.data;
          const uniqueModels = new Set<string>();
          
          platformList.forEach((platform: any) => {
            if (platform.models && Array.isArray(platform.models)) {
              platform.models.forEach((model: string) => {
                if (model) uniqueModels.add(model);
              });
            }
          });
          
          setModels(Array.from(uniqueModels).sort());
        }
      } catch (error) {
        // 静默失败，使用默认模型列表
        setModels(['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Claude 3', 'GPT-4']);
      }
    };
    
    fetchModels();
  }, []);

  const fetchPlatformModels = async (platformId: number) => {
    try {
      setLoadingModels(true);
      const response = await api.get(`/ai-platforms/${platformId}/models`);
      setPlatformModels(response.data || []);
    } catch (error) {
      setPlatformModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 过滤平台选项，只显示与作品类型匹配的平台
  const filteredPlatforms = platforms.filter(platform => 
    platform.type === post.type && platform.status === 'ACTIVE'
  );

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // 构建更新数据
      const updateData = {
        title: formData.title.trim() || undefined,
        prompt: formData.prompt.trim() || undefined,
        modelUsed: formData.modelUsed.trim() || undefined,
        aiPlatformId: formData.aiPlatformId,
        videoCategory: post.type === 'VIDEO' ? formData.videoCategory : undefined,
        allowDownload: formData.allowDownload
      };
      
      // 发送更新请求
      await postsApi.updatePost(post.id, updateData);
      
      // 更新成功
      toast.success('作品信息已更新');
      onSuccess();
      onClose();
    } catch (error) {
      // 设置错误信息
      setError('更新作品失败，请稍后再试');
      toast.error('更新作品失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 模态框内容 */}
          <motion.div
            className="relative rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: '#e6e7e7' }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-400">
              <h2 className="text-xl font-bold text-black">
                编辑作品信息
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-300 rounded-lg transition-colors text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-black font-medium">作品标题（可选）</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="为你的作品起个标题..."
                    maxLength={100}
                    className="bg-white border-gray-400 text-black placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* AI平台 */}
                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-black font-medium">AI平台 *</Label>
                  <Select
                    value={formData.aiPlatformId.toString()}
                    onValueChange={(value) => handleInputChange('aiPlatformId', parseInt(value))}
                  >
                    <SelectTrigger className="bg-white border-gray-400 text-black focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="选择AI平台" className="text-black" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-400">
                      {filteredPlatforms.map((platform) => (
                        <SelectItem 
                          key={platform.id} 
                          value={platform.id.toString()}
                          className="text-black hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 使用的模型 */}
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-black font-medium">使用的模型 *</Label>
                  {loadingModels ? (
                    <div className="flex items-center justify-center h-10 border rounded-md bg-white">
                      <span className="text-sm text-gray-500">加载模型列表...</span>
                    </div>
                  ) : platformModels.length > 0 ? (
                    <Combobox
                      value={formData.modelUsed}
                      onValueChange={(value) => handleInputChange('modelUsed', value)}
                      options={platformModels.map(model => ({
                        value: model.name,
                        label: model.name
                      }))}
                      placeholder="选择或输入模型名称"
                      allowCustomValue={true}
                      className="bg-white border-gray-400 text-black focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <Input
                      id="model"
                      value={formData.modelUsed}
                      onChange={(e) => handleInputChange('modelUsed', e.target.value)}
                      placeholder="例如：DALL-E 3, Midjourney v6, Stable Diffusion XL..."
                      maxLength={100}
                      required
                      className="bg-white border-gray-400 text-black placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* 视频类型（仅视频作品显示） */}
                {post.type === 'VIDEO' && (
                  <div className="space-y-2">
                    <Label htmlFor="videoCategory" className="text-black font-medium">视频类型 *</Label>
                    <Select
                      value={formData.videoCategory}
                      onValueChange={(value) => handleInputChange('videoCategory', value)}
                    >
                      <SelectTrigger className="bg-white border-gray-400 text-black focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="选择视频类型" className="text-black" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-400">
                        {VIDEO_CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category.value} 
                            value={category.value}
                            className="text-black hover:bg-gray-100 focus:bg-gray-100"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 提示词 */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-black font-medium">提示词 *</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => handleInputChange('prompt', e.target.value)}
                    placeholder="输入生成这个作品时使用的提示词..."
                    rows={4}
                    maxLength={2000}
                    required
                    className="bg-white border-gray-400 text-black placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    {formData.prompt.length}/2000 字符
                  </div>
                </div>

                {/* 允许下载 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowDownload"
                    checked={formData.allowDownload}
                    onChange={(e) => handleInputChange('allowDownload', e.target.checked)}
                    className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 bg-white"
                  />
                  <Label htmlFor="allowDownload" className="text-sm text-black">
                    允许其他用户下载此作品
                  </Label>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="bg-white border-gray-400 text-black hover:bg-gray-100 hover:border-gray-500"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        保存更改
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 