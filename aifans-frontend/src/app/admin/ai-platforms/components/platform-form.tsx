"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { AIPlatform } from "../page";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api/api";

interface PlatformFormProps {
  platform: AIPlatform | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PlatformForm({ platform, onSuccess, onCancel }: PlatformFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: platform?.name || "",
    type: platform?.type || "IMAGE",
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(platform?.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    
    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("图片大小不能超过2MB");
      return;
    }
    
    // 设置文件和预览
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const clearLogoFile = () => {
    setLogoFile(null);
    
    // 如果是编辑模式且原来有logo，则恢复原logo的预览
    if (platform?.logoUrl) {
      setLogoPreview(platform.logoUrl);
    } else {
      setLogoPreview(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 准备基础数据
      const baseData: {
        name: string;
        type: "IMAGE" | "VIDEO";
        logoUrl?: string | null;
      } = {
        name: formData.name,
        type: formData.type,
      };

      let response;
      if (platform) {
        // 更新现有平台
        console.log("更新平台ID:", platform.id);
        if (logoFile) {
          // 如果有新文件，先上传文件
          const uploadFormData = new FormData();
          uploadFormData.append("file", logoFile);
          uploadFormData.append("folder", "ai-platforms");
          
          console.log("上传新logo文件");
          const uploadResponse = await api.post("/storage/upload", uploadFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          
          baseData.logoUrl = uploadResponse.data.url;
        } else if (platform.logoUrl) {
          // 保留原有logo
          baseData.logoUrl = platform.logoUrl;
        }
        
        // 更新平台数据
        response = await api.patch(`/admin/ai-platforms/${platform.id}`, baseData);
      } else {
        // 创建新平台
        console.log("创建新平台");
        if (logoFile) {
          // 如果有文件，先上传文件
          const uploadFormData = new FormData();
          uploadFormData.append("file", logoFile);
          uploadFormData.append("folder", "ai-platforms");
          
          console.log("上传logo文件");
          const uploadResponse = await api.post("/storage/upload", uploadFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          
          baseData.logoUrl = uploadResponse.data.url;
        }
        
        // 创建平台
        response = await api.post("/admin/ai-platforms", baseData);
      }
      
      console.log("操作成功，返回数据:", response.data);
      onSuccess();
    } catch (err: any) {
      console.error("提交表单失败:", err);
      if (err.response) {
        console.error("错误状态:", err.response.status);
        console.error("错误数据:", err.response.data);
      }
      setError(err.response?.data?.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          平台名称<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          平台图标
        </label>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-4">
          <input
            type="file"
            id="logo"
            name="logo"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          {logoPreview ? (
            <div className="relative">
              <div className="flex justify-center mb-4">
                <div className="relative h-32 w-32">
                  <Image
                    src={logoPreview}
                    alt="预览"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  更换图标
                </button>
                <button
                  type="button"
                  onClick={clearLogoFile}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label
                  htmlFor="logo"
                  className="cursor-pointer px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
                >
                  选择图标
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF 最大 2MB</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          平台类型<span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="IMAGE">图像</option>
          <option value="VIDEO">视频</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              处理中...
            </span>
          ) : platform ? "更新" : "创建"}
        </button>
      </div>
    </form>
  );
} 