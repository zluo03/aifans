import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CreatorMessageDialogProps {
  creatorId: string;
  creatorName?: string;
}

export function CreatorMessageDialog({ creatorId, creatorName = '创作者' }: CreatorMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: number;
    fromMe: boolean;
    content: string;
  }>>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // TODO: 实现真实的消息发送逻辑
    const newMessage = {
      id: Date.now(),
      fromMe: true,
      content: input.trim()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    toast.success('消息已发送');
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className="fixed bottom-8 right-8 z-50 bg-primary-gradient text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-200 rounded-full w-14 h-14 flex items-center justify-center hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-primary-gradient">
              与 {creatorName} 私信
            </DialogTitle>
          </DialogHeader>
          
          <div className="h-80 overflow-y-auto space-y-4 bg-gradient-to-b from-blue-50 to-purple-50 p-4 rounded-xl border border-gray-200">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-16 h-16 bg-primary-gradient rounded-full flex items-center justify-center mb-4">
                                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-center">暂无消息，开始对话吧</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${
                    msg.fromMe 
                      ? 'bg-primary-gradient text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter className="flex gap-3 pt-4">
            <div className="flex-1 relative">
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-[var(--custom-primary)] focus:border-transparent transition-all duration-200"
                placeholder="输入消息..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
              />
              <Button 
                disabled={!input.trim()} 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-gradient text-white border-0 w-8 h-8 p-0 rounded-md hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 