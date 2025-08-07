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

app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
});
