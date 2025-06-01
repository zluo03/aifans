# aifans 数据库管理脚本

本目录包含各种用于数据库管理和系统初始化的脚本。

## 管理员账户创建脚本

`create-admin.ts` 脚本用于创建一个默认的管理员账户。

### 使用方法

在项目根目录下运行以下命令：

```bash
npm run create:admin
```

或者使用最新优化版本：

```bash
npm run create:admin:fixed
```

### 默认管理员账户信息

脚本将创建以下默认管理员账户：

- **用户名**：admin
- **邮箱**：admin@aifans.pro
- **密码**：admin888
- **角色**：ADMIN

### 注意事项

1. 如果已存在用户名为"admin"或邮箱为"admin@aifans.pro"的用户，脚本将不会创建新的管理员账户
2. 此脚本仅用于初始系统设置，生产环境中建议创建后立即修改默认密码
3. 确保数据库连接配置正确，且数据库服务正在运行

## 字段名不匹配解决方案

我们发现数据库中字段名为`passwordHash`，但Prisma模型中是`password`，为解决这个问题，我们采用了以下两种解决方案:

### 1. 类型桥接方案（当前采用）

我们创建了类型转换桥接层，在代码中使用`mapUserPasswordField`函数将Prisma的User类型转换为包含passwordHash字段的类型。此方案的优点是：

- 不需要修改数据库或Prisma模型
- 代码能够处理字段名不匹配的情况
- 不需要生成新的Prisma客户端

相关文件：
- `src/types/prisma-extend.ts`: 类型定义和转换函数
- `src/auth/auth.service.ts`: 认证服务中使用转换
- `src/users/users.service.ts`: 用户服务中使用转换

### 2. 备用解决方案

如果您遇到登录问题，可以使用以下命令确保管理员账户能够正常工作：

```bash
npm run create:admin:fixed
```

这个脚本会尝试使用Prisma API和原始SQL两种方式创建管理员账户，确保至少一种方式成功。

## 其他脚本

### 检查管理员账户

使用以下命令检查管理员账户是否存在及其状态：

```bash
npx ts-node scripts/check-admin.ts
```

### 查看数据库表结构

使用以下命令查看用户表的结构：

```bash
npx ts-node scripts/db-info.ts
``` 