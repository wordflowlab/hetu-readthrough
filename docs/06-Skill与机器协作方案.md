> 本文属于[朗读审阅文档](README.md)。

# Skill与机器协作

```mermaid
sequenceDiagram
 participant A as 作者
 participant X as Codex
 participant H as 河图CLI/MCP
 participant P as 专业插件
 A->>X: 本轮目标
 X->>H: 发现活动插件 Schema 和包内Skill
 X->>H: 读取固定稿与现有成果
 H->>P: 核验专业数据和依据
 X->>H: 保留CAS和原键保存专业操作
 H-->>A: 可读成果 差异 缺口
 X->>H: 回读固定结果并交接下一环节
```

包内 `hetu-readthrough` 由河图注册，Codex 使用稳定 invoke 的 skills.read 读取，不安装同名Codex插件。实际旅程为：固定稿和朗读范围 → 外部工具生成实际声音 → 核验WAV字节及真实时长 → 记录文本时间映射 → 播放与意见 → 固定选区返工。

先发现当前包、作品与精确 management_ref，再读固定修订和现有成果。来源不明保持未知，外部引用不扩大范围。专业方法由Skill指导，参数始终查实际Schema；升级或停用后重新发现。未知结果沿原键回读。

生成与语义判断仍由外部Agent完成。专业交接包含固定对象和来源，下游保存自己的专业状态或宿主候选；正文采纳、定稿、内容外发与费用分别决定。
