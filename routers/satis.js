const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Grafik verisi için API
router.get('/revenue-chart', (req, res) => {
  const query = `
    SELECT
      '2023' AS yil,
      SUM(2023_satıslar.adet * urunler.fiyat) AS toplam_ciro,
      SUM(2023_satıslar.adet * urunler.fiyat) - 
      COALESCE(SUM(2023_iadeler.adet * urunler.fiyat), 0) AS net_ciro
    FROM 2023_satıslar
    JOIN urunler ON 2023_satıslar.urun_id = urunler.urun_id
    LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
    UNION ALL
    SELECT
      '2024' AS yil,
      SUM(2024_satıslar.adet * urunler.fiyat) AS toplam_ciro,
      SUM(2024_satıslar.adet * urunler.fiyat) - 
      COALESCE(SUM(2024_iadeler.adet * urunler.fiyat), 0) AS net_ciro
    FROM 2024_satıslar
    JOIN urunler ON 2024_satıslar.urun_id = urunler.urun_id
    LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id;
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

// Tablo verisi için API
router.get('/sales-table', (req, res) => {
  const query = `
SELECT 
    urunler.urun_ad AS urun,
    COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0) AS toplam_satis,
    COALESCE(SUM(2023_satıslar.adet), 0) - COALESCE(SUM(2023_iadeler.adet), 0) + 
    COALESCE(SUM(2024_satıslar.adet), 0) - COALESCE(SUM(2024_iadeler.adet), 0) AS net_satis,
    COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0) AS iade_sayisi
FROM urunler
LEFT JOIN 2023_satıslar ON urunler.urun_id = 2023_satıslar.urun_id
LEFT JOIN 2024_satıslar ON urunler.urun_id = 2024_satıslar.urun_id
LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id
GROUP BY urunler.urun_ad
ORDER BY toplam_satis DESC;
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
router.get('/prediction-table', (req, res) => {
  const query = `
    SELECT 
      urunler.urun_ad AS urun,
      ROUND(
          COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0)
      ) AS toplam_gecmis_satis, 
      ROUND(
          (COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0)) * 1.1
      ) AS tahmini_satis, -- Geçmiş satışların %10 artışıyla tahmin
      ROUND(
          COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0)
      ) AS toplam_gecmis_iade,
      ROUND(
          (COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0)) * 1.1
      ) AS tahmini_iade, -- Geçmiş iadelerin %10 artışıyla tahmin
      ROUND(
          ((COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0)) * 1.1) -
          ((COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0)) * 1.1)
      ) AS tahmini_net_satis -- Tahmini satış - tahmini iade
    FROM urunler
    LEFT JOIN 2023_satıslar ON urunler.urun_id = 2023_satıslar.urun_id
    LEFT JOIN 2024_satıslar ON urunler.urun_id = 2024_satıslar.urun_id
    LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
    LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id
    GROUP BY urunler.urun_ad
    ORDER BY tahmini_satis DESC;
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

router.get('/revenue-prediction', (req, res) => {
  const query = ` 
      SELECT
          '2025' AS yil,
          ROUND(SUM(tahmini_satis) * 621) AS tahmini_toplam_ciro,
          ROUND(SUM(tahmini_net_satis) * 621) AS tahmini_net_ciro,
          ROUND(SUM(tahmini_iade) * 621) AS tahmini_iade_zarari
      FROM (
          SELECT
              ROUND(
                  (COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0)) / 2 * 1.1
              ) AS tahmini_satis,
              ROUND(
                  (COALESCE(SUM(2023_satıslar.adet), 0) - COALESCE(SUM(2023_iadeler.adet), 0) +
                  COALESCE(SUM(2024_satıslar.adet), 0) - COALESCE(SUM(2024_iadeler.adet), 0)) / 2 * 1.1
              ) AS tahmini_net_satis,
              ROUND(
                  (COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0)) / 2 * 1.1
              ) AS tahmini_iade
          FROM urunler
          LEFT JOIN 2023_satıslar ON urunler.urun_id = 2023_satıslar.urun_id
          LEFT JOIN 2024_satıslar ON urunler.urun_id = 2024_satıslar.urun_id
          LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
          LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id
          GROUP BY urunler.urun_ad
      ) AS tahmin_verileri;
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Veritabanı hatası:', err);
          res.status(500).json({ error: 'Veritabanı hatası.' });
      } else if (results.length === 0) {
          res.status(404).json({ error: 'Tahmin verisi bulunamadı.' });
      } else {
          const formattedResults = {
              tahmini_toplam_ciro: parseFloat(results[0].tahmini_toplam_ciro),
              tahmini_net_ciro: parseFloat(results[0].tahmini_net_ciro),
              tahmini_iade_zarari: parseFloat(results[0].tahmini_iade_zarari),
          };
          res.json(formattedResults);
      }
  });
});

// Ürün Silme
router.post('/remove-product', (req, res) => {
  const { urun_id } = req.body; 

  const query = `
      DELETE FROM urunler WHERE urun_id = ?;
  `;

  db.query(query, [urun_id], (err) => {
      if (err) {
          console.error('Ürün silme işlemi hatası:', err);
          res.status(500).send('Ürün silme işlemi başarısız oldu.');
      } else {
          res.send('Ürün başarıyla silindi.');
      }
  });
});

// Ürün Listesi
router.get('/product-list', (req, res) => {
  const query = `
  SELECT urun_id, urun_ad, MIN(beden) AS beden, fiyat
      FROM urunler
      GROUP BY urun_ad, fiyat;
      `;

  db.query(query, (err, results) => {
      if (err) {
          console.error('Ürün listesi alınamadı:', err);
          res.status(500).send('Ürün listesi alınamadı.');
      } else {
          res.json(results);
      }
  });
});


module.exports=router;


