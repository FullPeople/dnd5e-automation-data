# G6 已审1190条阶段回执

2026-10-03。实际资料18,789条、核心6,396条，主代理已按批逐条证据和每批十条（不足十则全部）独立抽检放行1,190条，31批。判定：automated 82、noMechanics 120、unsupported 988；其余5,206条仍needsAnnotation，G6未过。unsupported是已审明示边界/安全子集，不是完整战斗自动化；未通读的行不计覆盖。

生产冻结提交`fc39b48c12d26ac7aa8b8e28d8e226557821ce3a`，Node22.12.0/24.19.0分别真实全量离线流水线成功，核心待标注5,206、stale0，八份输出逐字节一致。automation.json 26,643,885 bytes，SHA256 `e9f73eb111cf4201dc2dd2660b57d32b63ee6357156b3dc27fb11d4d5f2ddc05`。原始日志及逐文件receipt在忽略的`evidence/g6/accepted1190-node22.log`、`accepted1190-node24.log`、`accepted1190-node-replay.json`；此前1,140条快照同样跨Node一致，旧证据保留。

本轮补入按英文完整原文核验的装备/法术/职业批次。PHB法术两批中可确认的48和47条另行成批放行，五条原文歧义继续needsAnnotation。XDMG-item-004首次主抽检发现Marble Elephant冷却起算被写成确定事实，整批退回重审、未修改accepted索引；原失败留痕`evidence/g6/XDMG-item-004-main-rejection.json`。其余火器GM电池补充边界仅明示unsupported，不生成未给出的shot/cell数字。

PHB与XPHB Fighter三基础资源池各自属于本来源，不叠加升级池。主独立检查两个版本共126个等级/资源容量点，全部正确；发现Web同名不同来源职业等级别名覆盖，已由Web提交`c5b3a29630b8c441ecf82ed5abaaed751370f37c`修复为实际父职业绑定，无父项歧义可见未绑定。双Node各900单元通过/25环境跳过/0失败、类型和两构建/单机审计通过，原IR浏览器4/0/0；完整Web新CI仍以该SHA的后续回执为准。Web默认资料仍G5草稿，不提前切换。

发布仅精确批次overlay、索引SHA回执与机械审阅摘录，不上传原文缓存/中间proposal/玩家资料。每批真实SHA、inputLock和主抽检发现见`overlay/reviews.json`与`docs/REVIEWS/`。数据分支可逐批反转；全部batch提交及旧main树保留，自动输出保留.previous。当前远端旧main回滚点`2ba1b3b5b4bee47da8fcbde43341bf0ad6762479`；发布使用已授权Git Database API、精确对象SHA与非强制更新，候选CI成功后才普通合并数据main，不合Web main或部署。

G7单文件生成器和中文说明已完成本机真实上游干净演练；实际Kiwee fork创建403仍待外部建fork，未创建Kiwee PR。G8尚未放行，整体任务持续推进。
