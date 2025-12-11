/**
 * 注册API测试脚本
 * 用于验证注册功能是否正常工作
 * 
 * 使用方法：
 * 1. 确保开发服务器正在运行 (npm run dev)
 * 2. 运行此脚本: node test-register-api.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function testRegister() {
  const testUser = {
    username: `测试用户${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123'
  }

  console.log('🧪 开始测试注册API...')
  console.log('测试数据:', { ...testUser, password: '***' })
  console.log('API地址:', `${API_URL}/api/auth/register`)
  console.log('')

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    })

    const data = await response.json()

    console.log('📊 响应状态:', response.status)
    console.log('📋 响应数据:', JSON.stringify(data, null, 2))
    console.log('')

    if (response.ok && data.success) {
      console.log('✅ 注册成功!')
      console.log('用户ID:', data.data.user.id)
      console.log('用户名:', data.data.user.username)
      console.log('注册序号:', data.data.user.registration_number)
      console.log('Token:', data.data.token ? '已生成' : '未生成')
      return true
    } else {
      console.log('❌ 注册失败!')
      console.log('错误信息:', data.error)
      console.log('错误代码:', data.code)
      
      // 提供错误诊断建议
      if (data.code === 'CONFIG_ERROR') {
        console.log('')
        console.log('💡 诊断建议:')
        console.log('  这是环境变量配置错误。请检查:')
        console.log('  1. NEXT_PUBLIC_SUPABASE_URL')
        console.log('  2. NEXT_PUBLIC_SUPABASE_ANON_KEY')
        console.log('  3. JWT_SECRET')
        console.log('  4. SUPABASE_SERVICE_ROLE_KEY (推荐)')
        console.log('')
        console.log('  如果是在Vercel上部署，请确保:')
        console.log('  - 环境变量已配置到Production环境')
        console.log('  - 配置后已重新部署')
      } else if (data.code === 'USERNAME_EXISTS' || data.code === 'EMAIL_EXISTS') {
        console.log('')
        console.log('💡 这是正常的验证错误，说明API工作正常')
      } else if (data.code === 'PERMISSION_ERROR') {
        console.log('')
        console.log('💡 诊断建议:')
        console.log('  这是数据库权限错误。请检查:')
        console.log('  1. 是否设置了 SUPABASE_SERVICE_ROLE_KEY')
        console.log('  2. Supabase RLS策略是否正确配置')
      }
      return false
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    console.log('')
    console.log('💡 诊断建议:')
    console.log('  1. 确保开发服务器正在运行 (npm run dev)')
    console.log('  2. 检查API_URL是否正确')
    console.log('  3. 检查网络连接')
    return false
  }
}

// 运行测试
testRegister().then(success => {
  process.exit(success ? 0 : 1)
})

