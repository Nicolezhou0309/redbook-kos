function handler(req, res) {
  res.json({ 
    message: 'Basic JS API working!',
    timestamp: new Date().toISOString()
  });
}

module.exports = handler; 