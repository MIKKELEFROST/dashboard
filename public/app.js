let leadsData = [];

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
  card.addEventListener('click', () => openLeadModal(lead));
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
  leadsData = await fetchLeads();
  renderBoard(leadsData);
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

function openLeadModal(lead) {
  const modal = document.getElementById('lead-modal');
  const form = document.getElementById('lead-details-form');
  form.dataset.id = lead.id;
  form.name.value = lead.name || '';
  form.email.value = lead.email || '';
  form.phone.value = lead.phone || '';
  form.street.value = lead.street || '';
  form.city.value = lead.city || '';
  form.postcode.value = lead.postcode || '';
  form.description.value = lead.description || '';
  form.offerPrice.value = lead.offerPrice || '';
  modal.classList.remove('hidden');
}

function closeLeadModal() {
  document.getElementById('lead-modal').classList.add('hidden');
}

document.getElementById('close-modal').addEventListener('click', closeLeadModal);

document.getElementById('lead-details-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = e.target.dataset.id;
  const data = Object.fromEntries(new FormData(e.target).entries());
  await fetch('/api/leads/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  closeLeadModal();
  load();
});

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
