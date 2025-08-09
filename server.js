import express from 'express';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
// 支持两种方式：
// 1) multipart/form-data: fields { key }, file field name: media
// 2) JSON: { key, fileName, contentBase64 }
const upload = multer();
app.post('/api/wecom/webhook-upload', upload.single('media'), async (req, res) => {
  try {
    console.log('[/api/wecom/webhook-upload] incoming headers:', req.headers)
    console.log('[/api/wecom/webhook-upload] content-type:', req.headers['content-type'])
    console.log('[/api/wecom/webhook-upload] body keys:', Object.keys(req.body || {}))
    if (req.file) {
      console.log('[/api/wecom/webhook-upload] file received:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      })
    } else {
      console.log('[/api/wecom/webhook-upload] no file in multipart, will try JSON base64 path')
    }
    // 优先走 multipart
    let key = req.body?.key || req.query?.key;
    if (req.file && req.file.buffer) {
      if (!key) return res.status(400).json({ error: 'Missing key' });
      const buffer = req.file.buffer;
      const filename = req.file.originalname || 'report.xlsx';

      const form = new FormData();
      const blob = new Blob([buffer], { type: req.file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      form.append('media', blob, filename);

      const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${encodeURIComponent(key)}&type=file`;
      console.log('[/api/wecom/webhook-upload] upstream url:', uploadUrl)
      const upstreamResp = await fetch(uploadUrl, { method: 'POST', body: form });
      console.log('[/api/wecom/webhook-upload] upstream status:', upstreamResp.status, upstreamResp.statusText)
      const text = await upstreamResp.text();
      console.log('[/api/wecom/webhook-upload] upstream raw body:', text)
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return res.status(upstreamResp.status).json(data);
    }

    // 兼容 JSON base64 方式
    const { fileName, contentBase64 } = req.body || {};
    console.log('[/api/wecom/webhook-upload] json mode filename:', fileName, 'contentBase64 length:', contentBase64 ? contentBase64.length : 0)
    if (!key || !fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing key, fileName or contentBase64' });
    }
    const buffer = Buffer.from(contentBase64, 'base64');
    const form = new FormData();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    form.append('media', blob, fileName);
    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${encodeURIComponent(key)}&type=file`;
    console.log('[/api/wecom/webhook-upload] upstream url:', uploadUrl)
    const upstreamResp = await fetch(uploadUrl, { method: 'POST', body: form });
    console.log('[/api/wecom/webhook-upload] upstream status:', upstreamResp.status, upstreamResp.statusText)
    const text = await upstreamResp.text();
    console.log('[/api/wecom/webhook-upload] upstream raw body:', text)
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return res.status(upstreamResp.status).json(data);
  } catch (error) {
    console.error('[/api/wecom/webhook-upload] error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
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
