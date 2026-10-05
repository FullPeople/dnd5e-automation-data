# 逐条核对状态的公开导出

权威来源仍是本仓库的版本锁、逐条 IR 和接纳覆盖层。`reports/progress/automation-rule-status.json` 是只读生成物，不含规则正文、机制数值、角色对象、私人审阅笔记或原始测试快照。角色卡仓库只复制此产物并记录完整导出提交和 SHA256，不能另行维护逐条结论。

导出工具逐批检查真实覆盖层 SHA、输入锁、接纳结论、样本身份，以及声明来源提交中的覆盖层原始字节；逐条检查身份、结论、载荷和阻碍项与 IR 一致。所有 IR 条目均保留规范身份，缺失的规则版本保持 null。五类仅为互斥展示分组，不说明整条机制已经实现。

每条保留 verdict、核对状态、本地整条标记、载荷类别、阻碍类别/代码、部分支持边界、接纳批次和历史验证关联。未核对的结构解析不输出为已支持载荷。`tests: []` 表示没有把旧分支的验证映射成当前角色卡提交的完整规则验收。

私有历史回执只在本地读入，逐字节核对所关联 IR、原生检查与完整 App 产物。公开索引仅保留 SHA、完整代码提交、实际检查数量和明确的历史范围；不复制原始回执、测试结果中的角色对象或私人审阅材料。历史支持/保持未启用的行为测试不得成为当前提交或生产发布资格。

本轮实际输入：来源提交 `25ccc37e1584745a45f515c67d112d790db90ce9`；IR SHA256 `043bbe7c809ea57a595aa2b533d644a04358b49bba9ed01f66133c9de4e0dd67`。没有合并主线、启用新规则或修改默认已冻结 G5。导出分支为 `codex/automation-progress-export-20261005`；当前 GitHub 认证阻塞推送，未把本地提交写成远端发布。

复现（输入留在取得它们的私有工作区，不应提交）：

```sh
python scripts/export_progress_status.py \
  --ir /path/to/verified/automation.json \
  --overlay-root /path/to/source-repository/overlay \
  --source-revision 25ccc37e1584745a45f515c67d112d790db90ce9 \
  --upstream-root /path/to/verified/upstream \
  --evidence-root /path/to/private/evidence/g6 \
  --consumer-repository-root /path/to/historical/web-repository \
  --output /path/to/new-exclusive-output.json
python -B -m unittest discover -s scripts -p test_export_progress_status.py
```

输出路径必须不存在，防止截断旧证据或共享存储。原始 IR、覆盖层、私有首次失败和验证回执仍在原工作区。未来导出以新的实际输入和版本生成新产物，再在角色卡仓库执行导入工具；没有新证据时保持待核实。

回滚应新建分支并 revert 本次导出提交；角色卡端撤销配对导入提交或重新导入旧版本锁定产物。保留后续维护修改，不 reset、强推，也不修改角色与资源历史。
