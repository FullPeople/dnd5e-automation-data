# G7：Kiwee 单文件派生器演练

截至 2026-10-03，单文件脚本和中文说明已可审阅；本地干净检出演练通过。
GitHub 创建 fork 返回 HTTP 403，因此尚未在可写的 FullPeople fork 上保存
演练分支，G7 不标为完成。用户已收到创建 fork 的具体请求；未创建 Kiwee PR。

## 交付文件

- `generate-automation.mjs`：Node 22.12+ 单文件，只依赖 Node 内置模块。
- `src/kiwee/generator.ts`、`scripts/kiwee-bundle.mjs`：首选修改源码和构建器。
- `docs/FOR-KIWEE.md`：中文集成说明，供用户审阅。
- `test/kiwee-generator.vitest.ts`：独立运行、manifest/重复生成、输入损坏及路径逃逸回归。

生成器只运行结构化派生 A 与 Foundry 映射 B。未读覆盖层 C，全部记录仍为
`needsAnnotation`；本演练不是 G6 全覆盖证明。完整许可声明保留在单文件中。

## 原文命令与关键输出

源仓库 `tjliqy/5etools-cn`，默认分支 `cn2.0`，检出
`5cc0bbe2c2b241a334e731af4448bdba2168e8bd`。深度 1、稀疏检出只取得 data
和根文件；演练目录没有 `node_modules`。本地分支
`codex/automation-derive-rehearsal-20261003` 仅增加脚本和说明，不上传规则原文。

在检出根目录运行，退出码 0：

```sh
node generate-automation.mjs --data ./data --out ./data/generated
```

```json
{"records":13266,"files":33,"version":"2.36.0","verdict":"needsAnnotation","completeAutomationClaim":false}
```

Node 22.12 与 Node 24 对同一输出目录重复执行，33 个文件逐一 SHA 校对相同。
61 个实际本地输入与生产管线的 117 个输入不同，不能拿本演练 13,266 条替代
生产 18,789 条或核心四书 6,396 条。实际版本为 2.36.0 / 2026-09-21，
Foundry migrationVersion 为 3；没有凭日期猜版本。

两种 Node 环境执行以下命令，退出码均为 0：

```sh
DND_AUTOMATION_REAL_DATA=/workspace/dnd5e-automation-data/.cache/upstream/kiwee DND_WEB_EQUIVALENCE_REPO=/workspace/DND-card-web npm test
npm run build
```

Node 22 使用 `npm exec --yes --package=node@22.12.0 --cache /workspace/npm-automation-cache -- npm test`，并传入同样两个环境变量。

```text
Tests  315 passed (315)
tests 14
pass 14
fail 0
skipped 0
```

最初未传真实数据环境变量的测试为 304 通过、11 按环境跳过；后来完整复验
是 315 通过、0 跳过。两轮不累计。Node 22、24 的严格 TypeScript 构建也均退出 0。
许可证空行注释的尾随空格曾使 `git diff --check` 失败，已保留许可全文并修正
空行格式；重新构建、执行真实派生及格式检查均退出 0。

## 证据与当前阻断

忽略目录 `evidence/` 保存两环境测试和构建原始日志、干净演练日志、
逐文件 SHA、`g7-kiwee-script-doc.patch`、`g7-rehearsal-receipt.json`。
首次稀疏检出暂存增加文件失败，后续显式 `git add --sparse -N` 只用于生成 diff。

创建 GitHub fork 的实际请求：

```sh
gh api repos/tjliqy/5etools-cn/forks --method POST -f name=5etools-cn -F default_branch_only=true
```

```text
HTTP 403: Resource not accessible by integration
```

这是 GitHub 集成权限限制。未改凭据或绕过限制；等待已授权可写 fork 地址后
再把同一脚本和文档提交到独立演练分支，并复验。G6 标注与数据管线继续推进。

## 回滚

Web main 未改动、没有部署。独立数据仓按本次脚本提交 revert。
Kiwee 演练只涉及脚本和说明两个文件；撤销演练提交即可。
生成输出仅使用自身文件名，manifest 最后写入；输入解析、派生和整体验证
失败保留此前产物，写入失败恢复本轮已替换文件，其他 generated 文件保留。
