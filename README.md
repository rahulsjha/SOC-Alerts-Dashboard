# SOC Alerts Dashboard

A full-stack web application for Security Operations Center (SOC) analysts to triage and manage security alerts. Built with React, Express.js, and SQLite.

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation & Setup

#### Backend Setup
```bash
cd backend
npm install
npm run seed  # Generate mock alerts database
npm run dev   # Start development server (runs on port 5000)
```

#### Frontend Setup (in another terminal)
```bash
cd frontend
npm install
npm run dev   # Start dev server (runs on port 3000)
```

#### Access the Application
- **URL**: http://localhost:3000
- **Login**: analyst@company.com / Alert123!

## Architecture

### Technology Stack

**Frontend:**
- React 18 - UI framework
- Vite - Build tool & dev server
- React Router - Client-side routing
- Tailwind CSS - Utility-first styling
- Axios - HTTP client

**Backend:**
- Node.js + Express - REST API framework
- SQLite3 - Lightweight database
- JWT + Cookies - Authentication
- bcryptjs - Password hashing

**Data:**
- ~1000 generated mock alerts with realistic distributions
- Emphasis on longer tail of low/info severity, handful of criticals
- Mix of categories, sources, and timestamps across 30 days

### Key Design Decisions

1. **SQLite over external DB** - Simplifies deployment, no service setup needed, file-based persistence
2. **JWT + httpOnly Cookies** - Secure token storage, CSRF protection, standard approach
3. **Vite over Create React App** - Faster builds, faster HMR, modern tooling
4. **Tailwind CSS** - Rapid UI development, consistent design system
5. **Simple mock data generator** - Intentionally generates realistic alert distributions rather than completely random data

### API Endpoints

**Authentication:**
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Clear session
- `GET /auth/me` - Verify token

**Alerts (all require authentication):**
- `GET /alerts` - List alerts with pagination, filtering, sorting
  - Query params: `page`, `limit`, `severity`, `status`, `category`, `sortBy`, `sortOrder`, `startDate`, `endDate`
- `GET /alerts/:id` - Get single alert details
- `PATCH /alerts/:id` - Update alert (status, severity, assignee)
- `GET /alerts/stats/dashboard` - Aggregated statistics

## Features

### Dashboard
- Real-time aggregated stats (total, by severity, by category, by status)
- Visual breakdown with progress bars
- Clickable tiles to filter alerts list
- Key metrics cards

### Alerts List
- Table view with key fields (title, severity, status, category, asset, timestamp)
- Multi-field filtering (severity, status, category, time range)
- Pagination (20 alerts per page)
- Sortable by timestamp and severity
- Quick links to alert details

### Alert Detail
- Full alert information display
- Editable status and severity
- Quick action buttons (Dismiss, Start Investigating)
- Raw event JSON viewer
- Persistent updates (changes saved to database)

### Authentication
- Simple login screen
- Session management
- Protected routes (redirect to login if not authenticated)
- Logout functionality

## Data Generation

The mock data generator (`scripts/seedData.js`) creates ~1000 alerts with:
- **Severity distribution**: 5% critical, 10% high, 20% medium, 30% low, 35% info
- **Status distribution**: 40% new, 20% investigating, 25% resolved, 15% false_positive
- **Categories**: Evenly distributed across 6 types (malware, phishing, etc.)
- **Sources**: Mix of 6 common detection systems
- **Timestamps**: Spread across last 30 days
- **Realistic raw event data**: Mock JSON with IP addresses, protocols, process names

## Deployment

### Backend Deployment (Render/Railway/Fly)
```bash
# Backend environment variables needed:
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=<strong-random-secret>
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Frontend environment variables needed:
VITE_API_URL=https://your-backend-domain.com
```

## Project Structure

```
take-home/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server setup
│   │   ├── db.js             # Database initialization
│   │   ├── auth.js           # JWT utilities & middleware
│   │   └── routes/
│   │       ├── auth.js       # Login/logout endpoints
│   │       └── alerts.js     # Alerts CRUD endpoints
│   ├── scripts/
│   │   └── seedData.js       # Mock data generator
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Main app component
│   │   ├── api.js            # Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── components/
│   │   │   └── Layout.jsx    # Header/nav layout
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AlertsListPage.jsx
│   │   │   └── AlertDetailPage.jsx
│   │   └── index.css         # Tailwind imports
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
├── scripts/
│   └── seedData.js
├── .gitignore
└── README.md
```

## Development Notes

### Adding New Alerts
The database is seeded once. To add more alerts, modify `scripts/seedData.js` and re-run `npm run seed`.

### Modifying Alert Fields
Update the database schema in `backend/src/db.js`, then update the API routes and frontend components accordingly.

### Performance
- Database indexes on common query fields (timestamp, severity, status, category)
- Pagination to limit data transfer
- Lazy loading of alert details

## What Could Be Improved (with more time)

1. **Real-time Updates** - WebSocket connection for live alert streaming
2. **Saved Filters** - Store user-defined filter presets
3. **Bulk Actions** - Select multiple alerts for batch operations
4. **Timeline Chart** - Alerts over time visualization
5. **User Preferences** - Customizable alert groupings, assignees, categories
6. **Advanced Search** - Full-text search on descriptions
7. **Export** - CSV/PDF export of filtered alerts
8. **Unit Tests** - Jest for backend, Vitest for frontend
9. **Integration Tests** - TestContainers for database testing
10. **CI/CD** - GitHub Actions for automated testing and deployment
11. **Error Handling** - Better error messages and logging
12. **Rate Limiting** - API rate limiting for security
13. **Audit Logging** - Track all changes to alerts
14. **Multi-user Support** - Proper user roles and permissions

## Testing

To manually test the application:

1. **Login Flow**
   - Try invalid credentials (should show error)
   - Login with correct credentials
   - Verify redirect to dashboard

2. **Dashboard**
   - Click on severity/category/status tiles
   - Verify alerts list filters accordingly

3. **Alerts List**
   - Test each filter dropdown
   - Test pagination
   - Click "View" to go to detail

4. **Alert Detail**
   - Modify status/severity and refresh page
   - Verify changes persisted
   - Test dismiss functionality

## Technical Achievements

✅ Full CRUD API with proper authentication
✅ Responsive UI with Tailwind CSS  
✅ Efficient database queries with indexing
✅ RESTful API design
✅ Session management with JWT
✅ Real-world alert data generation
✅ Clean code structure and organization
✅ Proper separation of concerns (frontend/backend)
✅ Professional UI/UX with attention to detail
✅ Accessible color coding and visual hierarchy

## Troubleshooting

**Port already in use?**
```bash
# Backend
lsof -i :5000
kill -9 <PID>

# Frontend
lsof -i :3000
kill -9 <PID>
```

**Database errors?**
```bash
# Delete the old database and regenerate
rm backend/alerts.db
cd backend && npm run seed
```

**CORS errors?**
Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL.

## License

MIT
# SOC-Alerts-Dashboard
