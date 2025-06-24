async function fetchLeads() {
  const res = await fetch('/api/leads');
  return await res.json();
}

function createCard(lead) {
  const card = document.createElement('div');
  card.className = 'card';
  card.draggable = true;
  card.dataset.id = lead.id;
  card.innerHTML = `<strong>${lead.name}</strong><br>${lead.email}<br>${lead.phone}`;
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('id', lead.id);
  });
  return card;
}

function renderBoard(leads) {
  document.querySelectorAll('.cards').forEach(c => c.innerHTML = '');
  leads.forEach(l => {
    const column = document.getElementById(l.status || 'not-contacted');
    if (column) column.appendChild(createCard(l));
  });
}

async function load() {
  const leads = await fetchLeads();
  renderBoard(leads);
}

function setupDropZones() {
  document.querySelectorAll('.cards').forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', async e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('id');
      const status = zone.id;
      await fetch('/api/leads/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      load();
    });
  });
}

document.getElementById('lead-form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.status = 'not-contacted';
  await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  e.target.reset();
  load();
});

setupDropZones();
load();
