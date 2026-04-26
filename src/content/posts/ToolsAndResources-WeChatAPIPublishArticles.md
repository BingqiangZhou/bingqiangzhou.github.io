---
title: "【学习笔记】微信公众号 API 发布文章"
published: 2026-04-26
description: "使用微信公众号 API 发布文章的完整流程、Python 代码实现及注意事项。"
lang: zh
tags: ["学习笔记", "工具分享"]
---

> 本笔记记录了使用微信公众号 API 发布文章的完整流程、代码实现及注意事项。

---

<!-- ## 目录

- [一、前置准备](#一前置准备)
- [二、发布流程（4 步）](#二发布流程4-步)
- [三、完整 Python 代码实现](#三完整-python-代码实现)
- [四、重要注意事项](#四重要注意事项)
- [五、相关接口文档](#五相关接口文档)

--- -->

## 一、前置准备

| 步骤 | 说明 |
|------|------|
| **1. 获取 AppID 和 AppSecret** | 登录 [微信开发者平台](https://developers.weixin.qq.com/platform)，扫码进入「我的业务 → 公众号」，查看 AppID 和 AppSecret |
| **2. 配置 IP 白名单** | 在同一页面，将你调用 API 的服务器 IP 添加到白名单，否则会报 `errcode: 40164 invalid ip` |
| **3. 账号类型要求** | **草稿接口**（`draft/add`）：公众号和服务号均可调用。**发布接口**（`freepublish/submit`）：服务号均可调用；公众号（原订阅号）仅已认证的企业主体账号可调用。2025 年 7 月起，个人主体账号、企业主体未认证账号及不支持认证的账号将被回收发布相关接口权限 |

## 二、发布流程（4 步）

```
获取 access_token → 上传封面图(永久素材) → 新建草稿 → 提交发布
```

### 第 1 步：获取 access_token

几乎所有微信 API 都需要 `access_token` 做身份认证。

```
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={APPSECRET}
```

返回：

```json
{ "access_token": "xxx", "expires_in": 7200 }
```

> **建议**：token 有效期 2 小时，生产环境应做缓存，过期后再重新获取。

### 第 2 步：上传封面图（新增永久素材）

草稿的封面图需要是**永久素材**，通过上传图片获取 `media_id`。

```
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={TOKEN}&type=image
Content-Type: multipart/form-data
```

- 请求体：`media` 字段上传图片文件（支持 jpg/png，大小 ≤ 10MB）
- 返回：`{ "media_id": "xxx", "url": "https://mmbiz.qpic.cn/..." }`

> **提示**：如果多次发布文章使用相同封面，`media_id` 可复用，无需重复上传。

### 第 3 步：新建草稿

```
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token={TOKEN}
Content-Type: application/json
```

请求体关键字段：

| 参数 | 必填 | 说明 |
|------|------|------|
| `articles` | ✅ | 图文素材数组 |
| `articles[].title` | ✅ | 标题，≤ 32 字 |
| `articles[].content` | ✅ | 正文 HTML，≤ 2 万字符，< 1MB |
| `articles[].thumb_media_id` | ✅ | 封面图永久素材 media_id |
| `articles[].author` | ❌ | 作者，≤ 16 字 |
| `articles[].digest` | ❌ | 摘要，≤ 128 字，不填则取正文前 54 字 |
| `articles[].content_source_url` | ❌ | "阅读原文"链接 |
| `articles[].need_open_comment` | ❌ | 是否打开评论，0 关 / 1 开 |
| `articles[].only_fans_can_comment` | ❌ | 仅粉丝可评论，0 否 / 1 是 |

返回：`{ "media_id": "草稿的media_id" }`

> ⚠️ **编码注意**：构造 JSON 时必须设置 `ensure_ascii=False`，否则中文会变成 `\uXXXX` 转义导致乱码。

### 第 4 步：提交发布

```
POST https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token={TOKEN}
Content-Type: application/json

{ "media_id": "草稿的media_id" }
```

返回：`{ "publish_id": "xxx" }`

发布是**异步操作**，可通过以下接口查询状态：

```
POST https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token={TOKEN}
{ "publish_id": "xxx" }
```

返回 `publish_status`：`0` = 发布中，`1` = 发布成功，`2` = 发布失败，`3` = 已删除。

## 三、完整 Python 代码实现

```python
import requests
import json
import time


class WeChatPublisher:
    """微信公众号文章发布工具"""

    BASE_URL = "https://api.weixin.qq.com/cgi-bin"

    def __init__(self, appid: str, secret: str):
        self.appid = appid
        self.secret = secret
        self._access_token = None
        self._token_expires_at = 0

    # ==================== 第1步：获取 access_token ====================
    def get_access_token(self) -> str:
        """获取接口调用凭证（带缓存）"""
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token

        url = f"{self.BASE_URL}/token"
        params = {
            "grant_type": "client_credential",
            "appid": self.appid,
            "secret": self.secret,
        }
        resp = requests.get(url, params=params)
        data = resp.json()

        if "access_token" not in data:
            raise Exception(f"获取token失败: {data}")

        self._access_token = data["access_token"]
        # 提前5分钟过期，避免边界问题
        self._token_expires_at = time.time() + data.get("expires_in", 7200) - 300
        return self._access_token

    # ==================== 第2步：上传封面图 ====================
    def upload_image(self, file_path: str) -> str:
        """
        上传图片为永久素材
        :param file_path: 图片本地路径（jpg/png，≤10MB）
        :return: media_id
        """
        token = self.get_access_token()
        url = f"{self.BASE_URL}/material/add_material"
        params = {"access_token": token, "type": "image"}

        with open(file_path, "rb") as f:
            files = {"media": (file_path, f)}
            resp = requests.post(url, params=params, files=files)

        data = resp.json()
        if "media_id" not in data:
            raise Exception(f"上传图片失败: {data}")

        print(f"✅ 封面图上传成功, media_id: {data['media_id']}")
        return data["media_id"]

    # ==================== 第3步：新建草稿 ====================
    def add_draft(
        self,
        title: str,
        content: str,
        thumb_media_id: str,
        author: str = "",
        digest: str = "",
        content_source_url: str = "",
        need_open_comment: int = 0,
        only_fans_can_comment: int = 0,
    ) -> str:
        """
        新建图文草稿
        :param title: 标题（≤32字）
        :param content: 正文HTML（≤2万字符）
        :param thumb_media_id: 封面图永久素材 media_id
        :param author: 作者（可选）
        :param digest: 摘要（可选，不填取正文前54字）
        :param content_source_url: 阅读原文链接（可选）
        :return: 草稿 media_id
        """
        token = self.get_access_token()
        url = f"{self.BASE_URL}/draft/add?access_token={token}"

        article = {
            "article_type": "news",
            "title": title,
            "thumb_media_id": thumb_media_id,
            "content": content,
            "need_open_comment": need_open_comment,
            "only_fans_can_comment": only_fans_can_comment,
        }

        # 可选字段
        if author:
            article["author"] = author
        if digest:
            article["digest"] = digest
        if content_source_url:
            article["content_source_url"] = content_source_url

        payload = {"articles": [article]}
        headers = {"Content-Type": "application/json"}

        # 关键：ensure_ascii=False 防止中文变成 \uXXXX 乱码
        post_data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        resp = requests.post(url, data=post_data, headers=headers)

        data = resp.json()
        if "media_id" not in data:
            raise Exception(f"新建草稿失败: {data}")

        print(f"✅ 草稿创建成功, media_id: {data['media_id']}")
        return data["media_id"]

    # ==================== 第4步：提交发布 ====================
    def publish(self, draft_media_id: str) -> str:
        """
        将草稿提交发布（异步）
        :param draft_media_id: 草稿的 media_id
        :return: publish_id
        """
        token = self.get_access_token()
        url = f"{self.BASE_URL}/freepublish/submit?access_token={token}"

        resp = requests.post(url, json={"media_id": draft_media_id})
        data = resp.json()

        if "publish_id" not in data:
            raise Exception(f"发布失败: {data}")

        print(f"✅ 已提交发布, publish_id: {data['publish_id']}")
        return data["publish_id"]

    # ==================== 查询发布状态 ====================
    def get_publish_status(self, publish_id: str) -> dict:
        """
        查询发布状态
        :param publish_id: 发布任务ID
        :return: 状态信息
        """
        token = self.get_access_token()
        url = f"{self.BASE_URL}/freepublish/get?access_token={token}"

        resp = requests.post(url, json={"publish_id": publish_id})
        data = resp.json()

        status_map = {0: "发布中", 1: "发布成功", 2: "发布失败", 3: "已删除"}
        status = data.get("publish_status", -1)
        print(f"📋 发布状态: {status_map.get(status, '未知')}")

        return data

    # ==================== 一键发布 ====================
    def publish_article(
        self,
        title: str,
        content: str,
        cover_image_path: str,
        author: str = "",
        digest: str = "",
        content_source_url: str = "",
        poll_status: bool = True,
    ) -> str:
        """
        一键发布文章（完整流程）
        :return: publish_id
        """
        print(f"🚀 开始发布文章: {title}")

        # Step 1: 上传封面图
        thumb_media_id = self.upload_image(cover_image_path)

        # Step 2: 创建草稿
        draft_media_id = self.add_draft(
            title=title,
            content=content,
            thumb_media_id=thumb_media_id,
            author=author,
            digest=digest,
            content_source_url=content_source_url,
        )

        # Step 3: 提交发布
        publish_id = self.publish(draft_media_id)

        # Step 4: 轮询发布状态
        if poll_status:
            print("⏳ 等待发布结果...")
            for i in range(10):
                time.sleep(3)
                result = self.get_publish_status(publish_id)
                if result.get("publish_status") in (1, 2):
                    break

        return publish_id


# ==================== 使用示例 ====================
if __name__ == "__main__":
    APPID = "wx_your_appid_here"
    SECRET = "your_appsecret_here"

    publisher = WeChatPublisher(appid=APPID, secret=SECRET)

    article_title = "测试文章标题"
    article_content = """
    <p>这是一篇通过 API 发布的测试文章。</p>
    <p>支持 <strong>HTML</strong> 格式内容。</p>
    <p>图片需要使用微信素材库的URL，外部链接图片会被过滤。</p>
    """
    cover_image = "/path/to/your/cover.jpg"

    publish_id = publisher.publish_article(
        title=article_title,
        content=article_content,
        cover_image_path=cover_image,
        author="作者名",
        digest="文章摘要",
    )

    print(f"🎉 发布完成！publish_id: {publish_id}")
```

## 四、重要注意事项

| 注意点 | 说明 |
|--------|------|
| **正文中的图片** | `content` 里的 `<img>` 图片 URL **必须**来自微信素材库（通过「上传图文消息内的图片获取URL」接口上传后获取），外部图片 URL 会被过滤 |
| **中文编码** | JSON 请求体必须 `ensure_ascii=False`，否则中文标题和内容会乱码 |
| **发布是异步的** | 调用 `freepublish/submit` 后需轮询 `freepublish/get` 确认最终状态 |
| **API 发布的文章** | 不会触发微信系统推荐，也不会显示在公众号主页，适合通过**菜单链接**或**直接分享链接**给用户阅读 |
| **Token 缓存** | `access_token` 每日有调用次数限制（2000 次/天），务必做服务端缓存 |
| **草稿会被移除** | 草稿被群发或发布后会从草稿箱中移除 |

## 五、相关接口文档

- [发布能力总览](https://developers.weixin.qq.com/doc/subscription/guide/product/publish.html)
- [新增草稿接口](https://developers.weixin.qq.com/doc/service/api/draftbox/draftmanage/api_draft_add)
- [发布草稿接口](https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_submit)
- [获取 access_token](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html)
- [新增永久素材](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Assets.html)

---

> 📝 **笔记生成时间**：2026-04-26
