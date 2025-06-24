const http = require('http');
const fs = require('fs');
const path = require('path');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Leads';

const DATA_FILE = path.join(__dirname, 'leads.json');

async function loadLocalLeads() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLocalLeads(leads) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
}

async function fetchAirtableLeads() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
  });
  const data = await res.json();
  return (data.records || []).map(r => ({ id: r.id, ...r.fields }));
}

async function createAirtableLead(fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  const data = await res.json();
  return { id: data.id, ...data.fields };
}

async function updateAirtableLead(id, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  const data = await res.json();
  return { id: data.id, ...data.fields };
}

async function loadLeads() {
  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) return fetchAirtableLeads();
  return loadLocalLeads();
}

async function saveLead(lead) {
  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) return createAirtableLead(lead);
  const leads = await loadLocalLeads();
  lead.id = Date.now().toString();
  leads.push(lead);
  saveLocalLeads(leads);
  return lead;
}

async function updateLead(id, data) {
  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) return updateAirtableLead(id, data);
  const leads = await loadLocalLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...data };
    saveLocalLeads(leads);
    return leads[idx];
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/leads') {
    const leads = await loadLeads();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(leads));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/leads') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const lead = JSON.parse(body);
      const saved = await saveLead(lead);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(saved));
    });
    return;
  }

  if (req.method === 'PUT' && req.url.startsWith('/api/leads/')) {
    const id = req.url.split('/').pop();
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const update = JSON.parse(body);
      const result = await updateLead(id, update);
      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
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
