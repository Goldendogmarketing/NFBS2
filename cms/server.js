const express = require('express');
const session = require('express-session');
const path = require('path');
const { initialize } = require('./db');
const { router: authRouter } = require('./auth');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nfbs-local-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Serve the static site from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use(authRouter);
app.use(apiRouter);

// Initialize database and start server
initialize();

app.listen(PORT, () => {
  console.log('');
  console.log('  NFBS CMS running at http://localhost:' + PORT);
  console.log('  Admin panel:  http://localhost:' + PORT + '/admin');
  console.log('  Website:      http://localhost:' + PORT + '/index.html');
  console.log('');
  console.log('  Default login: admin / changeme');
  console.log('');
});
