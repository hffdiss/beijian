# 备品备件管理系统 — 设计文档

## 概述

个人使用的备品备件管理系统，管理数百种混合类型物料（电子元器件、机械零部件、通用耗材、服务器部件）。Web 应用，浏览器访问，响应式适配桌面和手机。

## 技术栈

- **框架：** Next.js (App Router) + TypeScript
- **数据库：** SQLite（单文件，零配置，复制即备份）
- **ORM：** Prisma
- **UI：** shadcn/ui + Tailwind CSS
- **部署：** `next start` 一行命令启动

## 数据模型

### Category（分类）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String (UUID) | ✓ | 主键 |
| name | String | ✓ | 分类名称 |
| parentId | String? | | 父分类 ID，支持二级分类 |
| description | String? | | 描述 |
| createdAt | DateTime | ✓ | |
| updatedAt | DateTime | ✓ | |

### Item（物料）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String (UUID) | ✓ | |
| code | String | ✓ | 唯一编号 |
| name | String | ✓ | 名称 |
| description | String? | | 描述 |
| sn | String? | | SN 号（序列化部件） |
| model | String? | | 型号 |
| manufacturer | String? | | 制造商（谁造的） |
| categoryId | String | ✓ | 分类 |
| unit | String | ✓ | 单位 |
| quantity | Int | ✓ | 当前库存量，默认 0 |
| safetyStock | Int | ✓ | 安全库存阈值，默认 0 |
| position | String? | | 存放位置 |
| supplier | String? | | 供应商（从哪买的） |
| price | Float? | | 参考单价 |
| warrantyStart | DateTime? | | 维保起始日期 |
| warrantyEnd | DateTime? | | 维保截止日期 |
| nandType | String? | | SSD 颗粒类型 (SLC/MLC/TLC/QLC) |
| compatibleProducts | String? | | 适用产品对象 |
| createdAt | DateTime | ✓ | |
| updatedAt | DateTime | ✓ | |

### Transaction（出入库记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String (UUID) | ✓ | |
| type | Enum (IN/OUT) | ✓ | 入库/出库 |
| itemId | String | ✓ | 物料 |
| quantity | Int | ✓ | 变动数量 |
| reason | String? | | 用途/原因 |
| relatedPerson | String? | | 领用人 |
| note | String? | | 备注 |
| batchId | String? | | 同一批次标识，一次操作多物料 |
| createdAt | DateTime | ✓ | |

### StockTake（盘点记录）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String (UUID) | ✓ | |
| itemId | String | ✓ | 物料 |
| expectedQuantity | Int | ✓ | 账面数量 |
| actualQuantity | Int | ✓ | 实盘数量 |
| difference | Int | ✓ | 差异 = 实际 - 账面 |
| note | String? | | 备注 |
| batchId | String | ✓ | 盘点批次 |
| createdAt | DateTime | ✓ | |

## 功能模块

### 1. 仪表盘

- 统计卡片：物料总数、库存总值、本月出入库次数
- 低库存预警：quantity ≤ safetyStock 的物料列表
- 维保到期提醒：warrantyEnd 在 30 天内的物料
- 快捷操作按钮：入库、出库

### 2. 物料管理

- 表格列表，左侧分类树筛选
- 关键词搜索：名称/型号/SN/编号
- 新增/编辑/删除物料，支持全部字段
- 点击物料进入详情：基本信息 + 出入库历史

### 3. 入库/出库

- 单次操作支持多行物料（batchId 关联）
- 物料选择器：搜索 + **快速新建**（未录入的物料当场创建）
- 字段：物料、数量、领用人、用途、备注
- 确认后自动更新 Item.quantity

### 4. 出入库记录

- 列表展示所有出入库记录，支持按时间、物料、类型筛选
- 可撤销单条记录（反向操作，恢复库存）

### 5. 盘点

- 发起盘点：全盘或按分类
- 逐项核对：显示账面数量，填写实盘数量，自动计算差异
- 差异高亮显示
- 盘点完成后，账面数量更新为实际数量
- 盘点历史可查

### 6. 分类管理

- 二级分类 CRUD
- 分类下有关联物料时不允许删除

### 7. 数据备份

- 一键下载 SQLite 数据库文件
- 物料列表导出 CSV

## UI 布局

侧边栏导航 + 主内容区结构。

| 页面 | 桌面端 | 手机端 |
|------|--------|--------|
| 物料列表 | 左侧分类树 + 表格 | 顶部下拉筛选 + 卡片列表 |
| 物料详情 | 右侧抽屉面板 | 全屏弹层 |
| 入库/出库 | 表单 + 多行物料表 | 垂直表单 |
| 仪表盘 | 卡片网格 | 单列滚动 |
| 盘点 | 对照表，差异高亮 | 逐项卡片核对 |

物料选择器组件在入库、出库、盘点页面共用，支持搜索和快速新建物料。
