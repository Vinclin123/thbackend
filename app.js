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
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Change as per your setup
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        return;
    }
    console.log('✅ MySQL Connected');

    // Create database if it doesn't exist
    db.query("CREATE DATABASE IF NOT EXISTS DhanapalJewellers", (err) => {
        if (err) {
            console.error('❌ Error creating database:', err.message);
            return;
        }
        console.log('✅ Database ensured');

        // Use the database
        db.query("USE DhanapalJewellers", (err) => {
            if (err) {
                console.error('❌ Error selecting database:', err.message);
                return;
            }
            console.log('✅ Using database DhanapalJewellers');

            // Create products table if it doesn't exist
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(255) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    weight FLOAT NOT NULL,
                    description TEXT,
                    image VARCHAR(255) NULL
                )
            `;
            db.query(createTableQuery, (err) => {
                if (err) {
                    console.error('❌ Error creating table:', err.message);
                } else {
                    console.log('✅ Products table ensured');
                }
            });
        });
    });
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ✅ GET all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ✅ POST a new product (With Image Upload)
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, category, price, weight, description } = req.body;
    const image = req.file ? req.file.filename : null;
    
    const sql = 'INSERT INTO products (name, category, price, weight, description, image) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [name, category, price, weight, description, image], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: '✅ Product added successfully', id: result.insertId });
    });
});

// ✅ DELETE a product by ID
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    // Get the image filename before deleting
    db.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const imageName = results[0].image;
            if (imageName) {
                const imagePath = path.join(__dirname, 'uploads', imageName);
                fs.unlink(imagePath, (err) => {
                    if (err) console.error('Error deleting image:', err);
                });
            }
        }

        // Delete the product from the database
        db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: '❌ Product not found' });
            }
            res.json({ message: '✅ Product deleted successfully' });
        });
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
