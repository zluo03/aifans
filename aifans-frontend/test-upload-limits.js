// 测试上传限制配置功能
const testUploadLimits = async () => {
  console.log('=== 测试上传限制配置功能 ===\n');

  try {
    // 1. 测试获取默认配置
    console.log('1. 测试获取上传限制配置...');
    const response = await fetch('http://localhost:3000/api/admin/settings/upload-limits');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 获取配置成功');
      console.log('当前配置:', JSON.stringify(data.limits, null, 2));
    } else {
      console.log('❌ 获取配置失败:', data.message);
    }

    // 2. 测试保存新配置
    console.log('\n2. 测试保存新配置...');
    const newLimits = {
      notes: {
        imageSize: 8,  // 改为8MB
        videoSize: 80  // 改为80MB
      },
      inspiration: {
        imageSize: 15, // 改为15MB
        videoSize: 150 // 改为150MB
      },
      screenings: {
        videoSize: 800 // 改为800MB
      }
    };

    const saveResponse = await fetch('http://localhost:3000/api/admin/settings/upload-limits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limits: newLimits })
    });

    const saveData = await saveResponse.json();
    if (saveData.success) {
      console.log('✅ 保存配置成功');
      console.log('新配置:', JSON.stringify(saveData.limits, null, 2));
    } else {
      console.log('❌ 保存配置失败:', saveData.message);
    }

    // 3. 验证配置是否持久化
    console.log('\n3. 验证配置持久化...');
    const verifyResponse = await fetch('http://localhost:3000/api/admin/settings/upload-limits');
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      console.log('✅ 配置持久化验证成功');
      console.log('验证配置:', JSON.stringify(verifyData.limits, null, 2));
      
      // 检查配置是否符合预期
      const expected = newLimits;
      const actual = verifyData.limits;
      
      const isMatch = JSON.stringify(expected) === JSON.stringify(actual);
      if (isMatch) {
        console.log('✅ 配置值完全匹配预期');
      } else {
        console.log('❌ 配置值不匹配');
        console.log('预期:', expected);
        console.log('实际:', actual);
      }
    } else {
      console.log('❌ 验证配置失败:', verifyData.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }

  console.log('\n=== 测试完成 ===');
};

// 测试文件大小验证功能
const testFileSizeValidation = () => {
  console.log('\n=== 测试文件大小验证功能 ===\n');

  // 模拟文件对象
  const createMockFile = (size, type) => ({
    size: size,
    type: type,
    name: `test.${type.split('/')[1]}`
  });

  // 模拟上传限制
  const mockLimits = {
    notes: { imageSize: 5, videoSize: 50 },
    inspiration: { imageSize: 10, videoSize: 100 },
    screenings: { videoSize: 500 }
  };

  // 验证函数（简化版）
  const validateFileSize = (file, limits, module) => {
    const fileSizeMB = file.size / (1024 * 1024);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    let maxSize;
    if (module === 'notes') {
      maxSize = isImage ? limits.notes.imageSize : limits.notes.videoSize;
    } else if (module === 'inspiration') {
      maxSize = isImage ? limits.inspiration.imageSize : limits.inspiration.videoSize;
    } else if (module === 'screenings') {
      maxSize = limits.screenings.videoSize;
    }

    return fileSizeMB <= maxSize ? null : `文件过大: ${fileSizeMB.toFixed(2)}MB > ${maxSize}MB`;
  };

  // 测试用例
  const testCases = [
    { file: createMockFile(3 * 1024 * 1024, 'image/jpeg'), module: 'notes', expected: null },
    { file: createMockFile(8 * 1024 * 1024, 'image/jpeg'), module: 'notes', expected: 'error' },
    { file: createMockFile(40 * 1024 * 1024, 'video/mp4'), module: 'notes', expected: null },
    { file: createMockFile(80 * 1024 * 1024, 'video/mp4'), module: 'notes', expected: 'error' },
    { file: createMockFile(8 * 1024 * 1024, 'image/png'), module: 'inspiration', expected: null },
    { file: createMockFile(15 * 1024 * 1024, 'image/png'), module: 'inspiration', expected: 'error' },
    { file: createMockFile(400 * 1024 * 1024, 'video/mp4'), module: 'screenings', expected: null },
    { file: createMockFile(600 * 1024 * 1024, 'video/mp4'), module: 'screenings', expected: 'error' }
  ];

  testCases.forEach((testCase, index) => {
    const result = validateFileSize(testCase.file, mockLimits, testCase.module);
    const isValid = result === null;
    const expectedValid = testCase.expected === null;
    
    if (isValid === expectedValid) {
      console.log(`✅ 测试 ${index + 1}: ${testCase.file.name} (${testCase.module}) - 通过`);
    } else {
      console.log(`❌ 测试 ${index + 1}: ${testCase.file.name} (${testCase.module}) - 失败`);
      console.log(`   结果: ${result || '通过'}`);
    }
  });

  console.log('\n=== 文件大小验证测试完成 ===');
};

// 运行测试
if (typeof window === 'undefined') {
  // Node.js 环境
  const fetch = require('node-fetch');
  testUploadLimits().then(() => {
    testFileSizeValidation();
  });
} else {
  // 浏览器环境
  testUploadLimits().then(() => {
    testFileSizeValidation();
  });
}

console.log('上传限制测试脚本已启动...'); 