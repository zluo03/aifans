'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { membershipApi, PaymentSettings } from '@/lib/api/membership';
import { Loader2, Save, TestTube, Settings } from 'lucide-react';

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>({
    alipayAppId: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
    alipayGatewayUrl: 'https://openapi.alipay.com/gateway.do',
    isSandbox: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await membershipApi.admin.getPaymentSettings();
      setSettings(data);
    } catch (error) {
      console.error('获取支付设置失败:', error);
      toast({
        title: '获取支付设置失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await membershipApi.admin.updatePaymentSettings(settings);
      toast({
        title: '保存成功',
        description: '支付设置已更新',
      });
    } catch (error) {
      console.error('保存支付设置失败:', error);
      toast({
        title: '保存失败',
        description: '请稍后重试',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await membershipApi.admin.testPaymentSettings();
      toast({
        title: result.success ? '测试成功' : '测试失败',
        description: result.message,
      });
    } catch (error) {
      console.error('测试支付设置失败:', error);
      toast({
        title: '测试失败',
        description: '请检查配置是否正确',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof PaymentSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-green-500" />
          <h1 className="text-2xl font-bold">支付设置</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleTest} variant="outline" disabled={testing}>
            {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <TestTube className="h-4 w-4 mr-2" />
            测试配置
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            保存设置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>支付宝配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appId">应用ID (App ID)</Label>
              <Input
                id="appId"
                value={settings.alipayAppId || ''}
                onChange={(e) => handleInputChange('alipayAppId', e.target.value)}
                placeholder="请输入支付宝应用ID"
              />
              <p className="text-xs text-muted-foreground mt-1">
                在支付宝开放平台创建应用后获得
              </p>
            </div>

            <div>
              <Label htmlFor="gatewayUrl">网关地址</Label>
              <Input
                id="gatewayUrl"
                value={settings.alipayGatewayUrl || ''}
                onChange={(e) => handleInputChange('alipayGatewayUrl', e.target.value)}
                placeholder="https://openapi.alipay.com/gateway.do"
              />
              <p className="text-xs text-muted-foreground mt-1">
                正式环境：https://openapi.alipay.com/gateway.do<br />
                沙箱环境：https://openapi.alipaydev.com/gateway.do
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox"
                checked={settings.isSandbox || false}
                onCheckedChange={(checked) => handleInputChange('isSandbox', checked)}
              />
              <Label htmlFor="sandbox">沙箱模式</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              开启后将使用支付宝沙箱环境进行测试
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>密钥配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="privateKey">应用私钥</Label>
              <Textarea
                id="privateKey"
                value={settings.alipayPrivateKey || ''}
                onChange={(e) => handleInputChange('alipayPrivateKey', e.target.value)}
                placeholder="请输入应用私钥（RSA2格式）"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                用于签名请求，请妥善保管
              </p>
            </div>

            <div>
              <Label htmlFor="publicKey">支付宝公钥</Label>
              <Textarea
                id="publicKey"
                value={settings.alipayPublicKey || ''}
                onChange={(e) => handleInputChange('alipayPublicKey', e.target.value)}
                placeholder="请输入支付宝公钥"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                用于验证支付宝返回的签名
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>配置说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">1. 创建支付宝应用</h4>
              <p>登录支付宝开放平台（https://open.alipay.com），创建网页&移动应用，获取App ID。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">2. 生成密钥对</h4>
              <p>使用支付宝提供的密钥生成工具生成RSA2密钥对，将应用私钥填入上方，应用公钥上传到支付宝平台。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">3. 获取支付宝公钥</h4>
              <p>在支付宝开放平台的应用详情页面，复制支付宝公钥并填入上方。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">4. 配置回调地址</h4>
              <p>在支付宝平台配置支付结果通知地址：{window.location.origin}/api/payments/alipay/notify</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 