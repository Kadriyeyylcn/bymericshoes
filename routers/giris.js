const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');

router.post('/', (req, res) => {
  const { username, password } = req.body;

  const query = `
    SELECT * FROM yonetici
    WHERE kullanici_adi = ? AND sifre = ?;
  `;

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    } else if (results.length > 0) {
      res.redirect('/arayuz.html');
    } else {
      res.sendFile(path.join(__dirname, '../public', 'giris.html'));
    }
  });
});

module.exports = router;
