import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { Smile, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';
import { api } from '@/lib/api/api';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import './creator-contact-dialog.css';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

interface Contact {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

interface CreatorContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount?: number;
  creatorId?: number; // 用于初始打开特定用户的聊天
}

export function CreatorContactDialog({ 
  open, 
  onOpenChange, 
  unreadCount = 0,
  creatorId 
}: CreatorContactDialogProps) {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 获取联系人列表
  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open]);

  // 当creatorId变化或对话框打开时，如果有creatorId，选中该联系人
  useEffect(() => {
    if (open && creatorId && contacts.length > 0) {
      const targetContact = contacts.find(contact => contact.id === creatorId);
      if (targetContact) {
        setSelectedContact(targetContact);
      }
    }
  }, [creatorId, contacts, open]);

  // 获取联系人列表
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/contacts');
      const contactsData = response.data;
      
      // 按最后消息时间排序，最新的在前
      contactsData.sort((a: any, b: any) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      
      setContacts(contactsData);
      
      // 如果有creatorId，尝试选中该联系人
      if (creatorId) {
        const targetContact = contactsData.find((contact: any) => contact.id === creatorId);
        if (targetContact) {
          setSelectedContact(targetContact);
        }
      }
    } catch (error) {
      console.error('获取联系人列表失败', error);
      toast.error('获取联系人列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 当选择联系人变化时，获取消息记录
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // 获取与特定联系人的消息记录
  const fetchMessages = async (contactId: number) => {
    try {
      const response = await api.get(`/users/messages/with/${contactId}`);
      setMessages(response.data);
      
      // 标记消息为已读
      if (selectedContact?.unreadCount && selectedContact.unreadCount > 0) {
        await api.post(`/users/messages/read/${contactId}`);
        
        // 更新联系人列表中的未读数
        setContacts(contacts.map(contact => 
          contact.id === contactId 
            ? { ...contact, unreadCount: 0 } 
            : contact
        ));
      }
    } catch (error) {
      console.error('获取消息记录失败', error);
      toast.error('获取消息记录失败');
    }
  };

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedContact) return;
    
    try {
      setSendingMessage(true);
      
      // 发送消息到API
      const response = await api.post(`/users/messages/send/${selectedContact.id}`, {
        content: input.trim()
      });
      
      // 添加新消息到列表
      const newMessage = response.data;
      setMessages([...messages, newMessage]);
      
      // 更新联系人列表中的最后一条消息
      setContacts(contacts.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              lastMessage: input.trim(),
              lastMessageTime: new Date().toISOString()
            } 
          : contact
      ));
      
      // 清空输入框
      setInput('');
      toast.success('消息已发送');
      
      // 滚动到底部
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error: any) {
      console.error('发送消息失败', error);
      toast.error(error.response?.data?.message || '发送消息失败');
    } finally {
      setSendingMessage(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[95vw] h-[60vh] dialog-backdrop p-0 flex">
        <VisuallyHidden>
          <DialogTitle>消息对话框</DialogTitle>
        </VisuallyHidden>
        {/* 左侧用户列表 */}
        <div className="w-[280px] border-r border-gray-200 h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">联络列表</h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-gray-500 text-center">
                  <p>暂无联络记录</p>
                </div>
              </div>
            ) : (
              contacts.map(contact => (
                <div 
                  key={contact.id}
                  className={`p-4 hover:bg-gray-100 cursor-pointer flex items-center ${selectedContact?.id === contact.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="relative">
                    <Avatar 
                      src={contact.avatarUrl || undefined} 
                      alt={contact.nickname || contact.username} 
                      size="md"
                    />
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{contact.nickname || contact.username}</p>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-gray-500">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* 右侧聊天区：三层容器结构 */}
        <div className="flex-1 min-w-[320px] max-w-[600px] flex flex-col h-full">
          {selectedContact ? (
            <>
              {/* 聊天头部 */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{selectedContact.nickname || selectedContact.username}</h2>
              </div>
              {/* 聊天消息列表（可滚动） */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="flex flex-col space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">暂无消息记录，开始聊天吧</div>
                    </div>
                  ) : (
                    messages.map(message => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`message-bubble rounded-lg p-3 break-words whitespace-pre-wrap max-w-full ${isOwnMessage ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {message.content}
                            <div className={`text-xs mt-1 text-right ${isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500'}`}>{formatTime(message.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {/* 输入区（固定高度） */}
              <div className="p-4 border-t border-gray-200 flex items-center relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-500 hover:text-primary relative"
                  onClick={() => setShowEmojiPicker(v => !v)}
                >
                  <Smile className="h-5 w-5" />
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <Picker
                        data={emojiData}
                        onEmojiSelect={emoji => setInput(input + (emoji.native || emoji.shortcodes || ''))}
                        previewPosition="none"
                        theme="light"
                      />
                    </div>
                  )}
                </Button>
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="输入消息..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || sendingMessage}
                  className="bg-primary text-white rounded-full"
                >
                  {sendingMessage ? '发送中...' : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <p>选择一个联系人开始聊天</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 