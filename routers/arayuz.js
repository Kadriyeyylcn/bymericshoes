const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Dinamik Kart Verileri
router.get('/stats', (req, res) => {
    const query = `
     SELECT 
          (SELECT SUM(adet) FROM 2023_satıslar) + (SELECT SUM(adet) FROM 2024_satıslar) AS toplam_satis,
          (SELECT SUM(adet) FROM 2023_satıslar) + (SELECT SUM(adet) FROM 2024_satıslar)-((SELECT SUM(adet) FROM 2023_iadeler) +(SELECT SUM(adet) FROM 2024_iadeler)) AS net_satis,
          (SELECT SUM(adet) FROM 2023_iadeler) + (SELECT SUM(adet) FROM 2024_iadeler) AS toplam_iade;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            return res.status(500).send('Bir hata oluştu.');
        }
        res.json(results[0]);
    });
});

// Dinamik Grafik Verileri
router.get('/charts', (req, res) => {
    const query = `
    SELECT 
    ay,
    SUM(toplam_satis) AS toplam_satis,
    SUM(net_satis) AS net_satis,
    SUM(toplam_iade) AS toplam_iade
    FROM (
    SELECT 
        2024_satıslar.ay, 
        SUM(2024_satıslar.adet) AS toplam_satis, 
        SUM(2024_satıslar.adet) - COALESCE(SUM(2024_iadeler.adet), 0) AS net_satis, 
        COALESCE(SUM(2024_iadeler.adet), 0) AS toplam_iade
    FROM 
        2024_satıslar
    LEFT JOIN 
        2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id AND 2024_satıslar.ay = 2024_iadeler.ay
    GROUP BY 
        2024_satıslar.ay

    UNION ALL
    SELECT 
        2023_satıslar.ay, 
        SUM(2023_satıslar.adet) AS toplam_satis, 
        SUM(2023_satıslar.adet) - COALESCE(SUM(2023_iadeler.adet), 0) AS net_satis, 
        COALESCE(SUM(2023_iadeler.adet), 0) AS toplam_iade
    FROM 
        2023_satıslar
    LEFT JOIN 
        2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id AND 2023_satıslar.ay = 2023_iadeler.ay
    GROUP BY 
        2023_satıslar.ay
     ) AS birleşik
    GROUP BY ay
    ORDER BY 
    FIELD(ay, 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık');
  
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            return res.status(500).send('Bir hata oluştu.');
        }
        res.json(results);
    });
});

module.exports = router;
