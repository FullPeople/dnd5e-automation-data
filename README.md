# dnd5e-automation-data（本地暂名）

当前仅为 G1 全库盘点工具，尚未实现或发布 automation-ir 协议及执行器。仓库名未向远端注册，可在用户审阅时调整。

```sh
npm ci --cache /workspace/npm-automation-cache
npm test
npm run build
npm run inventory -- --cache .cache/upstream --out reports/g1
npm run inventory -- --cache .cache/upstream --out reports/g1-replay --offline
```

`inventory` 一条命令拉取、展开、盘点并报告。`fetch` 仅拉取，`report` 仅使用锁定缓存复跑。支持 HTTPS、继承代理和 CA 信任，至多四个并发请求；同一输入连续失败两次即停止。原始数据在忽略 `.cache/` 中，不随源码提交。没有备用源、关闭 TLS 或完整性绕过。

报告按 namespace/source × kind × 三种临时候选值统计：`structuredCandidate`、`foundryCandidate`、`proseOnly`。这些不是协议四种 verdict，也不是完成度。`withStructured` 和 Foundry 列允许交叉，不能相加。输出 `coverage-report.{json,md}`、`inputs-sha256.json`、`inventory-gaps.json`；每个输入保存 SHA-256，报告带 kiwee changelog 与 Foundry migrationVersion 锁。

角色相关核心13种原始分类、额外规则种类、6个Foundry文件及三方索引全部盘点；怪物及战斗执行不在本期范围。`item` 包含模板展开后的具体魔法装备，`baseitem/magicvariant` 同时保留自身分类。继承或身份缺失会明确列出。Foundry raceFeature 等没有顶层对应的记录保留为 orphan。

运行要求 Node 22.12+，TypeScript、ESM；测试使用 Node 内置测试器。G2 再建立正式 schema 与完整不变量验证。G1暂定身份键不作为正式协议批准结果。

`src/inventory/expand.ts` 迁移自 DND-card-web `80c94e0` 的纯展开函数（原文件 SHA-256 `be28a83b74ca39d328beee2746b069af838b40a959640f8541e1017228eb13f3`），仅将 Raw 类型导入替换为本地类型；`subrace.ts` 保持原继承算法。保留 DND Card Noncommercial Share-Alike License 1.0。5etools/Foundry、kiwee、三方资料保持各自许可，当前源码许可不授予第三方正文分发权。
