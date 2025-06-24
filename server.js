const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'leads.json');

function loadLeads() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLeads(leads) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/leads') {
    const leads = loadLeads();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(leads));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/leads') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const lead = JSON.parse(body);
      const leads = loadLeads();
      lead.id = Date.now().toString();
      leads.push(lead);
      saveLeads(leads);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lead));
    });
    return;
  }

  if (req.method === 'PUT' && req.url.startsWith('/api/leads/')) {
    const id = req.url.split('/').pop();
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const update = JSON.parse(body);
      const leads = loadLeads();
      const idx = leads.findIndex(l => l.id === id);
      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...update };
        saveLeads(leads);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leads[idx]));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    return;
  }

  // serve static files
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const map = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' });
    res.end(content);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
