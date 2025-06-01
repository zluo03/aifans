'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeftIcon, Send } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/api';

// 邮件配置接口
interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export default function MailSettingsPage() {
  const [mailConfig, setMailConfig] = useState<MailConfig>({
    host: '',
    port: 465,
    secure: true,
    user: '',
    password: '',
    from: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const { toast } = useToast();
  
  // 获取邮件配置
  const fetchMailConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/mail');
      setMailConfig(response.data);
    } catch (error) {
      toast({
        title: '获取邮件配置失败',
        description: '请稍后重试',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMailConfig();
  }, []);
  
  // 处理配置变更
  const handleChange = (key: keyof MailConfig, value: string | number | boolean) => {
    setMailConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 保存配置
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await api.post('/admin/settings/mail', mailConfig);
      toast({
        title: '保存成功',
        description: '邮件配置已更新',
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请检查配置信息并重试',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // 发送测试邮件
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: '请输入测试邮箱地址',
        type: 'error',
      });
      return;
    }
    
    try {
      setSendingTest(true);
      await api.post('/admin/settings/mail/test', { 
        email: testEmailAddress 
      });
      toast({
        title: '测试邮件已发送',
        description: '请检查收件箱',
      });
    } catch (error) {
      toast({
        title: '发送测试邮件失败',
        description: '请检查邮件配置和测试邮箱地址',
        type: 'error',
      });
    } finally {
      setSendingTest(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/admin/settings" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回设置
        </Link>
        <h1 className="text-2xl font-bold">邮件设置</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>SMTP配置</CardTitle>
          <CardDescription>
            配置用于发送邮件的SMTP服务器信息，这些设置将用于发送注册验证和密码重置邮件。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">SMTP服务器</Label>
                  <Input 
                    id="host"
                    placeholder="例如: smtp.126.com"
                    value={mailConfig.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="port">端口</Label>
                  <Input 
                    id="port"
                    type="number"
                    placeholder="例如: 465"
                    value={mailConfig.port}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="secure"
                  checked={mailConfig.secure}
                  onCheckedChange={(checked) => handleChange('secure', checked)}
                />
                <Label htmlFor="secure">使用SSL/TLS安全连接</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user">邮箱账号</Label>
                  <Input 
                    id="user"
                    placeholder="例如: your-email@example.com"
                    value={mailConfig.user}
                    onChange={(e) => handleChange('user', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">密码/授权码</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="邮箱密码或SMTP授权码"
                    value={mailConfig.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from">发件人</Label>
                <Input 
                  id="from"
                  placeholder='例如: "AI灵感社" <your-email@example.com>'
                  value={mailConfig.from}
                  onChange={(e) => handleChange('from', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  建议格式: "发件人名称" &lt;邮箱地址&gt;
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveConfig} 
                  disabled={saving}
                  className="gap-1"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-1" />
                  保存配置
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>发送测试邮件</CardTitle>
          <CardDescription>
            测试当前配置是否能正常发送邮件，确保邮件服务工作正常。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">测试邮箱地址</Label>
              <div className="flex space-x-2">
                <Input 
                  id="test-email"
                  placeholder="输入接收测试邮件的邮箱地址"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                />
                <Button 
                  onClick={handleSendTestEmail} 
                  disabled={sendingTest || !testEmailAddress}
                  className="gap-1 whitespace-nowrap"
                >
                  {sendingTest && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4 mr-1" />
                  发送测试
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              发送测试邮件前，请确保已保存最新的邮件配置。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 