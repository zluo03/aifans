"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlatformForm from "./components/platform-form";
import ModelManageDialog from "./components/model-manage-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/api";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export interface AIModel {
  id: number;
  name: string;
  aiPlatformId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIPlatform {
  id: number;
  name: string;
  logoUrl: string | null;
  type: "IMAGE" | "VIDEO";
  models?: AIModel[];
  _count?: {
    posts: number;
  };
}

export default function AIPlatformsPage() {
  const [platforms, setPlatforms] = useState<AIPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPlatform, setEditPlatform] = useState<AIPlatform | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<AIPlatform | null>(null);
  const [modelManagePlatform, setModelManagePlatform] = useState<AIPlatform | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      console.log('正在获取AI平台列表...');
      const response = await api.get("/admin/ai-platforms");
      console.log('AI平台列表获取成功:', response.data);
      setPlatforms(response.data);
      setError(null);
    } catch (err) {
      console.error('获取AI平台列表失败:', err);
      setError("获取AI平台列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatform = () => {
    setEditPlatform(null);
    setIsAddDialogOpen(true);
  };

  const handleEditPlatform = (platform: AIPlatform) => {
    setEditPlatform(platform);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (platform: AIPlatform) => {
    setPlatformToDelete(platform);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!platformToDelete) return;

    try {
      await api.delete(`/admin/ai-platforms/${platformToDelete.id}`);
      setPlatforms(platforms.filter(p => p.id !== platformToDelete.id));
      setIsDeleteConfirmOpen(false);
      setPlatformToDelete(null);
    } catch (err) {
      setError("删除平台失败");
      console.error(err);
    }
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    fetchPlatforms();
  };

  const handleManageModels = (platform: AIPlatform) => {
    setModelManagePlatform(platform);
  };

  const handleModelManageClose = () => {
    setModelManagePlatform(null);
    fetchPlatforms(); // 刷新数据以更新模型数量
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI平台管理</h1>
        <button
          onClick={handleAddPlatform}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          添加新平台
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>图标</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>模型数量</TableHead>
                <TableHead>作品数量</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    暂无平台数据
                  </TableCell>
                </TableRow>
              ) : (
                platforms.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium">{platform.id}</TableCell>
                    <TableCell>{platform.name}</TableCell>
                    <TableCell>
                      {platform.logoUrl ? (
                        <img
                          src={platform.logoUrl}
                          alt={platform.name}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <span className="text-gray-400">无图标</span>
                      )}
                    </TableCell>
                    <TableCell>{platform.type === "IMAGE" ? "图像" : "视频"}</TableCell>
                    <TableCell>{platform.models?.length || 0}</TableCell>
                    <TableCell>{platform._count?.posts || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageModels(platform)}
                        className="mr-2"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        管理模型
                      </Button>
                      <button
                        onClick={() => handleEditPlatform(platform)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteClick(platform)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlatform ? "编辑AI平台" : "添加AI平台"}</DialogTitle>
          </DialogHeader>
          <PlatformForm
            platform={editPlatform}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="mb-6">
              确定要删除平台 "{platformToDelete?.name}" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 模型管理对话框 */}
      {modelManagePlatform && (
        <ModelManageDialog
          platform={modelManagePlatform}
          open={!!modelManagePlatform}
          onClose={handleModelManageClose}
        />
      )}
    </div>
  );
} 