// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const mysql = require('mysql');

// // Create MySQL connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '', // Change as per your setup
// });

// db.connect((err) => {
//     if (err) {
//         console.error('❌ Error connecting to MySQL:', err.message);
//         return;
//     }
//     console.log('✅ MySQL Connected');
    
//     // Create database if it doesn't exist
//     db.query("CREATE DATABASE IF NOT EXISTS DhanapalJewellers", (err) => {
//         if (err) {
//             console.error('❌ Error creating database:', err.message);
//             return;
//         }
//         console.log('✅ Database ensured');
        
//         // Use the database
//         db.query("USE DhanapalJewellers", (err) => {
//             if (err) {
//                 console.error('❌ Error selecting database:', err.message);
//                 return;
//             }
//             console.log('✅ Using database DhanapalJewellers');
            
//             // Create products table if it doesn't exist
//             const createTableQuery = `
//                 CREATE TABLE IF NOT EXISTS products (
//                     id INT AUTO_INCREMENT PRIMARY KEY,
//                     name VARCHAR(255) NOT NULL,
//                     category VARCHAR(255) NOT NULL,
//                     price DECIMAL(10,2) NOT NULL,
//                     weight FLOAT NOT NULL,
//                     description TEXT,
//                     image VARCHAR(255)
//                 )
//             `;
//             db.query(createTableQuery, (err) => {
//                 if (err) {
//                     console.error('❌ Error creating table:', err.message);
//                 } else {
//                     console.log('✅ Products table ensured');
//                 }
//             });
//         });
//     });
// });

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // ✅ GET all products
// app.get('/api/products', (req, res) => {
//     db.query('SELECT * FROM products', (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(results);
//     });
// });

// // ✅ POST a new product
// app.post('/api/products', (req, res) => {
//     const { name, category, price, weight, description, image } = req.body;
//     const sql = 'INSERT INTO products (name, category, price, weight, description, image) VALUES (?, ?, ?, ?, ?, ?)';
    
//     db.query(sql, [name, category, price, weight, description, image], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json({ message: '✅ Product added successfully', id: result.insertId });
//     });
// });

// // ✅ DELETE a product by ID
// app.delete('/api/products/:id', (req, res) => {
//     const { id } = req.params;
//     db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: '❌ Product not found' });
//         }
//         res.json({ message: '✅ Product deleted successfully' });
//     });
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`🚀 Server is running on port ${PORT}`);
// });
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ✅ Connect to Clever Cloud MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ MySQL Connection Error:', err.message);
        return;
    }
    console.log('✅ MySQL Connected');
});

// ✅ Initialize Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// ✅ Setup Multer for Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products', // Folder name in Cloudinary
        format: async (req, file) => 'png', 
        public_id: (req, file) => Date.now() + '-' + file.originalname
    }
});
const upload = multer({ storage });

// ✅ GET All Products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ✅ POST a New Product (with Image Upload)
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, category, price, weight, description } = req.body;
    const image = req.file ? req.file.path : null;

    const sql = 'INSERT INTO products (name, category, price, weight, description, image) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, category, price, weight, description, image], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: '✅ Product added successfully', id: result.insertId });
    });
});

// ✅ DELETE a Product by ID
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    // Get Image URL before deleting
    db.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            const imageUrl = results[0].image;
            if (imageUrl) {
                // Extract public_id from Cloudinary URL
                const publicId = imageUrl.split('/').pop().split('.')[0];
                cloudinary.uploader.destroy(`products/${publicId}`, (error, result) => {
                    if (error) console.error('Cloudinary Image Deletion Error:', error);
                });
            }
        }

        // Delete product from MySQL
        db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: '❌ Product not found' });
            }
            res.json({ message: '✅ Product deleted successfully' });
        });
    });
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
