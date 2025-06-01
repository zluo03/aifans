/**
 * 头像优化脚本
 * 用于修复头像文件权限和访问问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 头像目录
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatar');

/**
 * 修复头像目录权限
 */
function fixPermissions() {
  console.log('=== 修复头像目录权限 ===');
  
  // 检查头像目录是否存在
  if (!fs.existsSync(AVATAR_DIR)) {
    console.log('头像目录不存在，创建目录');
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }
  
  // Windows环境下不需要修改权限
  if (process.platform === 'win32') {
    console.log('Windows环境，跳过权限修复');
    return;
  }
  
  try {
    // 修改目录权限为755 (rwxr-xr-x)
    console.log('修改目录权限为755');
    execSync(`chmod -R 755 ${AVATAR_DIR}`);
    
    // 修改文件权限为644 (rw-r--r--)
    console.log('修改文件权限为644');
    execSync(`find ${AVATAR_DIR} -type f -exec chmod 644 {} \\;`);
    
    console.log('权限修复完成');
  } catch (error) {
    console.error('修改权限失败:', error.message);
  }
}

/**
 * 扫描并检查头像文件
 */
function scanAvatarFiles() {
  console.log('=== 扫描头像文件 ===');
  
  if (!fs.existsSync(AVATAR_DIR)) {
    console.error('头像目录不存在');
    return;
  }
  
  try {
    // 读取所有头像文件
    const files = fs.readdirSync(AVATAR_DIR);
    console.log(`共发现${files.length}个头像文件`);
    
    // 检查文件
    let corruptedFiles = 0;
    let emptyFiles = 0;
    
    files.forEach(file => {
      const filePath = path.join(AVATAR_DIR, file);
      const stats = fs.statSync(filePath);
      
      // 检查文件大小
      if (stats.size === 0) {
        console.log(`发现空文件: ${file}`);
        emptyFiles++;
        return;
      }
      
      // 检查文件是否是有效的图片
      try {
        const buffer = fs.readFileSync(filePath);
        const isJPEG = buffer.length > 2 && buffer[0] === 0xFF && buffer[1] === 0xD8;
        const isPNG = buffer.length > 8 && 
          buffer[0] === 0x89 && buffer[1] === 0x50 && 
          buffer[2] === 0x4E && buffer[3] === 0x47;
        
        if (!isJPEG && !isPNG) {
          console.log(`发现可能损坏的文件: ${file}`);
          corruptedFiles++;
        }
      } catch (readError) {
        console.error(`读取文件失败: ${file}`, readError.message);
      }
    });
    
    console.log(`扫描完成，发现${emptyFiles}个空文件，${corruptedFiles}个可能损坏的文件`);
  } catch (error) {
    console.error('扫描头像文件失败:', error.message);
  }
}

/**
 * 备份头像文件
 */
function backupAvatarFiles() {
  console.log('=== 备份头像文件 ===');
  
  const backupDir = path.join(process.cwd(), 'uploads', 'avatar_backup');
  
  try {
    // 创建备份目录
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 复制文件
    const files = fs.readdirSync(AVATAR_DIR);
    console.log(`准备备份${files.length}个文件`);
    
    let copied = 0;
    files.forEach(file => {
      const sourcePath = path.join(AVATAR_DIR, file);
      const destPath = path.join(backupDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        copied++;
      } catch (copyError) {
        console.error(`备份文件失败: ${file}`, copyError.message);
      }
    });
    
    console.log(`成功备份${copied}/${files.length}个文件`);
  } catch (error) {
    console.error('备份头像文件失败:', error.message);
  }
}

// 运行修复程序
console.log('=== 头像优化脚本开始 ===');
fixPermissions();
scanAvatarFiles();
backupAvatarFiles();
console.log('=== 头像优化脚本完成 ==='); 