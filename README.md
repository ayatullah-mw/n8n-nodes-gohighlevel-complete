# n8n-nodes-gohighlevel

> An n8n Community Node for the [GoHighLevel](https://www.gohighlevel.com/) CRM API v2.

Automate your GoHighLevel workflows directly from n8n — manage contacts, pipeline opportunities, calendars, appointments, and automation workflows without writing a single line of code.

---

## 📦 Installation

### Via n8n Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-gohighlevel-complete`
5. Click **Install** and restart n8n

### Manual Installation

```bash
npm install n8n-nodes-gohighlevel-complete
```

Then restart your n8n instance.

---

## 🔐 Authentication Setup

This node uses the **GoHighLevel API v2** with Bearer token authentication.

### Step 1 — Generate your API Key

1. Log in to GoHighLevel
2. Navigate to **Settings → API Keys**
3. Click **Create New Key**
4. Copy the generated key

### Step 2 — Add Credentials in n8n

1. Open n8n and go to **Credentials**
2. Click **Add Credential**
3. Search for **GoHighLevel API**
4. Fill in:
   - **API Key** — paste the key from Step 1
   - **Location ID** _(optional)_ — your Sub-Account ID (found in Settings → Business Info). If set, it will be used as the default for all operations unless overridden per-node.

---

## 🗂️ Supported Resources & Operations

### Contacts

| Operation  | Description                         |
| ---------- | ----------------------------------- |
| **Create** | Create a new CRM contact            |
| **Get**    | Retrieve a contact by ID            |
| **Update** | Update contact fields               |
| **Delete** | Delete a contact by ID              |
| **Search** | Search contacts by name/email/phone |

**Available fields:** First Name, Last Name, Email, Phone, Company Name, Location ID, Tags (comma-separated), Address, City, State, Country, Postal Code, Website, Date of Birth, DND, Source

---

### Opportunities

| Operation  | Description                       |
| ---------- | --------------------------------- |
| **Create** | Create a deal in a pipeline stage |
| **Get**    | Retrieve an opportunity by ID     |
| **Update** | Update status, stage, or value    |
| **List**   | List opportunities in a pipeline  |
| **Delete** | Delete an opportunity by ID       |

**Dynamic Dropdowns:**

- 🔽 **Pipeline** — loads all pipelines for your location
- 🔽 **Stage** — auto-updates based on selected pipeline

---

### Calendars & Appointments

| Operation              | Description                      |
| ---------------------- | -------------------------------- |
| **List Calendars**     | List all calendars in a location |
| **Create Appointment** | Book a new appointment           |
| **Get Appointment**    | Retrieve an appointment by ID    |
| **Update Appointment** | Change status, time, or notes    |
| **Delete Appointment** | Remove an appointment            |

**Dynamic Dropdowns:**

- 🔽 **Calendar** — loads all available calendars

---

### Workflows

| Operation               | Description                      |
| ----------------------- | -------------------------------- |
| **List**                | List all published workflows     |
| **Trigger for Contact** | Enroll a contact into a workflow |

**Dynamic Dropdowns:**

- 🔽 **Workflow** — loads all published workflows

---

## 📋 Example Workflows

### 1. Sync New Leads from Webhooks → GoHighLevel Contacts

```
Webhook trigger → GoHighLevel (Create Contact)
```

Set up a webhook in n8n, map the incoming fields (name, email, phone) to GoHighLevel contact fields, and automatically create contacts for every new lead.

### 2. Move Deals Through Pipeline on Payment

```
Stripe (Payment Received) → GoHighLevel (Update Opportunity: status=won)
```

When a Stripe payment webhook fires, look up the GoHighLevel opportunity and mark it as **Won**.

### 3. Book Appointments from Typeform

```
Typeform trigger → GoHighLevel (Search Contact) → GoHighLevel (Create Appointment)
```

When a Typeform submission arrives with meeting preference data, find or create the contact, then book the appointment on the appropriate calendar.

### 4. Enroll Contacts in Workflows After Event

```
GoHighLevel (Get Contact) → GoHighLevel (Trigger Workflow)
```

After creating or updating a contact, automatically enroll them in a GoHighLevel automation workflow.

---

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/your-org/n8n-nodes-gohighlevel.git
cd n8n-nodes-gohighlevel
npm install
```

### Build

```bash
npm run build
```

Output is placed in `dist/`. The compiled JavaScript is what n8n loads.

### Watch Mode (Development)

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Test Coverage Report

```bash
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lintfix   # auto-fix where possible
```

### Format

```bash
npm run format
```

---

## 📂 Project Structure

```
n8n-nodes-gohighlevel/
├── credentials/
│   └── GoHighLevelApi.credentials.ts   # API Key + Location ID credential
├── nodes/
│   └── GoHighLevel/
│       ├── GoHighLevel.node.ts         # Main node (routing, loadOptions, execute)
│       ├── GenericFunctions.ts         # HTTP helpers, pagination, error handling
│       ├── GoHighLevel.svg             # Node icon
│       └── descriptions/
│           ├── ContactDescription.ts
│           ├── OpportunityDescription.ts
│           ├── CalendarDescription.ts
│           └── WorkflowDescription.ts
├── test/
│   ├── __mocks__/n8n-workflow.ts       # Jest mock for n8n-workflow
│   ├── genericFunctions.test.ts
│   └── resources/
│       ├── contact.test.ts
│       ├── opportunity.test.ts
│       ├── calendar.test.ts
│       └── workflow.test.ts
├── index.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## 🌐 API Reference

This node targets the **GoHighLevel REST API v2**:

- **Base URL:** `https://services.leadconnectorhq.com`
- **Auth:** `Authorization: Bearer <API_KEY>`
- **Version Header:** `Version: 2021-07-28`

Full API docs: https://highlevel.stoplight.io/docs/integrations

---

## ❗ Error Handling

The node handles GoHighLevel API errors gracefully and surfaces friendly messages in n8n:

| HTTP Status | Meaning      | n8n Message                                       |
| ----------- | ------------ | ------------------------------------------------- |
| 401         | Unauthorized | Check your API Key in credentials                 |
| 403         | Forbidden    | Insufficient key permissions or wrong Location ID |
| 404         | Not Found    | The requested resource does not exist             |
| 429         | Rate Limited | Use n8n's "Retry on Fail" option                  |
| 5xx         | Server Error | GoHighLevel API internal error                    |

Enable **Continue on Fail** in the node settings to process remaining items if one fails.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run `npm run lint && npm test`
5. Open a Pull Request

---

## 📄 License

MIT © 2024 — See [LICENSE](LICENSE) for details.
