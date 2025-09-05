const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.array('files'), (req, res) => {
    const files = req.files.map(file => ({
        id: file.filename,
        name: file.originalname,
        size: file.size,
        uploadDate: new Date().toISOString(),
        path: file.path
    }));
    res.json({ success: true, files });
});

app.get('/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Cannot read files' });
        
        const fileList = files.map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            return {
                id: filename,
                name: filename.split('-').slice(1).join('-'),
                size: stats.size,
                uploadDate: stats.birthtime.toISOString(),
                path: `/uploads/${filename}`
            };
        });
        
        res.json(fileList);
    });
});

app.delete('/files/:id', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.id);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: 'Cannot delete file' });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});