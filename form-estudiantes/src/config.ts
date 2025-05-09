export const config = {
  ports: {
    frontend: 3002,
    backend: 3003,
    database: 5432
  },
  urls: {
    frontend: process.env.NODE_ENV === 'production'
      ? 'https://form-estudiantes.onrender.com'
      : 'http://localhost:3002',
    backend: process.env.NODE_ENV === 'production'
      ? 'https://form-estudiantes.onrender.com'
      : 'http://localhost:3003',
    api: process.env.NODE_ENV === 'production'
      ? 'https://form-estudiantes.onrender.com/api'
      : 'http://localhost:3003/api'
  }
}; 