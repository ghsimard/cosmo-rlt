const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const serveStatic = require('serve-static');
require('dotenv').config();

// Initialize database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
    // Test the rectores table
    client.query('SELECT COUNT(*) FROM rectores', (err, result) => {
      if (err) {
        console.error('Error querying rectores table:', err);
      } else {
        console.log('Number of records in rectores table:', result.rows[0].count);
      }
      release();
    });
  }
});

const app = express();
const port = process.env.PORT || 3000;

// Enable compression
app.use(compression());

// MIME type middleware - must be before other middleware
app.use((req, res, next) => {
  const url = req.url;
  if (url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
    next();
  });
}

// Cache control middleware
const cacheControl = (req, res, next) => {
  // Cache static assets for 1 day
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
};

app.use(cacheControl);

// Public test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Access tokens - simplified to avoid special characters
const ACCESS_TOKENS = {
  'docentes': process.env.DOCENTES_TOKEN || 'cosmo-doc-o185zfu2c-5xotms',
  'acudientes': process.env.ACUDIENTES_TOKEN || 'cosmo-acu-js4n5cy8ar-f0uax8',
  'estudiantes': process.env.ESTUDIANTES_TOKEN || 'cosmo-est-o7lmi20mfwb-o9f06j'
};

// MIME type helper
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Serve static files for each app
const serveApp = (basePath, buildDir) => {
  // Serve static files
  app.use(basePath, express.static(path.join(__dirname, buildDir), {
    setHeaders: (res, filePath) => {
      const contentType = getMimeType(filePath);
      res.setHeader('Content-Type', contentType);
      console.log(`Serving ${filePath} with content type ${contentType}`);
    }
  }));

  // Handle client-side routing
  app.get(`${basePath}/*`, (req, res) => {
    const indexPath = path.join(__dirname, buildDir, 'index.html');
    console.log(`Serving index.html from ${indexPath}`);
    res.sendFile(indexPath);
  });
};

// Debug middleware - add this before the app routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Serve each application
serveApp('/docentes/cosmo-doc-o185zfu2c-5xotms', 'form-docentes/build');
serveApp('/acudientes/cosmo-acu-js4n5cy8ar-f0uax8', 'form-acudientes/build');
serveApp('/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j', 'form-estudiantes/build');

// Serve static files from public directory
app.use('/static', express.static(path.join(__dirname, 'form-docentes/build/static'), {
  setHeaders: (res, filePath) => {
    const contentType = getMimeType(filePath);
    res.setHeader('Content-Type', contentType);
    console.log(`Serving static file ${filePath} with content type ${contentType}`);
  }
}));

// Serve images
app.use('/images', express.static(path.join(__dirname, 'form-docentes/build'), {
  setHeaders: (res, filePath) => {
    const contentType = getMimeType(filePath);
    res.setHeader('Content-Type', contentType);
    console.log(`Serving image ${filePath} with content type ${contentType}`);
  }
}));

// Serve images directly with error handling
app.get('/rectores.jpeg', (req, res) => {
  const filePath = path.join(__dirname, 'form-docentes/public/rectores.jpeg');
  console.log('Serving rectores.jpeg from:', filePath);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending rectores.jpeg:', err);
        res.status(500).send('Error serving image');
      }
    });
  } else {
    console.error('rectores.jpeg not found at:', filePath);
    res.status(404).send('Image not found');
  }
});

app.get('/coordinadores.jpeg', (req, res) => {
  const filePath = path.join(__dirname, 'form-docentes/public/coordinadores.jpeg');
  console.log('Serving coordinadores.jpeg from:', filePath);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending coordinadores.jpeg:', err);
        res.status(500).send('Error serving image');
      }
    });
  } else {
    console.error('coordinadores.jpeg not found at:', filePath);
    res.status(404).send('Image not found');
  }
});

// Serve manifest.json with error handling
app.get('/manifest.json', (req, res) => {
  const filePath = path.join(__dirname, 'form-docentes/public/manifest.json');
  console.log('Serving manifest.json from:', filePath);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending manifest.json:', err);
        res.status(500).send('Error serving manifest');
      }
    });
  } else {
    console.error('manifest.json not found at:', filePath);
    res.status(404).send('Manifest not found');
  }
});

// Catch-all for client-side routing in React apps
app.get('/:token', (req, res) => {
  const token = req.params.token;
  let appPath;
  
  if (token === ACCESS_TOKENS.docentes) {
    appPath = path.join(__dirname, 'form-docentes', 'build', 'index.html');
  } else if (token === ACCESS_TOKENS.acudientes) {
    appPath = path.join(__dirname, 'form-acudientes', 'build', 'index.html');
  } else if (token === ACCESS_TOKENS.estudiantes) {
    appPath = path.join(__dirname, 'form-estudiantes', 'build', 'index.html');
  } else {
    return res.status(403).send('Access Denied: Invalid Token');
  }
  
  safeServeStaticFile(appPath, null, 'text/html', res);
});

// Serve COSMO logo
app.get('/images/LogoCosmo.png', (req, res) => {
  const filePath = path.join(__dirname, 'public/images/LogoCosmo.png');
  console.log('Serving LogoCosmo.png from:', filePath);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending LogoCosmo.png:', err);
        res.status(500).send('Error serving image');
      }
    });
  } else {
    console.error('LogoCosmo.png not found at:', filePath);
    res.status(404).send('Image not found');
  }
});

// Welcome page (root route)
app.get('/', (req, res) => {
  try {
    const links = Object.entries(ACCESS_TOKENS).map(([app, token]) => {
      const appName = app.charAt(0).toUpperCase() + app.slice(1);
      const descriptions = {
        docentes: "Formulario para docentes y personal educativo",
        acudientes: "Formulario para padres y acudientes",
        estudiantes: "Formulario para estudiantes"
      };
      return `
        <li>
          <a href="/${app}/${token}">
            <div class="app-card">
              <h3>${appName}</h3>
              <p>${descriptions[app]}</p>
              <span class="arrow">→</span>
            </div>
          </a>
        </li>`;
    }).join('\n');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Encuesta de Ambiente Escolar</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary-color: #2563eb;
              --primary-hover: #1d4ed8;
              --text-color: #1f2937;
              --text-light: #6b7280;
              --bg-color: #f3f4f6;
              --card-bg: #ffffff;
              --border-color: #e5e7eb;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body { 
              font-family: 'Inter', sans-serif;
              background-color: var(--bg-color);
              color: var(--text-color);
              line-height: 1.5;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
            }

            .container {
              max-width: 800px;
              width: 100%;
              margin: 0 auto;
              padding: 2.5rem;
              background-color: var(--card-bg);
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            }

            .header {
              text-align: center;
              margin-bottom: 3rem;
            }

            .logo { 
              max-width: 180px;
              height: auto;
              margin-bottom: 1.5rem;
            }

            h1 { 
              font-size: 2rem;
              font-weight: 700;
              color: var(--text-color);
              margin-bottom: 0.5rem;
            }

            .subtitle {
              color: var(--text-light);
              font-size: 1.25rem;
              font-weight: 500;
              margin-bottom: 2rem;
            }

            .app-list { 
              list-style: none;
              display: grid;
              gap: 1rem;
              margin: 0;
              padding: 0;
            }

            .app-list a {
              text-decoration: none;
              color: inherit;
              display: block;
            }

            .app-card {
              background-color: var(--card-bg);
              border: 1px solid var(--border-color);
              border-radius: 0.75rem;
              padding: 1.5rem;
              transition: all 0.2s ease;
              position: relative;
              overflow: hidden;
            }

            .app-card:hover {
              transform: translateY(-2px);
              border-color: var(--primary-color);
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            }

            .app-card h3 {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
              color: var(--primary-color);
            }

            .app-card p {
              color: var(--text-light);
              font-size: 0.875rem;
              margin-bottom: 1rem;
            }

            .arrow {
              position: absolute;
              right: 1.5rem;
              top: 50%;
              transform: translateY(-50%);
              font-size: 1.5rem;
              color: var(--primary-color);
              opacity: 0;
              transition: all 0.2s ease;
            }

            .app-card:hover .arrow {
              opacity: 1;
              right: 1.25rem;
            }

            @media (max-width: 640px) {
              body {
                padding: 1rem;
              }
              
              .container {
                padding: 1.5rem;
              }

              h1 {
                font-size: 1.5rem;
              }

              .subtitle {
                font-size: 1.125rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/images/LogoCosmo.png" alt="COSMO Logo" class="logo">
              <h1>Encuesta de Ambiente Escolar</h1>
              <p class="subtitle">Cuestionarios</p>
            </div>
            <ul class="app-list">
              ${links}
            </ul>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error serving welcome page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint for searching schools
app.get('/api/search-schools', handleSchoolSearch);
app.post('/api/search-schools', handleSchoolSearch);

// School search handler function
async function handleSchoolSearch(req, res) {
  try {
    const query = req.method === 'GET' ? req.query.q : req.body.q;
    console.log('Received search request with query:', query);
    
    if (!query) {
      console.log('No query provided, returning empty array');
      return res.json([]);
    }

    // First check if the table exists
    console.log('Checking if rectores table exists...');
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rectores')"
    );

    if (!tableCheck.rows[0].exists) {
      console.error('Table rectores does not exist');
      return res.status(500).json({ 
        error: 'Database configuration error',
        details: 'The rectores table does not exist'
      });
    }

    // Check if the column exists
    console.log('Checking if nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ column exists...');
    const columnCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'rectores' AND column_name = 'nombre_de_la_institucion_educativa_en_la_actualmente_desempena_')"
    );

    if (!columnCheck.rows[0].exists) {
      console.error('Column nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ does not exist in rectores table');
      return res.status(500).json({ 
        error: 'Database configuration error',
        details: 'The nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ column does not exist in the rectores table'
      });
    }

    // Query the rectores table for matching schools
    console.log('Executing search query with:', query);
    const result = await pool.query(
      'SELECT DISTINCT nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ FROM rectores WHERE LOWER(nombre_de_la_institucion_educativa_en_la_actualmente_desempena_) LIKE LOWER($1) ORDER BY nombre_de_la_institucion_educativa_en_la_actualmente_desempena_',
      [`%${query}%`]
    );

    console.log('Query result:', result.rows);

    // Extract school names from the result
    const schools = result.rows.map(row => row.nombre_de_la_institucion_educativa_en_la_actualmente_desempena_);
    console.log('Returning schools:', schools);
    res.json(schools);
  } catch (error) {
    console.error('Detailed error in search-schools:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      where: error.where
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code,
      hint: error.hint
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).send('Internal Server Error');
});

// Start the server with proper error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Current working directory:', process.cwd());
  console.log('Build directories:');
  console.log('- Docentes:', path.join(__dirname, 'form-docentes/build'));
  console.log('- Acudientes:', path.join(__dirname, 'form-acudientes/build'));
  console.log('- Estudiantes:', path.join(__dirname, 'form-estudiantes/build'));
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Define the frequency rating mappings
const frequencyMappings = {
  comunicacion: {
    title: "COMUNICACIÓN",
    items: [
      {
        displayText: "Los docentes tienen la disposición de dialogar con las familias sobre los aprendizajes de los estudiantes en espacios adicionales a la entrega de notas.",
        questionMappings: {
          docentes: "Tengo la disposición de dialogar con los acudientes sobre los aprendizajes de los estudiantes en momentos adicionales a la entrega de notas.",
          estudiantes: "Mis profesores están dispuestos a hablar con mis acudientes sobre cómo me está yendo en el colegio, en momentos diferentes a la entrega de notas.",
          acudientes: "Los profesores tienen la disposición para hablar conmigo sobre los aprendizajes de los estudiantes en momentos adicionales a la entrega de notas."
        }
      },
      {
        displayText: "Los docentes promueven el apoyo de las familias a los estudiantes por medio de actividades para hacer en casa.",
        questionMappings: {
          docentes: "Promuevo el apoyo de los acudientes al aprendizaje de los estudiantes, a través de actividades académicas y lúdicas para realizar en espacios fuera de la institución educativa.",
          estudiantes: "Mis profesores me dejan actividades para hacer en casa, las cuales necesitan el apoyo de mis acudientes.",
          acudientes: "Los profesores promueven actividades para que apoye en su proceso de aprendizaje a los estudiantes que tengo a cargo."
        }
      }
    ]
  },
  practicas_pedagogicas: {
    title: "PRÁCTICAS PEDAGÓGICAS",
    items: [
      {
        displayText: "Los intereses y las necesidades de los estudiantes son tenidos en cuenta en la planeación de las clases.",
        questionMappings: {
          docentes: "Cuando preparo mis clases tengo en cuenta los intereses y necesidades de los estudiantes.",
          estudiantes: "Los profesores tienen en cuenta mis intereses y afinidades para escoger lo que vamos a hacer en clase.",
          acudientes: "Los profesores tienen en cuenta los intereses y necesidades de los estudiantes para escoger los temas que se van a tratar en clase."
        }
      }
    ]
  },
  convivencia: {
    title: "CONVIVENCIA",
    items: [
      {
        displayText: "Todos los estudiantes son tratados con respeto independiente de sus creencias religiosas, género, orientación sexual, etnia y capacidades o talentos.",
        questionMappings: {
          docentes: "En el colegio mis estudiantes son tratados con respeto, independiente de sus creencias religiosas, género, orientación sexual, grupo étnico y capacidades o talentos de los demás.",
          estudiantes: "En el colegio mis compañeros y yo somos tratados con respeto sin importar nuestras creencias religiosas, género, orientación sexual, grupo étnico y capacidades o talentos.",
          acudientes: "En el colegio los estudiantes son respetuosos y solidarios entre ellos, comprendiendo y aceptando las creencias religiosas, el género, la orientación sexual, el grupo étnico y las capacidades o talentos de los demás."
        }
      }
    ]
  }
};

// Calculate frequency percentages for a specific question
async function calculateFrequency(tableName, question, sectionColumn, school) {
  if (!question || question === 'NA') {
    return { S: 0, A: 0, N: 0 };
  }

  try {
    console.log(`Calculating frequency for ${tableName}, question: "${question}", column: ${sectionColumn}${school ? `, school: ${school}` : ''}`);
    
    let query = `
      SELECT 
        jsonb_extract_path_text(${sectionColumn}, $1) as rating,
        COUNT(*) as count
      FROM ${tableName}
      WHERE jsonb_extract_path_text(${sectionColumn}, $1) IS NOT NULL
    `;

    if (school) {
      query += ` AND institucion_educativa = $2`;
    }

    query += ` GROUP BY rating`;

    const params = [question];
    if (school) {
      params.push(school);
    }

    const result = await pool.query(query, params);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const frequencies = {
      S: 0,
      A: 0,
      N: 0
    };

    result.rows.forEach(row => {
      if (row.rating && frequencies.hasOwnProperty(row.rating)) {
        frequencies[row.rating] = (parseInt(row.count) / total) * 100;
      }
    });

    return frequencies;
  } catch (error) {
    console.error('Error calculating frequency:', error);
    return { S: 0, A: 0, N: 0 };
  }
}