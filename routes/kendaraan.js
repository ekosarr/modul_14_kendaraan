const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { body, validationResult } = require("express-validator");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
    // mengecek jenis file yang diizinkan(misalnya, hanya jpg dan png)
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Jenis file tidak diizinkan"), false);
    }
};

  
  const upload = multer({ storage: storage, fileFilter: fileFilter });
  const connection = require("../config/db");

  router.post(
    "/store",
    upload.single("gambar_kendaraan"),
    [
      body("no_pol").notEmpty(),
      body("nama_kendaraan").notEmpty(),
      body("id_transmisi").notEmpty(), // Menambahkan validasi untuk id_transmisi (foreign key)
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          errors: errors.array(),
        });
      }
      let Data = {
        no_pol: req.body.no_pol,
        nama_kendaraan: req.body.nama_kendaraan,
        id_transmisi: req.body.id_transmisi,
        gambar_kendaraan: req.file.filename,
      };
      connection.query("INSERT INTO kendaraan SET ?", Data, function (err, rows) {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        } else {
          return res.status(201).json({
            status: true,
            message: "kendaraan berhasil ditambah",
            data: rows[0],
          });
        }
      });
    }
  );

// Endpoint GET kendaraan berdasarkan no_pol
router.get("/:no_pol", (req, res) => {
    const no_pol = req.params.no_pol;

    // Query ke database untuk mengambil data kendaraan berdasarkan no_pol
    connection.query(
        "SELECT k.no_pol, k.nama_kendaraan, t.nama_transmisi, k.gambar_kendaraan FROM kendaraan k INNER JOIN transmisi t ON k.id_transmisi = t.id_transmisi WHERE k.no_pol = ?",
        [no_pol],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: "Server Error",
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Kendaraan not found",
                });
            }

            const kendaraan = rows[0];
            return res.status(200).json({
                status: true,
                message: "Data Kendaraan",
                data: kendaraan,
            });
        }
    );
});


router.patch(
  "/update/:no_pol",
  upload.single("gambar_kendaraan"),
  [
    body("nama_kendaraan").notEmpty(),
    body("id_transmisi").notEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    const no_pol = req.params.no_pol;
    const gambar = req.file ? req.file.filename : null;

    connection.query(`SELECT * FROM kendaraan WHERE no_pol = ?`, [no_pol], function (err, rows) {
      if (err) {
        return res.status(500).json({
          status: false,
          message: "Server Error",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: false,
          message: "Not Found",
        });
      }

      const namaFileLama = rows[0].gambar_kendaraan;

      // Hapus file lama jika ada
      if (namaFileLama && gambar) {
        const pathFileLama = path.join(__dirname, "../public/img", namaFileLama);
        fs.unlinkSync(pathFileLama);
      }

      let Data = {
        nama_kendaraan: req.body.nama_kendaraan,
        id_transmisi: req.body.id_transmisi,
        gambar_kendaraan: gambar,
      };

      connection.query(`UPDATE kendaraan SET ? WHERE no_pol = ?`, [Data, no_pol], function (err, rows) {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        } else {
          return res.status(200).json({
            status: true,
            message: "Data Kendaraan Berhasil Diubah!",
          });
        }
      });
    });
  }
);

  router.get("/", (req, res) => {
    // Query ke database untuk mengambil semua data kendaraan
    connection.query(
      "SELECT k.no_pol, k.nama_kendaraan, t.nama_transmisi, k.gambar_kendaraan FROM kendaraan k INNER JOIN transmisi t ON k.id_transmisi = t.id_transmisi",
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        }
  
        if (rows.length === 0) {
          return res.status(404).json({
            status: false,
            message: "No Kendaraan Found",
          });
        }
  
        return res.status(200).json({
          status: true,
          message: "Data Kendaraan",
          data: rows,
        });
      }
    );
  });
  
  router.delete("/delete/:no_pol", (req, res) => {
    const no_pol = req.params.no_pol;
  
    // Query ke database untuk menghapus data kendaraan berdasarkan nomor polisi
    connection.query("DELETE FROM kendaraan WHERE no_pol = ?", [no_pol], function (err, result) {
      if (err) {
        return res.status(500).json({
          status: false,
          message: "Server Error",
        });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: "Kendaraan not found",
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "Kendaraan berhasil dihapus",
        });
      }
    });
  });
  
  
  
  

  module.exports = router;

