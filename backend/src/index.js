import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import { autoSeedIfEmpty } from './utils/autoSeed.js';
import { createApp } from './app.js';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

// Initialize database, auto-seed if empty, then start server
initializeDatabase()
  .then(() => autoSeedIfEmpty())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
