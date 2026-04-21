# "一起存" API 文档

## 基础信息

- **Base URL**: `/api`
- **认证方式**: JWT Bearer Token（登录后获取，放入 `Authorization` 请求头）
- **Token 有效期**: 30 天

---

## 认证模块 `/api/auth`

### POST /api/auth/register

注册新用户。

**请求体**

```json
{
  "username": "string (3-20字符)",
  "password": "string (至少6字符)",
  "nickname": "string",
  "avatar_emoji": "string (可选，默认🧸)"
}
```

**响应 201**

```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "user1",
    "nickname": "昵称",
    "avatar_emoji": "🧸",
    "partner_id": null,
    "created_at": "2026-04-21T10:00:00.000Z"
  }
}
```

**错误响应**

- `400`: 请填写用户名、密码和昵称 / 用户名长度3-20个字符 / 密码至少6个字符 / 用户名已存在

---

### POST /api/auth/login

用户登录。

**请求体**

```json
{
  "username": "string",
  "password": "string"
}
```

**响应 200**

```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "user1",
    "nickname": "昵称",
    "avatar_emoji": "🧸",
    "partner_id": 2,
    "created_at": "2026-04-21T10:00:00.000Z"
  }
}
```

**错误响应**

- `400`: 请填写用户名和密码
- `401`: 用户名或密码错误

---

### GET /api/auth/me

获取当前登录用户信息。

**请求头**

```
Authorization: Bearer <token>
```

**响应 200**

```json
{
  "id": 1,
  "username": "user1",
  "nickname": "昵称",
  "avatar_emoji": "🧸",
  "partner_id": 2,
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

**错误响应**

- `404`: 用户不存在

---

## 伴侣模块 `/api/partner`

> 以下接口均需认证

### POST /api/partner/invite

生成伴侣邀请码。

**响应 201**

```json
{
  "id": 1,
  "user1_id": 1,
  "user2_id": null,
  "invite_code": "A1B2C3",
  "status": "pending",
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

**错误响应**

- `400`: 你已经绑定了伴侣

---

### POST /api/partner/bind

通过邀请码绑定伴侣。

**请求体**

```json
{
  "invite_code": "A1B2C3"
}
```

**响应 200**

```json
{
  "id": 1,
  "user1_id": 1,
  "user2_id": 2,
  "invite_code": "A1B2C3",
  "status": "active",
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

**错误响应**

- `400`: 请输入邀请码 / 你已经绑定了伴侣 / 对方已绑定了其他伴侣 / 不能绑定自己
- `404`: 邀请码无效或已过期

---

### GET /api/partner/status

获取当前用户的伴侣关系状态。

**响应 200**

```json
{
  "id": 1,
  "user1_id": 1,
  "user2_id": 2,
  "invite_code": "A1B2C3",
  "status": "active",
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

或 `null`（未绑定伴侣）

---

## 储蓄计划模块 `/api/plans`

> 以下接口均需认证

### POST /api/plans

创建新的储蓄计划。

**请求体**

```json
{
  "name": "旅行基金",
  "target_amount": 10000,
  "cell_count": 100,
  "cell_theme": "hearts",
  "deadline": "2026-12-31 (可选)"
}
```

**响应 201**

```json
{
  "id": 1,
  "name": "旅行基金",
  "target_amount": 10000,
  "cell_count": 100,
  "cell_amount": 100,
  "created_by": 1,
  "partner_id": 2,
  "cell_theme": "hearts",
  "deadline": "2026-12-31",
  "status": "active",
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

**错误响应**

- `400`: 请填写计划名称、目标金额和格子数 / 计划名称已存在，请使用不同的名称 / 截止日期必须晚于今天 / 格子数需在10-5000之间

---

### GET /api/plans

获取用户及其伴侣的所有储蓄计划列表。

**响应 200**

```json
[
  {
    "id": 1,
    "name": "旅行基金",
    "target_amount": 10000,
    "cell_count": 100,
    "cell_amount": 100,
    "created_by": 1,
    "partner_id": 2,
    "cell_theme": "hearts",
    "deadline": "2026-12-31",
    "status": "active",
    "created_at": "2026-04-21T10:00:00.000Z",
    "filled_cells": 25,
    "partner_nickname": "伴侣昵称",
    "partner_avatar": "🐼"
  }
]
```

---

### GET /api/plans/dashboard

获取仪表盘统计数据。

**响应 200**

```json
{
  "total_saved": 2500,
  "total_target": 10000,
  "active_plans": 2,
  "month_deposits": 500,
  "total_filled": 25,
  "total_cells": 100,
  "activities": [
    {
      "id": 1,
      "user_id": 1,
      "plan_id": 1,
      "action": "fill_cell",
      "detail": "第 1 格",
      "created_at": "2026-04-21T10:00:00.000Z",
      "nickname": "用户昵称",
      "plan_name": "旅行基金"
    }
  ],
  "streaks": [
    {
      "plan_id": 1,
      "current_streak": 5,
      "longest_streak": 10
    }
  ],
  "heatmap": [
    {
      "date": "2026-04-20",
      "count": 2
    },
    {
      "date": "2026-04-21",
      "count": 1
    }
  ],
  "trend": [
    {
      "week": "2026-W16",
      "amount": 500
    },
    {
      "week": "2026-W17",
      "amount": 300
    }
  ]
}
```

---

### GET /api/plans/:id

获取计划详情（包含所有格子状态）。

**响应 200**

```json
{
  "id": 1,
  "name": "旅行基金",
  "target_amount": 10000,
  "cell_count": 100,
  "cell_amount": 100,
  "created_by": 1,
  "partner_id": 2,
  "cell_theme": "hearts",
  "deadline": "2026-12-31",
  "status": "active",
  "created_at": "2026-04-21T10:00:00.000Z",
  "cells": [
    {
      "id": 1,
      "index": 0,
      "status": "filled",
      "filled_by": 1,
      "pledge_content": "承诺存下这笔钱",
      "filled_at": "2026-04-21T10:00:00.000Z",
      "reactions": [
        {
          "emoji": "❤️",
          "user_id": 2
        }
      ]
    },
    {
      "index": 1,
      "status": "empty",
      "reactions": []
    }
  ],
  "stats": {
    "total_cells": 100,
    "filled_cells": 25,
    "total_amount": 10000,
    "filled_amount": 2500,
    "progress_percent": 25.00,
    "my_filled": 15,
    "partner_filled": 10
  },
  "streak": {
    "current_streak": 5,
    "longest_streak": 10
  },
  "partner_nickname": "伴侣昵称",
  "partner_avatar": "🐼",
  "creator_nickname": "创建者昵称",
  "creator_avatar": "🧸"
}
```

**错误响应**

- `403`: 无权查看此计划
- `404`: 计划不存在

---

### POST /api/plans/:id/cells/:index/fill

填充格子。

**请求体**

```json
{
  "pledge_content": "承诺书内容（必填）",
  "note": "备注（可选）"
}
```

**响应 200**

```json
{
  "success": true,
  "completed": false,
  "hit_milestone": 25,
  "filled_count": 25,
  "total_count": 100
}
```

**错误响应**

- `400`: 请填写承诺书内容 / 格子序号无效 / 该格子已被填充
- `403`: 无权操作此计划
- `404`: 计划不存在

---

### POST /api/plans/:id/cells/:index/unfill-request

申请撤销格子填充。

**响应 200**

```json
{
  "success": true
}
```

或（单人计划自动批准）

```json
{
  "success": true,
  "auto_approved": true
}
```

**错误响应**

- `400`: 无待审批的撤销请求
- `404`: 计划不存在 / 格子不存在或未填充

---

### POST /api/plans/:id/cells/:index/unfill-approve

批准撤销请求（伴侣操作）。

**响应 200**

```json
{
  "success": true
}
```

**错误响应**

- `400`: 不能批准自己的撤销请求
- `404`: 无待审批的撤销请求

---

### POST /api/plans/:id/cells/:index/react

对格子添加表情反应（toggle：已存在则删除，不存在则添加）。

**请求体**

```json
{
  "emoji": "❤️"
}
```

**响应 200**

```json
{
  "success": true
}
```

**错误响应**

- `400`: 请选择表情
- `404`: 格子不存在

---

### POST /api/plans/:id/archive

归档计划。

**响应 200**

```json
{
  "success": true,
  "archived_at": "2026-04-21T10:00:00.000Z"
}
```

**错误响应**

- `400`: 计划已删除
- `403`: 只有计划创建者可以归档
- `404`: 计划不存在

---

### DELETE /api/plans/:id

软删除计划。

**响应 200**

```json
{
  "success": true
}
```

**错误响应**

- `400`: 计划已删除
- `403`: 只有计划创建者可以删除
- `404`: 计划不存在

---

### GET /api/plans/:id/stats

获取计划统计数据。

**响应 200**

```json
{
  "total_cells": 100,
  "filled_cells": 25,
  "total_amount": 10000,
  "filled_amount": 2500,
  "progress_percent": 25.00,
  "my_filled": 15,
  "partner_filled": 10
}
```

**错误响应**

- `404`: 计划不存在

---

## 通用错误响应格式

```json
{
  "error": "错误信息描述"
}
```

## HTTP 状态码说明

| 状态码 | 含义                 |
|-----|--------------------|
| 200 | 成功                 |
| 201 | 创建成功               |
| 400 | 请求参数错误             |
| 401 | 未授权（未登录或 token 无效） |
| 403 | 禁止访问（无权限）          |
| 404 | 资源不存在              |
| 500 | 服务器内部错误            |
