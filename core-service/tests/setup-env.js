// Dijalankan sebelum setiap file test (lihat "jest.setupFiles" di package.json).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BCRYPT_ROUNDS = '4'; // hash cepat agar test tidak lambat
process.env.SEED_ON_START = 'false';
console.warn = () => {}; // log peringatan Wikipedia (jaringan sengaja dimatikan di test) tidak perlu tampil
