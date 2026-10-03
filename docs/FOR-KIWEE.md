# 给 Kiwee：可选的自动化机械数据派生

角色卡希望消费带身份键、数据版本锁和明确判定的机械数据，避免自己重新解析
中文正文，也便于其他工具消费。这里建议 Kiwee 增加一个可选生成步骤；它不
改变规则 JSON、译文或网站行为，也不要求 Kiwee 维护人工覆盖层。

## 只需运行一条命令

Node 22.12 或更新版本，在仓库根目录运行：

```sh
node generate-automation.mjs --data ./data --out ./data/generated
```

`generate-automation.mjs` 是单文件：没有 npm 包依赖，不联网，只读取本地
`data/changelog.json`、class/spells 索引、已列明的目录及 Foundry JSON。
上游 `_copy`、版本、子种族与魔法变体沿用经验证的派生实现。只处理结构化
字段 A 和 Foundry 映射 B；不读正文推断机制，不载入人工覆盖层 C。未经过
完整来源审阅的记录保留 `needsAnnotation`，不声称全覆盖或全部可执行。

独立数据仓负责覆盖层、抽检、报告及发布。身份兼容别名和已审阅、SHA 限定的
数值修正随脚本一起构建，Kiwee 不需维护另外一组补丁；输入变化使修正失效时，
脚本报告 `input-correction-stale`，不会继续套用旧值。

## 输出和使用方式

生成文件沿用现有 `gendata-spell-source-lookup.json` 模式：

- `gendata-automation-<kind>.json`：各类机械记录，无中文正文和出版物描述。
- `gendata-automation-manifest.json`：本次有效文件列表、字节数和 SHA-256。
- `gendata-automation-inputs-sha256.json`：每个源文件的路径、角色、SHA、大小和采集时刻。
- `gendata-automation-coverage.{json,md}`、`gendata-automation-unsupported.json`：草稿覆盖矩阵、已识别限制和身份诊断。

消费者必须按 manifest 的文件列表读取并验证 SHA，将各 kind 的 `records`
合并后执行完整协议校验；跨类引用不能用单个分片来判定缺失。所有分片的
schemaVersion、protocol 与 versionLock 必须一致。旧目录可能保留此前其他
kind 文件，消费者只使用本次 manifest 中的文件，不用文件通配符猜集合。

版本锁从本地最新 changelog 的 `ver/date` 以及实际 Foundry migrationVersion
派生，全部输入 SHA 固定到本次字节。相同输入在同一输出目录重跑会保留采集
时刻，生成完全相同的字节；离线复验可明确传入 `--fetched-at` 的 ISO 时刻。
该参数只是复验元数据，不能表示实际未发生的抓取。输入生成目录中的这些
automation 文件不作为自己的输入，避免循环或越来越大的输出。

## 构建失败和回滚

建议把这一步放在 Kiwee 主构建结束后的可选任务中。非零退出码要在 CI 留下
可见日志，并保留上一份有效产物；不要因此阻断 Kiwee 本身构建，也不要上传
未通过检查的半份产物。解析、派生和整体校验均在写入前完成。写入时只处理
自身文件名，manifest 最后替换；写入失败会恢复这一轮已替换文件。其他
`data/generated` 文件不改动。

停用时移除这一个可选构建步骤即可，上一版产物由消费者的版本锁和 SHA
继续识别。脚本更新只需替换文件并重跑；schema、映射和类型代码由独立数据
仓统一生成，Kiwee 无需同步维护它们。

## 来源与许可

脚本包含迁移自 FullPeople/DND-card-web 的身份、展开和派生逻辑，适用该项目
`LICENSE` 的 DND Card NC-SA 1.0；优先保留源代码及本说明的链接，不把它标成
Kiwee 全仓 MIT。独立数据仓提供首选修改源码、构建器、锁定依赖和测试。
嵌入的 Ajv 8.17.1 辅助代码适用 MIT，其完整许可保留在脚本注释中。

Kiwee `LICENSE.md` 的边界继续适用：项目代码及 data-bak 英文数据 MIT，
中文本地化 data 为 CC BY-NC-SA 4.0。机械提取不会授予出版物正文新的许可；
本工具不重新发布规则正文、翻译原文、图片或玩家资料，也不主张整份产物为 MIT。

当前集成演练是草稿，不能用它把尚未完成的 G6 覆盖门标成已通过。向 Kiwee
发 PR 的动作不在本次演练中；供审阅的 diff 与验证回执另行保存。
