export const config = {
  ports: {
    frontend: 4000,
    backend: 4001
  },
  api: {
    baseUrl: process.env.NODE_ENV === 'production'
      ? 'https://cosmo-rlt-stats.onrender.com'
      : 'http://localhost:4001'
  }
}; 