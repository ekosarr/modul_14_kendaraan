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
    if (file.mimetype === "img/jpg" || file.mimetype === "img/png" || file.mimetype === "img/pdf") {
      cb(null, true);
    } else {
      cb(new Error("jenis file tidak diizinkan"), false);
    }
  };
  
  const upload = multer({ storage: storage, fileFilter: fileFilter });
  const connection = require("../config/db");

  router.post("/store",[
      body("nama_transmisi").notEmpty(),
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          errors: errors.array(),
        });
      }
      let Data = {
        nama_transmisi: req.body.nama_transmisi,
      };
      connection.query("INSERT INTO transmisi SET ?", Data, function (err, rows) {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        } else {
          return res.status(201).json({
            status: true,
            message: "Success!",
            data: rows[0],
          });
        }
      });
    }
  );

router.get("/:id", (req, res) => {
    const id = req.params.id;

    connection.query(`SELECT * FROM transmisi WHERE id_transmisi = ${id}`, (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: "Server Error",
        });
      }
  
      if (rows.length === 0) {
        return res.status(404).json({
          status: false,
          message: "Transmisi not found",
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "Transmisi data",
          data: rows[0],
        });
      }
    });
  });

router.patch("/update/:id", (req, res) => {
    const id = req.params.id;
    const { nama_transmisi } = req.body;
  
    // Pastikan data yang akan diupdate valid
    if (!nama_transmisi) {
      return res.status(400).json({
        status: false,
        message: "Nama transmisi is required",
      });
    }

    connection.query(
      "UPDATE transmisi SET nama_transmisi = ? WHERE id_transmisi = ?",
      [nama_transmisi, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: false,
            message: "Transmisi not found",
          });
        } else {
          return res.status(200).json({
            status: true,
            message: "Transmisi berhasil diubah",
          });
        }
      }
    );
  });
  
  router.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    connection.query(
      "DELETE FROM transmisi WHERE id_transmisi = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Server Error",
          });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: false,
            message: "Transmisi not found",
          });
        } else {
          return res.status(200).json({
            status: true,
            message: "Transmisi berhasil dihapus",
          });
        }
      }
    );
  });
  
  


  

module.exports = router;