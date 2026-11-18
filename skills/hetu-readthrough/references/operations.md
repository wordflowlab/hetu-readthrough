# 操作地图

由正式清单生成，执行前发现当前安装版Schema。

| 动作 | 用途 | 必填参数 | 效果 |
| --- | --- | --- | --- |
| list_projects | 查找专业工程 |  | read |
| get_project | 读取固定专业工程 | object_id | read |
| save_project | 保存完整专业工程 | expected_revision, expected_sha256, operation_key, content | managed_write |
| put_plan | 维护朗读计划 | object_id, expected_revision, expected_sha256, operation_key, plan | managed_write |
| remove_plan | 移除朗读计划 | object_id, expected_revision, expected_sha256, operation_key, plan_id | managed_write |
| put_recording | 维护实际声音 | object_id, expected_revision, expected_sha256, operation_key, recording | managed_write |
| remove_recording | 移除实际声音 | object_id, expected_revision, expected_sha256, operation_key, recording_id | managed_write |
| put_mapping | 维护原文时间映射 | object_id, expected_revision, expected_sha256, operation_key, mapping | managed_write |
| remove_mapping | 移除原文时间映射 | object_id, expected_revision, expected_sha256, operation_key, mapping_id | managed_write |
| put_note | 维护听读意见 | object_id, expected_revision, expected_sha256, operation_key, note | managed_write |
| remove_note | 移除听读意见 | object_id, expected_revision, expected_sha256, operation_key, note_id | managed_write |
| inspect_wav | 核验实际PCM WAV声音字节 | file | read |
| check_timeline | 检查声音与原文映射 | object_id | read |
| locate_audio | 定位听读意见对应原文 | object_id, recording_id, time_ms | read |
| export_audio | 导出固定内嵌声音 | object_id, recording_id | read |
| get_source | 读取固定来源 | object_id, source_index | read |
| get_basis | 读取固定上游专业依据 | object_id, basis_index | read |
| compare_versions | 比较专业修订 | object_id, from_revision, to_revision | read |
| export_project | 导出固定专业报告 | object_id, format | read |
| build_context | 准备有界专业上下文 | object_id, goal, max_chars | read |
| create_handoff | 生成固定专业交接 | object_id, goal | read |
| get_operation | 沿原键回读操作 | operation_key | read |
