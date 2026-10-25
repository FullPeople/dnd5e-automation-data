# 增强防御候选与真实输入回放

本批新增 Web 的 TCE 增强防御明确激活能力，以及 `scripts/audit_infusion_activation.ts` 的独立真实输入回执生成器。不是仅调整统计，也不改变原 18,789 条库存分母。

固定来源为 `tjliqy/5etools-cn@e2623b204ddbdf2bcfa8317acfc962de89c676e2`。增强防御完整条目 SHA256 为 `c3ff5aa7aefeb54b8e2d0454d042aa6b89937d5a454af67eec7d9363084015b0`；物品注法为 `5ea883f06ec7afaba3f78859d665806f32edba0d95c42d2dc35dc2675765b457`。当前站点两条规则正文与冻结条目相同，但文件级发生别处更新，因此验证使用冻结输入，不混用新文件散列。

回放覆盖：学习不自动激活、护甲明确激活、保存重开、奇械师十级升级、换未装备盾牌、装备盾牌、来源暂停/恢复、手工魔法加值保护及撤回。十个断言步骤在 Web `5af5b3bde46e975069a4b6a3e18b9e8ac686dbfc` 源码通过。后续测试夹具提交 `5d3b7ed` 没有改变运行源码。

所有原 229 份输入均已在仓库外恢复，canonical hash 与旧 ledger 完全一致；materialize 得到 18,789 身份，无缺失。完整消费回放另行记录，不把输入恢复当运行通过。

运行机制发生变化，所以执行一次完整真实回放。脚本保留全部旧消费者模块门禁并加入新灌注 UI，不移除原 159 项绑定。单项机制见证计数仍是“至少一项”，本批新能力可以发生在原本已有学习记录见证的同一身份上，不等于新增整个规则的完成数。

尚未验证：真实生产发布、外部持有人转移、死亡后失效时序、完整物品注法容量替换生命周期。新候选仅推送供审阅，不合并、不部署，也不修改正式玩家数据或权限。

## 远端候选验证（2026-10-23）

配对 Web [PR #103](https://github.com/FullPeople/DND-card-web/pull/103) 的提交 `60b714dfdc6c4cb0a88a37a9e06e7abb39ff1b25` 已在独立检出重新执行十步真实输入能力回放并通过。回执为 `reports/progress/capabilities/tce-enhanced-defense.json`，包含消费模块 SHA256 和明确的手工边界；不是浏览器或整条规则完成证明。

[Data CI 39929554562](https://github.com/FullPeople/dnd5e-automation-data/actions/runs/39929554562) 在 `c16f15d5ad7ffa686a8596afea5ed1b068a7ce2f` 上通过 511 个 Vitest 测试（11 跳过）、14 个 Node 测试与构建。其通用消费探针仍绑定旧 ledger，不能当新注法证明。Web CI 的31个注法测试与类型检查通过，正式构建因新机制尚未完成 runtime ledger 刷新而拦截，浏览器步骤跳过。先前本地负载下的两个5秒超时保留，不修改阈值。
