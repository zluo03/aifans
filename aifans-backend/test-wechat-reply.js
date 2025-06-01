const http = require('http');

const options = {
  hostname: 'dev.aifans.pro', // 你的公网域名
  port: 80,                   // 端口，http默认80，https用443
  path: '/api/auth/wechat?signature=TESTSIGN&timestamp=1234567890&nonce=abcdefg',
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml',
  }
};

// 构造模拟微信的XML消息
const xmlData = `
<xml>
  <ToUserName><![CDATA[gh_97e7c34b966a]]></ToUserName>
  <FromUserName><![CDATA[onQs6w6aE4PVrmziQsTV1pMFqqwY]]></FromUserName>
  <CreateTime>1748767701</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[登录]]></Content>
  <MsgId>25036334775893125</MsgId>
</xml>
`;

const req = http.request(options, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    console.log('响应内容:\n', data);
  });
});

req.on('error', (e) => {
  console.error('请求遇到问题:', e.message);
});

req.write(xmlData.trim());
req.end();