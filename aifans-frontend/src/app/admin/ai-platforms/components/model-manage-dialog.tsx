"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { AIPlatform, AIModel } from "../page";

interface ModelManageDialogProps {
  platform: AIPlatform;
  open: boolean;
  onClose: () => void;
}

export default function ModelManageDialog({
  platform,
  open,
  onClose,
}: ModelManageDialogProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchModels();
    }
  }, [open, platform.id]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/ai-platforms/${platform.id}/models`);
      setModels(response.data);
    } catch (error) {
      console.error("获取模型列表失败:", error);
      toast.error("获取模型列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async () => {
    if (!newModelName.trim()) {
      toast.error("请输入模型名称");
      return;
    }

    try {
      const response = await api.post("/admin/ai-platforms/models", {
        name: newModelName.trim(),
        aiPlatformId: platform.id,
      });
      setModels([...models, response.data]);
      setNewModelName("");
      setIsAdding(false);
      toast.success("模型添加成功");
    } catch (error: any) {
      console.error("添加模型失败:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("添加模型失败");
      }
    }
  };

  const handleUpdateModel = async (id: number) => {
    if (!editingName.trim()) {
      toast.error("请输入模型名称");
      return;
    }

    try {
      const response = await api.patch(`/admin/ai-platforms/models/${id}`, {
        name: editingName.trim(),
      });
      setModels(models.map(m => m.id === id ? response.data : m));
      setEditingId(null);
      setEditingName("");
      toast.success("模型更新成功");
    } catch (error: any) {
      console.error("更新模型失败:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("更新模型失败");
      }
    }
  };

  const handleDeleteModel = async (id: number) => {
    if (!confirm("确定要删除这个模型吗？")) {
      return;
    }

    try {
      await api.delete(`/admin/ai-platforms/models/${id}`);
      setModels(models.filter(m => m.id !== id));
      toast.success("模型删除成功");
    } catch (error) {
      console.error("删除模型失败:", error);
      toast.error("删除模型失败");
    }
  };

  const startEdit = (model: AIModel) => {
    setEditingId(model.id);
    setEditingName(model.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>管理 {platform.name} 的模型</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 添加新模型 */}
          <div className="flex items-end gap-2">
            {isAdding ? (
              <>
                <div className="flex-1">
                  <Label htmlFor="new-model">新模型名称</Label>
                  <Input
                    id="new-model"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="输入模型名称"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddModel();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddModel} size="sm">
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setNewModelName("");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsAdding(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                添加模型
              </Button>
            )}
          </div>

          {/* 模型列表 */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>模型名称</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        暂无模型
                      </TableCell>
                    </TableRow>
                  ) : (
                    models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          {editingId === model.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdateModel(model.id);
                                }
                              }}
                              className="max-w-xs"
                            />
                          ) : (
                            model.name
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(model.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === model.id ? (
                            <>
                              <Button
                                onClick={() => handleUpdateModel(model.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                variant="ghost"
                                size="sm"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => startEdit(model)}
                                variant="ghost"
                                size="sm"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteModel(model.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 