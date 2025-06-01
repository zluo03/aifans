#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 开始清理不必要的编辑器依赖...');

// 需要移除的依赖包
const depsToRemove = [
  // TipTap 相关
  '@tiptap/extension-color',
  '@tiptap/extension-font-family', 
  '@tiptap/extension-image',
  '@tiptap/extension-link',
  '@tiptap/extension-placeholder',
  '@tiptap/extension-table',
  '@tiptap/extension-table-cell',
  '@tiptap/extension-table-header',
  '@tiptap/extension-table-row',
  '@tiptap/extension-task-item',
  '@tiptap/extension-task-list',
  '@tiptap/extension-text-style',
  '@tiptap/extension-underline',
  '@tiptap/react',
  '@tiptap/starter-kit',
  
  // Lexical 相关
  '@lexical/clipboard',
  '@lexical/code',
  '@lexical/file',
  '@lexical/history',
  '@lexical/link',
  '@lexical/list',
  '@lexical/mark',
  '@lexical/react',
  '@lexical/rich-text',
  '@lexical/selection',
  '@lexical/table',
  '@lexical/utils',
  'lexical',
  
  // Quill 相关
  'quill',
  'react-quill-new',
  
  // BlockNote 相关 (如果不再需要)
  '@blocknote/core',
  '@blocknote/mantine',
  '@blocknote/react'
];

// 读取 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📦 当前依赖数量:', Object.keys(packageJson.dependencies || {}).length);

// 检查哪些依赖实际存在
const existingDeps = depsToRemove.filter(dep => 
  packageJson.dependencies && packageJson.dependencies[dep]
);

if (existingDeps.length === 0) {
  console.log('✅ 没有找到需要移除的编辑器依赖');
  process.exit(0);
}

console.log('🗑️  将要移除的依赖:');
existingDeps.forEach(dep => {
  console.log(`  - ${dep}`);
});

// 移除依赖
try {
  console.log('\n🔄 正在移除依赖...');
  execSync(`npm uninstall ${existingDeps.join(' ')}`, { 
    stdio: 'inherit',
    cwd: path.dirname(packageJsonPath)
  });
  
  console.log('✅ 依赖移除完成!');
  
  // 重新读取 package.json 显示结果
  const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('📦 清理后依赖数量:', Object.keys(updatedPackageJson.dependencies || {}).length);
  
  console.log('\n🎉 编辑器依赖清理完成!');
  console.log('💡 建议运行以下命令来清理 node_modules:');
  console.log('   rm -rf node_modules package-lock.json');
  console.log('   npm install');
  
} catch (error) {
  console.error('❌ 移除依赖时出错:', error.message);
  process.exit(1);
} 