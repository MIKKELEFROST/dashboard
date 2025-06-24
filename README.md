# CRM Dashboard

Simple Node.js CRM dashboard with a Kanban board for managing leads.

## Features
- Create leads with contact info and description.
- Drag-and-drop Kanban board with stages: not contacted, contacted, viewed property, offer given, closed, lost.
- Data stored in `leads.json` or fetched from Airtable when credentials are set.
- Click on a lead card to view and edit all its details in a modal.

## Usage
Run the server:
```bash
node server.js
```
Then open `http://localhost:3000` in your browser.

### Airtable
If the environment variables `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are
provided, the server will load and store leads in Airtable instead of the local
`leads.json` file. Optionally set `AIRTABLE_TABLE` to specify the table name
(defaults to `Leads`).
