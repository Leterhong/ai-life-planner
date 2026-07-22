# 🚀 快速开始指南

## 3 步启动 Demo

### 第 1 步：配置 API Key

打开 `backend/.env` 文件（如果没有，复制 `.env.example`），填入你的 Seed Evolving API Key：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件
```

修改这一行：
```
SEED_API_KEY=你的API密钥
```

### 第 2 步：启动后端

```bash
cd backend
pip install -r requirements.txt
python main.py
```

看到以下输出即启动成功：
```
============================================================
  AI Life Planner Agent - Backend Started
  Server: http://0.0.0.0:8000
  Model: doubao-seed-evolving
============================================================
```

访问 http://localhost:8000/docs 可以看到 API 文档。

### 第 3 步：启动前端

打开**新的终端窗口**：

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000 即可使用。

---

## Demo 演示流程

1. **首页** - 点击「开始我的规划」
2. **填写信息** - 填写个人信息（可参考下方测试数据）
3. **上传资料** - 上传 `test-data/sample_resume.md` 或你自己的简历
4. **开始规划** - 点击「开始五年规划」，观看 5 个 Agent 依次分析
5. **查看报告** - 规划完成后自动跳转到可视化报告页面
6. **成长记录** - 可以使用成长记录模块记录每日进步

## 测试数据（直接复制使用）

**基础信息**：
- 年龄：22
- 学历：本科
- 专业：计算机科学与技术
- 当前职业：在校学生
- 所在行业：互联网
- 工作经验：0 年

**技能**：
- 编程：Python, JavaScript, 机器学习基础
- 语言：英语（CET-6）

**兴趣**：AI, 创业, 技术

**目标**：
- 职业目标：进入AI行业，成为AI应用工程师
- 收入目标：30-50万年薪
- 学习目标：掌握Agent开发、大模型应用、RAG技术
- 人生目标：做出有价值的AI产品

---

## 常见问题

### Q: pip install 慢怎么办？
使用国内镜像：
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q: npm install 慢怎么办？
使用淘宝镜像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 首次启动 sentence-transformers 下载模型慢？
模型会自动下载到 `~/.cache/huggingface`，可以手动下载 `BAAI/bge-small-zh-v1.5` 模型放到对应目录，或者设置镜像：
```bash
set HF_ENDPOINT=https://hf-mirror.com
```

### Q: API 调用失败？
1. 检查 API Key 是否正确
2. 检查网络能否访问火山引擎
3. 检查模型名称是否正确（endpoint ID）

### Q: 想在 Docker 里运行？
```bash
# 先配置 backend/.env
docker-compose up -d
# 访问 http://localhost:3000
```
