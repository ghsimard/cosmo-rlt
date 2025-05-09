export const config = {
  ports: {
    frontend: 3004,
    backend: 3005,
    database: 5432
  },
  urls: {
    frontend: process.env.NODE_ENV === 'production' 
      ? 'https://form-acudientes.onrender.com'
      : 'http://localhost:3004',
    backend: process.env.NODE_ENV === 'production'
      ? 'https://form-acudientes.onrender.com'
      : 'http://localhost:3005',
    api: process.env.NODE_ENV === 'production'
      ? 'https://form-acudientes.onrender.com/api'
      : 'http://localhost:3005/api'
  }
} as const;

export type Config = typeof config; 