const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const girisRoutes = require('./routers/giris');
const arayuzRoutes = require('./routers/arayuz');
const urunlerRoutes = require('./routers/urunler');
const satisRoutes = require('./routers/satis');
const iadeRoutes = require('./routers/iade');

const app = express();

// Orta katmanlar
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota tanımlamaları
app.use('/giris', girisRoutes);
app.use('/arayuz', arayuzRoutes);
app.use('/urunler', urunlerRoutes);
app.use('/satis', satisRoutes);
app.use('/iade', iadeRoutes);


// MySQL bağlantısını başlat
const db = require('./config/db');

// Anasayfa rotası
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'arayuz.html')); // Arayüz sayfasına yönlendirme
});

// Sunucuyu başlat
app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde çalışıyor.');
});
