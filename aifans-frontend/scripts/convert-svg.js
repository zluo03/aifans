const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 定义路径
const svgPath = path.join(__dirname, '../public/images/default-avatar.svg');
const pngPath = path.join(__dirname, '../public/images/default-avatar.png');

// 读取SVG文件
const svgBuffer = fs.readFileSync(svgPath);

// 使用sharp将SVG转换为PNG
sharp(svgBuffer)
  .resize(120, 120)  // 设置合适的尺寸
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log(`成功将SVG转换为PNG，保存在: ${pngPath}`);
  })
  .catch(err => {
    console.error('转换过程出错:', err);
  }); 