const express = require('express');
const router = express.Router();
const db = require('../config/db');

// İade oranları ve satış verileri API
router.get('/returns-data', (req, res) => {
    const query = `
        SELECT
            urunler.urun_ad AS urun,
            COALESCE(SUM(2023_satıslar.adet), 0) AS toplam_satis_2023,
            COALESCE(SUM(2023_iadeler.adet), 0) AS toplam_iade_2023,
            ROUND((COALESCE(SUM(2023_iadeler.adet), 0) / COALESCE(SUM(2023_satıslar.adet), 1)) * 100, 2) AS iade_orani_2023,
            COALESCE(SUM(2024_satıslar.adet), 0) AS toplam_satis_2024,
            COALESCE(SUM(2024_iadeler.adet), 0) AS toplam_iade_2024,
            ROUND((COALESCE(SUM(2024_iadeler.adet), 0) / COALESCE(SUM(2024_satıslar.adet), 1)) * 100, 2) AS iade_orani_2024
        FROM urunler
        LEFT JOIN 2023_satıslar ON urunler.urun_id = 2023_satıslar.urun_id
        LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
        LEFT JOIN 2024_satıslar ON urunler.urun_id = 2024_satıslar.urun_id
        LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id
        GROUP BY urunler.urun_ad;
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

// Toplam iade oranları API
router.get('/returns-summary', (req, res) => {
    const query = `
        SELECT
            '2023' AS yil,
            COALESCE(SUM(2023_iadeler.adet), 0) AS toplam_iade,
            ROUND((COALESCE(SUM(2023_iadeler.adet), 0) / COALESCE(SUM(2023_satıslar.adet), 1)) * 100, 2) AS iade_orani
        FROM 2023_satıslar
        LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
        UNION
        SELECT
            '2024' AS yil,
            COALESCE(SUM(2024_iadeler.adet), 0) AS toplam_iade,
            ROUND((COALESCE(SUM(2024_iadeler.adet), 0) / COALESCE(SUM(2024_satıslar.adet), 1)) * 100, 2) AS iade_orani
        FROM 2024_satıslar
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
//Tahmini iade oranı API
router.get('/returns-prediction-summary', (req, res) => {
    const query = `
        SELECT 
            '2025' AS yil,
            ROUND(AVG(iade_orani), 2) AS tahmini_iade_orani
        FROM (
            SELECT 
                (COALESCE(SUM(2023_iadeler.adet), 0) / COALESCE(SUM(2023_satıslar.adet), 1) * 100) AS iade_orani
            FROM 2023_iadeler
            LEFT JOIN 2023_satıslar ON 2023_iadeler.2023_satıs_id = 2023_satıslar.2023_satıs_id
            UNION ALL
            SELECT 
                (COALESCE(SUM(2024_iadeler.adet), 0) / COALESCE(SUM(2024_satıslar.adet), 1) * 100) AS iade_orani
            FROM 2024_iadeler
            LEFT JOIN 2024_satıslar ON 2024_iadeler.2024_satıs_id = 2024_satıslar.2024_satıs_id
        ) AS tahmin_verisi;
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
//Yılllık İade API
router.get('/returns-prediction', (req, res) => {
    const query = `
    SELECT 
    urunler.urun_ad AS urun,
    ROUND(
        ((COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0)) / 2) * 1.1
    ) AS tahmini_satis_2025, -- Ortalama %10 artış ile satış tahmini
    ROUND(
        (
            (COALESCE(SUM(2023_iadeler.adet), 0) + COALESCE(SUM(2024_iadeler.adet), 0)) / 
            (COALESCE(SUM(2023_satıslar.adet), 0) + COALESCE(SUM(2024_satıslar.adet), 0))
        ) * 100 * 1.1, 2
    ) AS tahmini_iade_orani_2025 -- İade oranının %10 artış ile tahmini
 FROM urunler
 LEFT JOIN 2023_satıslar ON urunler.urun_id = 2023_satıslar.urun_id
 LEFT JOIN 2023_iadeler ON 2023_satıslar.2023_satıs_id = 2023_iadeler.2023_satıs_id
 LEFT JOIN 2024_satıslar ON urunler.urun_id = 2024_satıslar.urun_id
 LEFT JOIN 2024_iadeler ON 2024_satıslar.2024_satıs_id = 2024_iadeler.2024_satıs_id
 GROUP BY urunler.urun_ad;
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
//Yıllara göre aylık iade oranları API
router.get('/monthly-returns/:year', (req, res) => {
    const year = req.params.year; // Dinamik yıl parametresi
    let query = '';

    if (year === '2023') {
        query = `
            SELECT
                2023_iadeler.ay,
                ROUND(SUM(2023_iadeler.adet) / NULLIF(SUM(2023_satıslar.adet), 0) * 100, 2) AS iade_orani
            FROM 2023_iadeler
            JOIN 2023_satıslar ON 2023_iadeler.2023_satıs_id = 2023_satıslar.2023_satıs_id
            GROUP BY 2023_iadeler.ay
            ORDER BY FIELD(2023_iadeler.ay, 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık');
        `;
    } else if (year === '2024') {
        query = `
            SELECT
                2024_iadeler.ay,
                ROUND(SUM(2024_iadeler.adet) / NULLIF(SUM(2024_satıslar.adet), 0) * 100, 2) AS iade_orani
            FROM 2024_iadeler
            JOIN 2024_satıslar ON 2024_iadeler.2024_satıs_id = 2024_satıslar.2024_satıs_id
            GROUP BY 2024_iadeler.ay
            ORDER BY FIELD(2024_iadeler.ay, 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık');
        `;
    } else if (year === '2025') {
        query = `
            SELECT
                ay,
                ROUND(AVG(iade_orani), 2) AS tahmini_iade_orani
            FROM (
                SELECT
                    2023_iadeler.ay AS ay,
                    SUM(2023_iadeler.adet) / NULLIF(SUM(2023_satıslar.adet), 0) * 100 AS iade_orani
                FROM 2023_iadeler
                JOIN 2023_satıslar ON 2023_iadeler.2023_satıs_id = 2023_satıslar.2023_satıs_id
                GROUP BY 2023_iadeler.ay
                UNION ALL
                SELECT
                    2024_iadeler.ay AS ay,
                    SUM(2024_iadeler.adet) / NULLIF(SUM(2024_satıslar.adet), 0) * 100 AS iade_orani
                FROM 2024_iadeler
                JOIN 2024_satıslar ON 2024_iadeler.2024_satıs_id = 2024_satıslar.2024_satıs_id
                GROUP BY 2024_iadeler.ay
            ) AS combined
            GROUP BY ay
            ORDER BY FIELD(ay, 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık');
        `;
    } else {
        return res.status(400).send('Geçersiz yıl parametresi.');
    }

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
