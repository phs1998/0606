// API测试脚本
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试数据
let testUser = {
  username: '测试用户' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'password123'
};

let authToken = null;
let userId = null;

// 辅助函数：发送HTTP请求
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试函数
async function runTests() {
  console.log('🚀 开始测试API...\n');
  console.log('等待服务器启动...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 测试1: 用户注册
    console.log('\n📝 测试1: 用户注册');
    console.log('请求数据:', testUser);
    const registerResult = await makeRequest('POST', '/api/auth/register', testUser);
    console.log('状态码:', registerResult.status);
    console.log('响应:', JSON.stringify(registerResult.data, null, 2));
    
    if (registerResult.status === 200 && registerResult.data.success) {
      authToken = registerResult.data.data.token;
      userId = registerResult.data.data.user.id;
      console.log('✅ 注册成功！');
      console.log('用户ID:', userId);
      console.log('注册序号:', registerResult.data.data.user.registration_number);
    } else {
      console.log('❌ 注册失败');
      return;
    }

    // 测试2: 用户登录
    console.log('\n🔐 测试2: 用户登录');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('状态码:', loginResult.status);
    console.log('响应:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('✅ 登录成功！');
      authToken = loginResult.data.data.token; // 更新token
    } else {
      console.log('❌ 登录失败');
    }

    // 测试3: 获取当前用户信息
    console.log('\n👤 测试3: 获取当前用户信息');
    const meResult = await makeRequest('GET', '/api/auth/me', null, authToken);
    console.log('状态码:', meResult.status);
    console.log('响应:', JSON.stringify(meResult.data, null, 2));
    
    if (meResult.status === 200 && meResult.data.success) {
      console.log('✅ 获取用户信息成功！');
    } else {
      console.log('❌ 获取用户信息失败');
    }

    // 测试4: 获取用户公开信息
    console.log('\n👥 测试4: 获取用户公开信息');
    const userResult = await makeRequest('GET', `/api/users/${userId}`);
    console.log('状态码:', userResult.status);
    console.log('响应:', JSON.stringify(userResult.data, null, 2));
    
    if (userResult.status === 200 && userResult.data.success) {
      console.log('✅ 获取用户公开信息成功！');
    } else {
      console.log('❌ 获取用户公开信息失败');
    }

    // 测试5: 更新用户资料
    console.log('\n📝 测试5: 更新用户资料');
    const profileResult = await makeRequest('PUT', '/api/users/profile', {
      display_name: '测试显示名称',
      bio: '这是一个测试简介',
      location: '测试地点'
    }, authToken);
    console.log('状态码:', profileResult.status);
    console.log('响应:', JSON.stringify(profileResult.data, null, 2));
    
    if (profileResult.status === 200 && profileResult.data.success) {
      console.log('✅ 更新用户资料成功！');
    } else {
      console.log('❌ 更新用户资料失败');
    }

    // 测试6: 创建留言
    console.log('\n💬 测试6: 创建留言');
    const messageResult = await makeRequest('POST', '/api/messages', {
      content: '这是一条测试留言，用于验证API功能是否正常。'
    }, authToken);
    console.log('状态码:', messageResult.status);
    console.log('响应:', JSON.stringify(messageResult.data, null, 2));
    
    let messageId = null;
    if (messageResult.status === 200 && messageResult.data.success) {
      messageId = messageResult.data.data.message.id;
      console.log('✅ 创建留言成功！');
      console.log('留言ID:', messageId);
    } else {
      console.log('❌ 创建留言失败');
    }

    // 测试7: 获取留言列表
    console.log('\n📋 测试7: 获取留言列表');
    const messagesResult = await makeRequest('GET', '/api/messages?page=1&limit=10');
    console.log('状态码:', messagesResult.status);
    if (messagesResult.status === 200 && messagesResult.data.success) {
      console.log('✅ 获取留言列表成功！');
      console.log('留言数量:', messagesResult.data.data.messages.length);
    } else {
      console.log('❌ 获取留言列表失败');
    }

    // 测试8: 获取今日故事
    console.log('\n📖 测试8: 获取今日故事');
    const storyResult = await makeRequest('GET', '/api/stories/daily');
    console.log('状态码:', storyResult.status);
    if (storyResult.status === 200 && storyResult.data.success) {
      console.log('✅ 获取今日故事成功！');
      console.log('故事标题:', storyResult.data.data.title);
    } else {
      console.log('⚠️  今天还没有故事（这是正常的，需要先添加故事数据）');
    }

    console.log('\n✨ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试出错:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  无法连接到服务器，请确保开发服务器正在运行 (npm run dev)');
    }
  }
}

// 运行测试
runTests();

