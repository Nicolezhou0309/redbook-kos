import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 企业微信API代理
app.get('/api/wecom/token', async (req, res) => {
  try {
    const { corpid, corpsecret } = req.query;
    const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
      params: { corpid, corpsecret }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wecom/send', async (req, res) => {
  try {
    const { access_token, ...message } = req.body;
    const response = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`,
      message
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 代理企业微信群机器人：上传文件 (避免浏览器CORS)
// 请求体: { key: string, fileName: string, contentBase64: string }
app.post('/api/wecom/webhook-upload', async (req, res) => {
  try {
    const { key, fileName, contentBase64 } = req.body || {};
    if (!key || !fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing key, fileName or contentBase64' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formData = new FormData();
    formData.append('media', blob, fileName);

    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${encodeURIComponent(key)}&type=file`;
    const upstreamResp = await fetch(uploadUrl, { method: 'POST', body: formData });
    const upstreamData = await upstreamResp.json();
    res.status(upstreamResp.status).json(upstreamData);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 代理企业微信群机器人：发送文件消息 (避免浏览器CORS)
// 请求体: { key: string, media_id: string }
app.post('/api/wecom/webhook-send', async (req, res) => {
  try {
    const { key, media_id } = req.body || {};
    if (!key || !media_id) {
      return res.status(400).json({ error: 'Missing key or media_id' });
    }

    const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${encodeURIComponent(key)}`;
    const payload = { msgtype: 'file', file: { media_id } };

    const upstreamResp = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const upstreamData = await upstreamResp.json();
    res.status(upstreamResp.status).json(upstreamData);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
});
