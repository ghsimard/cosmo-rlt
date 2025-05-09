const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:*',
    'https://*.onrender.com',
    'https://cosmorlt.onrender.com',
    'https://cosmorlt.onrender.com/docentes/*',
    'https://cosmorlt.onrender.com/acudientes/*',
    'https://cosmorlt.onrender.com/estudiantes/*'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "connect-src 'self' http://localhost:* https://*.onrender.com https://cosmorlt.onrender.com https://cosmorlt.onrender.com/docentes/* https://cosmorlt.onrender.com/acudientes/* https://cosmorlt.onrender.com/estudiantes/* https://cosmorlt.onrender.com/api/*; " +
      "img-src 'self' data: https:; " +
      "style-src 'self' 'unsafe-inline'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "object-src 'none';"
    );
    next();
  });
} else {
  // More permissive CSP for development
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' http://localhost:*; " +
      "connect-src 'self' http://localhost:* https://*.onrender.com https://cosmorlt.onrender.com https://cosmorlt.onrender.com/docentes/* https://cosmorlt.onrender.com/acudientes/* https://cosmorlt.onrender.com/estudiantes/* https://cosmorlt.onrender.com/api/*; " +
      "img-src 'self' data: https:; " +
      "style-src 'self' 'unsafe-inline'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "object-src 'none';"
    );
    next();
  });
}

// Public test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
  });
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Serve static files for each form application
const serveStaticWithMime = (basePath, directory) => {
  return (req, res, next) => {
    const filePath = path.join(__dirname, directory, req.path);
    console.log('Serving static file:', filePath);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log('File not found:', filePath);
        return next();
      }

      // Set appropriate MIME type
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case '.js':
          res.setHeader('Content-Type', 'application/javascript');
          break;
        case '.css':
          res.setHeader('Content-Type', 'text/css');
          break;
        case '.html':
          res.setHeader('Content-Type', 'text/html');
          break;
        case '.json':
          res.setHeader('Content-Type', 'application/json');
          break;
        case '.png':
          res.setHeader('Content-Type', 'image/png');
          break;
        case '.jpg':
        case '.jpeg':
          res.setHeader('Content-Type', 'image/jpeg');
          break;
        case '.svg':
          res.setHeader('Content-Type', 'image/svg+xml');
          break;
        case '.woff':
          res.setHeader('Content-Type', 'font/woff');
          break;
        case '.woff2':
          res.setHeader('Content-Type', 'font/woff2');
          break;
        case '.ttf':
          res.setHeader('Content-Type', 'font/ttf');
          break;
        case '.otf':
          res.setHeader('Content-Type', 'font/otf');
          break;
        default:
          res.setHeader('Content-Type', 'application/octet-stream');
      }

      // Stream the file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  };
};

// Serve static files for each form application
app.use('/docentes/cosmo-doc-o185zfu2c-5xotms', serveStaticWithMime('/docentes/cosmo-doc-o185zfu2c-5xotms', 'form-docentes/build'));
app.use('/acudientes/cosmo-acu-js4n5cy8ar-f0uax8', serveStaticWithMime('/acudientes/cosmo-acu-js4n5cy8ar-f0uax8', 'form-acudientes/build'));
app.use('/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j', serveStaticWithMime('/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j', 'form-estudiantes/build'));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve special image files
app.get('/rectores.jpeg', (req, res) => {
  const imagePath = path.join(__dirname, 'form-docentes', 'public', 'rectores.jpeg');
  res.sendFile(imagePath, {
    headers: {
      'Content-Type': 'image/jpeg'
    }
  });
});

app.get('/coordinadores.jpeg', (req, res) => {
  const imagePath = path.join(__dirname, 'form-docentes', 'public', 'coordinadores.jpeg');
  res.sendFile(imagePath, {
    headers: {
      'Content-Type': 'image/jpeg'
    }
  });
});

// API routes
app.get('/api/search-schools', async (req, res) => {
  console.log('GET /api/search-schools requested');
  console.log('Query parameters:', req.query);
  console.log('Request headers:', req.headers);
  
  const query = req.query.q;
  if (!query || query.length < 3) {
    console.log('Query too short or missing, returning empty array');
    return res.json([]);
  }

  try {
    if (pool && !useMockData) {
      // Query the rectores table using the correct column name
      console.log('Searching in database for:', query);
      const result = await pool.query(
        `SELECT DISTINCT nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ as name 
         FROM rectores 
         WHERE nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ ILIKE $1 
         ORDER BY nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ 
         LIMIT 10`,
        [`%${query}%`]
      );
      console.log('Database search results:', result.rows);
      res.json(result.rows.map(row => row.name));
    } else {
      // Mock data for testing when no database is available
      console.log('Using mock data, filtering for:', query);
      const filtered = mockSchools.filter(name => 
        name.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Mock data results:', filtered);
      res.json(filtered);
    }
  } catch (error) {
    console.error('Error searching schools:', error);
    console.error('Error details:', error.message);
    res.status(500).json([]);
  }
});

app.post('/api/search-schools', async (req, res) => {
  console.log('POST /api/search-schools requested');
  console.log('Body:', req.body);
  
  const query = req.body?.q || '';
  if (!query || query.length < 3) {
    return res.json([]);
  }

  try {
    if (pool && !useMockData) {
      // Query the rectores table using the correct column name
      console.log('Searching in database for:', query);
      const result = await pool.query(
        `SELECT DISTINCT nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ as name 
         FROM rectores 
         WHERE nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ ILIKE $1 
         ORDER BY nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ 
         LIMIT 10`,
        [`%${query}%`]
      );
      console.log('Database search results:', result.rows);
      res.json(result.rows.map(row => row.name));
    } else {
      // Mock data for testing when no database is available
      console.log('Using mock data, filtering for:', query);
      const filtered = mockSchools.filter(name => 
        name.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Mock data results:', filtered);
      res.json(filtered);
    }
  } catch (error) {
    console.error('Error searching schools:', error);
    console.error('Error details:', error.message);
    res.status(500).json([]);
  }
});

app.post('/api/submit-form', async (req, res) => {
  // Determine which form app based on the referer
  const referer = req.headers.referer || '';
  let targetApp = 'docentes'; // Default
  
  for (const app of Object.keys(ACCESS_TOKENS)) {
    if (referer.includes(`/${app}/`)) {
      targetApp = app;
      break;
    }
  }
  
  console.log(`Form submission for ${targetApp} application`);
  
  try {
    // Get the form data
    const formData = req.body;
    
    // CRITICAL FIX: Ensure schedule is always handled correctly
    if (formData.schedule !== undefined) {
      // For estudiantes, keep schedule as a string
      if (targetApp === 'estudiantes') {
        console.log('Estudiantes form - keeping schedule as string:', formData.schedule);
      } else if (!Array.isArray(formData.schedule)) {
        console.log('Converting schedule to array:', formData.schedule);
        
        // If it's a string, try to convert it to an array
        if (typeof formData.schedule === 'string') {
          try {
            const parsedSchedule = JSON.parse(formData.schedule);
            if (Array.isArray(parsedSchedule)) {
              formData.schedule = parsedSchedule;
            } else {
              formData.schedule = [formData.schedule];
            }
          } catch (e) {
            // If parsing fails, treat it as a single item
            formData.schedule = [formData.schedule];
          }
        } else if (formData.schedule === null) {
          formData.schedule = [];
        } else {
          // For any other type, convert to array with the value
          formData.schedule = [String(formData.schedule)];
        }
      }
    } else {
      // If schedule is missing for estudiantes, leave it undefined
      if (targetApp !== 'estudiantes') {
        console.log('Schedule field is missing, adding empty array');
        formData.schedule = [];
      }
    }
    
    if (pool) {
      console.log('Preparing to save form data to database...');
      
      // Each form type has a different table structure
      if (targetApp === 'docentes') {
        // For docentes form, use the specific column structure
        console.log('Using specific column mapping for docentes form');
        
        const query = `
          INSERT INTO docentes_form_submissions (
            institucion_educativa, 
            anos_como_docente, 
            grados_asignados, 
            jornada, 
            retroalimentacion_de, 
            comunicacion, 
            practicas_pedagogicas, 
            convivencia
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING id
        `;
        
        // Combine early and late grades
        const allGrades = [
          ...(formData.teachingGradesEarly || []), 
          ...(formData.teachingGradesLate || [])
        ];
        
        const result = await pool.query(query, [
          formData.schoolName,
          formData.yearsOfExperience,
          allGrades,
          formData.schedule,
          formData.feedbackSources,
          formData.comunicacion,
          formData.practicas_pedagogicas,
          formData.convivencia
        ]);
        
        console.log(`Form saved to database with ID: ${result.rows[0].id}`);
        res.json({ success: true, id: result.rows[0].id });
      } 
      else if (targetApp === 'estudiantes') {
        // For estudiantes form, use the specific column structure 
        console.log('Using specific column mapping for estudiantes form');
        console.log('Form data fields:', Object.keys(formData));
        
        // Field mapping based on the actual form fields observed in logs
        // The form uses yearsOfExperience for anos_estudiando
        // For grado_actual, use the first grade in teachingGradesLate or a default
        let gradoActual = 'No especificado';
        if (formData.teachingGradesLate && formData.teachingGradesLate.length > 0) {
          gradoActual = formData.teachingGradesLate[0];
        }
        
        // Make retroalimentacion_de optional since the question was removed
        const hasRetroalimentacion = formData.feedbackSources !== undefined;
        
        let query;
        let params;
        
        if (hasRetroalimentacion) {
          // If feedbackSources exists, use original query
          query = `
            INSERT INTO estudiantes_form_submissions (
              institucion_educativa, 
              anos_estudiando, 
              grado_actual, 
              jornada,
              retroalimentacion_de,
              comunicacion, 
              practicas_pedagogicas, 
              convivencia
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id
          `;
          
          params = [
            formData.schoolName,
            formData.yearsOfExperience,
            gradoActual,
            formData.schedule,
            formData.feedbackSources,
            formData.comunicacion,
            formData.practicas_pedagogicas,
            formData.convivencia
          ];
        } else {
          // If feedbackSources doesn't exist, skip it in the query
          query = `
            INSERT INTO estudiantes_form_submissions (
              institucion_educativa, 
              anos_estudiando, 
              grado_actual, 
              jornada,
              comunicacion, 
              practicas_pedagogicas, 
              convivencia
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id
          `;
          
          params = [
            formData.schoolName,
            formData.yearsOfExperience,
            gradoActual,
            formData.schedule,
            formData.comunicacion,
            formData.practicas_pedagogicas,
            formData.convivencia
          ];
        }
        
        const result = await pool.query(query, params);
        
        console.log(`Form saved to database with ID: ${result.rows[0].id}`);
        res.json({ success: true, id: result.rows[0].id });
      }
      else if (targetApp === 'acudientes') {
        // For acudientes form, use the specific column structure
        console.log('Using specific column mapping for acudientes form');
        console.log('Form data fields:', Object.keys(formData));
        
        // Inspect the form data to understand what fields we're working with
        console.log('Form structure details:');
        console.log('- studentGrades:', formData.studentGrades);
        console.log('- frequencyRatings5:', Object.keys(formData.frequencyRatings5 || {}).length);
        console.log('- frequencyRatings6:', Object.keys(formData.frequencyRatings6 || {}).length);
        console.log('- frequencyRatings7:', Object.keys(formData.frequencyRatings7 || {}).length);
        
        const query = `
          INSERT INTO acudientes_form_submissions (
            institucion_educativa, 
            grados_estudiantes, 
            comunicacion, 
            practicas_pedagogicas, 
            convivencia
          ) VALUES ($1, $2, $3, $4, $5) 
          RETURNING id
        `;
        
        // Field mapping for acudientes form
        // Map frequencyRatings5 to comunicacion
        // Map frequencyRatings6 to practicas_pedagogicas
        // Map frequencyRatings7 to convivencia
        
        const result = await pool.query(query, [
          formData.schoolName,
          formData.studentGrades || [],
          formData.frequencyRatings5 || {}, // comunicacion
          formData.frequencyRatings6 || {}, // practicas_pedagogicas
          formData.frequencyRatings7 || {}  // convivencia
        ]);
        
        console.log(`Form saved to database with ID: ${result.rows[0].id}`);
        res.json({ success: true, id: result.rows[0].id });
      }
      else {
        // For any other form, use a generic approach
        const tableName = `${targetApp}_form_submissions`;
        console.log(`Using generic approach for ${tableName}`);
        
        const query = `INSERT INTO ${tableName} (data) VALUES ($1) RETURNING id`;
        const result = await pool.query(query, [JSON.stringify(formData)]);
        console.log(`Form saved to database with ID: ${result.rows[0].id}`);
        res.json({ success: true, id: result.rows[0].id });
      }
    } else {
      // Mock success for testing when no database is available
      console.log('Database not available, simulating successful submission');
      console.log('Form data:', JSON.stringify(formData, null, 2));
      res.json({ success: true, id: Date.now() });
    }
  } catch (error) {
    console.error('Error processing form submission:', error);
    console.error('Error details:', error.message);
    console.error('Form data:', req.body);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error processing form submission',
      message: error.message
    });
  }
});

// Catch-all routes for client-side routing should be LAST
app.get('/docentes/cosmo-doc-o185zfu2c-5xotms/*', (req, res) => {
  console.log('Serving docentes app for path:', req.path);
  res.sendFile(path.join(__dirname, 'form-docentes/build/index.html'));
});

app.get('/acudientes/cosmo-acu-js4n5cy8ar-f0uax8/*', (req, res) => {
  console.log('Serving acudientes app for path:', req.path);
  res.sendFile(path.join(__dirname, 'form-acudientes/build/index.html'));
});

app.get('/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j/*', (req, res) => {
  console.log('Serving estudiantes app for path:', req.path);
  res.sendFile(path.join(__dirname, 'form-estudiantes/build/index.html'));
});

// Welcome page (root route) should be last
app.get('/', (req, res) => {
  const links = Object.entries(ACCESS_TOKENS).map(([app, token]) => {
    return `<li><a href="/${app}/${token}">${app.charAt(0).toUpperCase() + app.slice(1)}</a></li>`;
  }).join('\n');

  res.send(`
    <html>
      <head>
        <title>COSMO Applications</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          h1 { color: #333; }
          .logo { max-width: 200px; margin-bottom: 20px; }
          .app-list { list-style: none; padding: 0; display: inline-block; text-align: left; }
          .app-list li { margin: 10px 0; }
          .app-list a { color: #0066cc; text-decoration: none; padding: 8px 16px; display: inline-block; border: 1px solid #ddd; border-radius: 4px; }
          .app-list a:hover { background-color: #f0f7ff; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>COSMO Applications</h1>
        <p>Click on the links below to access the applications:</p>
        <ul class="app-list">
          ${links}
        </ul>
      </body>
    </html>
  `);
});

// Configure PostgreSQL connection (if DATABASE_URL is provided)
let pool;
const useMockData = !process.env.DATABASE_URL;

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set. Attempting to connect to database...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.stack);
    } else {
      console.log('Database connected successfully');
    }
  });
} else {
  console.log('DATABASE_URL not set. Using mock data for all operations.');
}

// Access tokens - simplified to avoid special characters
const ACCESS_TOKENS = {
  'docentes': process.env.DOCENTES_TOKEN || 'cosmo-doc-o185zfu2c-5xotms',
  'acudientes': process.env.ACUDIENTES_TOKEN || 'cosmo-acu-js4n5cy8ar-f0uax8',
  'estudiantes': process.env.ESTUDIANTES_TOKEN || 'cosmo-est-o7lmi20mfwb-o9f06j'
};

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log('Access tokens:');
  Object.entries(ACCESS_TOKENS).forEach(([app, token]) => {
    console.log(`${app}: "${token}"`);
  });
});