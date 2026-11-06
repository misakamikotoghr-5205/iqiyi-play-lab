# 爱奇艺逐款上传材料

核对：2026-11-06。**材料准备完成不等于平台投稿、审核通过或上线。** 本目录只放后台上传辅助素材；不要把它或赛事文案装入四个应用 ZIP。

现有四个 ZIP 未重做。已逐包检查 CRC、SHA-256、根 `index.html`、五个根文件、源码一致性、无远程资源/网络 API/ES module；每包 25–42 KB，低于 20 MB。具体结果见 [package-audit.json](package-audit.json)。

## 每款的文件组合

| 发布名称 | 独立应用包（项目根目录下） | 竖版封面 | 横版备选封面 |
| --- | --- | --- | --- |
| 雨巷来信 | `dist/submissions/rain-alley.zip` | [720×960 PNG](covers/rain-alley-portrait.png) | [1280×720 PNG](covers/rain-alley-landscape.png) |
| 猫咪调度站 | `dist/submissions/cat-dispatch.zip` | [720×960 PNG](covers/cat-dispatch-portrait.png) | [1280×720 PNG](covers/cat-dispatch-landscape.png) |
| 24帧导演 | `dist/submissions/frame-director.zip` | [720×960 PNG](covers/frame-director-portrait.png) | [1280×720 PNG](covers/frame-director-landscape.png) |
| 回声节拍 | `dist/submissions/echo-rhythm.zip` | [720×960 PNG](covers/echo-rhythm-portrait.png) | [1280×720 PNG](covers/echo-rhythm-landscape.png) |

封面取自各应用已有的原创色彩、几何和玩法意象，均在图内写明**“原创封面设计 · 非应用截图”**，没有第三方影视人物、图片、音乐或平台徽标。每个 PNG 有同名可编辑 SVG；[封面清单](cover-manifest.json)记录尺寸和 SHA。两种尺寸只是投稿备选，不是对后台强制尺寸的断言。官方 v11 手册未给封面比例/像素/体积要求；登录后以实际控件的格式、裁切和尺寸限制为准，必要时用 SVG 重排。

[upload-fields.json](upload-fields.json)给出每款名称、45字左右的简介、完整介绍、分类建议和文件路径。分类建议是对玩法的解释，**不是已核验的后台选项名或分类ID**。

## 已取得的真实截图

[五张真实截图及可见范围](screenshots/README.md)覆盖四款；每图尺寸1265×712，操作者报告实际window为1280×720。390×844设值未生效，fullPage截图失败后改用正常桌面视口，因此有内容不在画面内。

- 雨巷：标题、匿名信与4/5线索可见；100分和结局名称仅来自操作者读取既有存档DOM，不在图中，也不是本轮重跑结果。
- 猫咪：两张局部图结合本轮一次上移操作，分别显示步数1及棋盘下部/方向键；不宣称通关。
- 导演：既有第1卷“已成片”与监视器可见；本轮点击连续试映，不宣称重新解完全部卷。
- 节拍：PNG为准备界面；本轮开始→暂停及DOM“时间已停下/继续可用”是独立操作记录，不能把这张图标成暂停画面。

原始采集实为JPEG编码（文件名原为`.png`），已原字节归档为`originals/*.jpg`；上传版规范为真正PNG并验证解码RGB像素相同，没有裁剪或改动界面。这些真实截图与带“非应用截图”标注的原创封面分开存放。若后台要求手机截图、完整UI或指定比例，仍需实际设备重新采集。

## 逐款操作

1. 本人完成爱奇艺号实名认证，进入“互动小应用 → 去发布”。若没有入口，核对账号当前权限；不能把本地文件或 GitHub 当作平台发布。
2. 选择该款独立 ZIP，在平台预览，填写对应名称/简介；从实际分类选项中选最贴近玩法的一项。
3. 上传该款原创封面。只有平台明确要求应用截图时，使用 `screenshots/` 中经实际浏览器取得的截图；封面不能冒充截图。
4. 按真实创作方式填写 AI/版权声明，选择原创内容；未使用纳逗 Pro，不勾选虚假的工具使用或授权影视 IP。
5. 在“参与活动”勾选本届“玩点新花样—AI互动小应用征集赛”，检查全部字段与真实手机 WebView 交互后提交。
6. 四款分别重复。到“内容管理 → 互动小应用”核对审核结果；待审不等于上线，提交成功也不等于现金资格满足。

## 可复制的共同声明

> 本作品由 Codex 多智能体辅助编写代码、原创文字及程序封面。故事、关卡、镜头文字和节拍谱为本项目原创；画面使用程序几何、CSS、文本与系统字体，没有下载或改编第三方影视素材。回声节拍的声音由 WebAudio 即时合成，无版权歌曲或外部音源。未使用纳逗 Pro。应用运行不调用生成式模型，不联网、不收集个人信息、不读取麦克风；本地存档只保留游戏进度。源码采用 MIT 许可。

若后台把代码、文本、图形、声音分开询问，按各款的实际内容逐项说明；AI辅助开发不等于应用中有运行时AI。

## 仍需实际完成

- **手机/WebView验证仍缺。** 已有5张真实桌面浏览器局部截图，覆盖4款，均已逐张打开检查；它们不是390×844竖屏、手机或平台WebView截图，也不是完整UI。图中可见内容与操作者的DOM/存档操作记录分开写在[screenshots/README.md](screenshots/README.md)及[截图清单](screenshot-manifest.json)，不能用存档画面证明本轮全流程通关。
- 登录后的完整字段、封面尺寸/分类选项、账号入口与实名状态尚需本人核对。
- 平台手机 WebView 上的触控、存档、原生 `dialog`、切后台暂停和音频延迟需实际复核。默认静音完整可玩，不能把桌面检查当成设备延迟合格保证。
- 四款各自的正式投稿、活动勾选、审核通过与上线记录尚未取得。活动现金奖的至少四款数量门槛仍以主办方规则及实际审核为准。

## 复核与素材复现

```sh
python3 submission/verify-materials.py
# 验证四款真实截图及已复核清单（现已齐全）
python3 submission/verify-materials.py --require-screenshots
# 可选封面制作依赖 CairoSVG 2.8+；它不进入应用包
python3 submission/render-covers.py
```

`verify-materials.py`另需 Pillow，只是素材/ZIP验证工具。没有修改游戏核心、构建脚本、应用 ZIP 或任何报名状态。

官方依据：[活动页](https://aic.iqiyi.com/activity/ai-contest-2026)、[v11使用手册](https://aic.iqiyi.com/activity/campaign/assets/interactive-app-guide-v11.pdf)、[创作者后台](https://creator.iqiyi.com/)。2026-11-06实际读取 v11 PDF：需名称、简介、分类、封面、活动勾选；提交成功不代表上线。手册未公开本稿所列的具体封面尺寸或分类选项。
