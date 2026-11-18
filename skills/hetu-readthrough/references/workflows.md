# 专业流程

1. 先固定朗读范围和voice_note。外部声音工具、联网、声音权利与费用另按用户实际指令决定；插件本身不生成声音。

2. inspect_wav 校验完整RIFF、fmt、data及采样帧，时长来自实际字节；只接受整数PCM WAV，其他格式由外部工具明确转换。静音合法但不代表有效语音。

3. 把实际声音经宿主assets.inspect/import登记成固定asset，再记录recording并核对audio_sha256及实际采样参数。大声音走固定asset分块，不能传任意本机路径。

4. 建立映射并明确segment_boundary、forced_alignment或estimated来源。估计不冒充强制对齐；映射与意见不能越过原文和声音。

5. check_timeline 看实际覆盖与估计项；locate_audio 从实际时间回到原文。GUI播放经宿主media_open读取固定声音，内嵌探测数据不是绕过播放服务的入口。

6. 听读后意见固定原声音及区间。换稿或换声音保留旧映射，明确准备新映射；export_audio 校验原字节。根据意见向宿主返工任务交接，已处理意见不等于正文采纳。

## 发现、保存与接续

先读本包Skill及operations，再从实际Schema组装输入。新建预期修订为0；已有工程先读get_project，再提交expected_revision、expected_sha256与原operation_key。保存后get_project回读固定成果。使用get_basis/get_source读取确切依据，build_context控制上下文预算且披露省略，create_handoff固定专业引用。

停用或升级后重新发现。响应未知先get_operation；明确not_found才沿原输入原键恢复。作者在GUI修改导致CAS冲突时保留自己的输入，读取新基线并比较，不覆盖作者新稿。

跨插件接续使用固定basis_refs；上游新修订不会改写旧依据。专业状态、解析成功、文件解码及自动检查均不等于内容认可、正式设定、正文采纳或定稿。
