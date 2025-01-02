const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ürünler API
router.get('/', (req, res) => {
  const query = `
    SELECT 
      MIN(urun_id) AS urun_id, 
      urun_ad, 
      fiyat,
      GROUP_CONCAT(DISTINCT beden ORDER BY beden ASC SEPARATOR ', ') AS bedenler
    FROM urunler
    GROUP BY urun_ad, fiyat
    ORDER BY MIN(urun_id) ASC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      res.status(500).send('Veritabanı hatası.');
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
