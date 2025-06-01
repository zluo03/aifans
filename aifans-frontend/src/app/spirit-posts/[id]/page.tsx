'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { spiritPostsApi, SpiritPost, MessagesResponse } from '@/lib/api/spirit-posts';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  MessageSquare, 
  CheckCircle2,
  Edit,
  EyeOff,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EditSpiritPostDialog } from '../components/edit-spirit-post-dialog';
import { MarkCompletedDialog } from '../components/mark-completed-dialog';
import { useSpiritPostsStore } from '@/lib/store/spirit-posts-store';

export default function SpiritPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const postId = Number(params.id);

  const [post, setPost] = useState<SpiritPost | null>(null);
  const [messages, setMessages] = useState<MessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarkCompletedDialog, setShowMarkCompletedDialog] = useState(false);
  const { fetchUnreadCount } = useSpiritPostsStore();

  // 检查用户权限
  useEffect(() => {
    if (!user) {
      toast.error('请先登录');
      router.push('/login');  // 登录页面路径
      return;
    }

    if (user.role === 'NORMAL') {
      toast.error('普通用户无法查看灵贴详情');
      router.push('/spirit-posts');
      return;
    }
  }, [user, router]);

  // 获取灵贴详情
  useEffect(() => {
    // 只有在用户验证通过后才获取详情
    if (postId && user && user.role !== 'NORMAL') {
      fetchPostDetail();
    }
  }, [postId, user]);

  // 获取消息列表
  useEffect(() => {
    if (post && (post.isClaimed || post.isOwner)) {
      fetchMessages();
      // 标记消息为已读
      markAsRead();
    }
  }, [post]);

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const data = await spiritPostsApi.getOne(postId);
      setPost(data);
    } catch (error) {
      console.error('获取灵贴详情失败:', error);
      toast.error('获取灵贴详情失败');
      router.push('/spirit-posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await spiritPostsApi.getMessages(postId);
      setMessages(data);
      
      // 如果是发布者且有对话，默认选择第一个对话
      if (data.isOwner && data.conversations && data.conversations.length > 0) {
        setSelectedConversationUserId(data.conversations[0].user.id);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await spiritPostsApi.markMessagesAsRead(postId);
      // 更新全局未读消息数
      fetchUnreadCount();
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await spiritPostsApi.claim(postId);
      toast.success('认领成功');
      fetchPostDetail();
    } catch (error: any) {
      console.error('认领失败:', error);
      toast.error(error.response?.data?.message || '认领失败');
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('请输入消息内容');
      return;
    }

    try {
      setSendingMessage(true);
      
      if (post?.isOwner && selectedConversationUserId) {
        // 发布者回复
        await spiritPostsApi.replyMessage(postId, selectedConversationUserId, {
          content: messageContent,
        });
      } else {
        // 认领者发送
        await spiritPostsApi.sendMessage(postId, {
          content: messageContent,
        });
      }
      
      setMessageContent('');
      fetchMessages();
      // 更新全局未读消息数
      fetchUnreadCount();
      toast.success('消息发送成功');
    } catch (error: any) {
      console.error('发送消息失败:', error);
      toast.error(error.response?.data?.message || '发送消息失败');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateSuccess = () => {
    setShowEditDialog(false);
    fetchPostDetail();
    toast.success('更新成功');
  };

  const handleMarkCompletedSuccess = () => {
    setShowMarkCompletedDialog(false);
    toast.success('标记成功');
  };

  if (loading || !post) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* 隐藏页面滚动条但保持滚动功能 */
        .spirit-post-detail-container {
          height: calc(100vh - 172px); /* 设置固定高度：视窗高度减去导航栏和页脚 */
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        /* Chrome, Safari and Opera */
        .spirit-post-detail-container::-webkit-scrollbar {
          display: none;
        }
        
        /* 消息区域滚动条样式 */
        .message-container {
          scrollbar-width: thin; /* Firefox - 显示细滚动条 */
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* Firefox */
        }
        
        /* Chrome, Safari - 细滚动条 */
        .message-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .message-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .message-container::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .message-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        /* 确保内容区域有足够的底部间距 */
        .content-wrapper {
          min-height: 100%;
          padding-bottom: 50px; /* 减少底部padding，因为容器高度已经正确 */
        }
      `}</style>
      
      <div className="spirit-post-detail-container">
        <div className="container mx-auto py-8 px-4 max-w-4xl content-wrapper">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/spirit-posts')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回灵贴列表
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-4">{post.title}</CardTitle>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {(post.user.nickname || post.user.username)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{post.user.nickname || post.user.username}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(post.createdAt), 'yyyy年MM月dd日 HH:mm', {
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {post.isOwner && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 切换隐藏状态
                          spiritPostsApi.update(postId, { isHidden: !post.isHidden })
                            .then(() => {
                              toast.success(post.isHidden ? '已显示' : '已隐藏');
                              fetchPostDetail();
                            })
                            .catch(() => toast.error('操作失败'));
                        }}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        {post.isHidden ? '显示' : '隐藏'}
                      </Button>
                      
                      {messages?.conversations && messages.conversations.some(c => c.hasConversation) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMarkCompletedDialog(true)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          标记已认领
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="whitespace-pre-wrap mb-6">{post.content}</div>
                
                {!post.isOwner && !post.isClaimed && (
                  <Button onClick={handleClaim} className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    认领此灵贴
                  </Button>
                )}
                
                {post.isClaimed && (
                  <Badge variant="secondary" className="text-sm">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    已认领
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 消息区域 */}
          {(post.isClaimed || post.isOwner) && messages && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  对话消息
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {messages.isOwner && messages.conversations ? (
                  // 发布者视图：多个对话标签
                  <Tabs
                    value={selectedConversationUserId?.toString()}
                    onValueChange={(value) => setSelectedConversationUserId(Number(value))}
                  >
                    <TabsList className="mb-4 flex-wrap h-auto">
                      {messages.conversations.map((conv) => (
                        <TabsTrigger key={conv.user.id} value={conv.user.id.toString()}>
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={conv.user.avatarUrl || undefined} />
                            <AvatarFallback>
                              {(conv.user.nickname || conv.user.username)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conv.user.nickname || conv.user.username}
                          {conv.hasConversation && (
                            <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                              可认领
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {messages.conversations.map((conv) => (
                      <TabsContent key={conv.user.id} value={conv.user.id.toString()}>
                        <div className="min-h-[200px] max-h-[600px] overflow-y-auto mb-4 p-4 border rounded-lg bg-muted/10 message-container">
                          {conv.messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                              暂无消息
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {conv.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${
                                    msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                      msg.senderId === user?.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    <p className="text-sm">{msg.content}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {format(new Date(msg.createdAt), 'HH:mm')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  // 认领者视图：单个对话
                  <div className="min-h-[200px] max-h-[600px] overflow-y-auto mb-4 p-4 border rounded-lg bg-muted/10 message-container">
                    {messages.messages && messages.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        暂无消息，发送第一条消息开始对话
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.senderId === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(msg.createdAt), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 发送消息区域 */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="输入消息..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    className="resize-none"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageContent.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 编辑对话框 */}
          {showEditDialog && (
            <EditSpiritPostDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              post={post}
              onSuccess={handleUpdateSuccess}
            />
          )}

          {/* 标记已认领对话框 */}
          {showMarkCompletedDialog && messages?.conversations && (
            <MarkCompletedDialog
              open={showMarkCompletedDialog}
              onOpenChange={setShowMarkCompletedDialog}
              postId={postId}
              conversations={messages.conversations.filter(c => c.hasConversation)}
              onSuccess={handleMarkCompletedSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
} 