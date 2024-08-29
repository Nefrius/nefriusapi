const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(fileUpload());

// Şablon motorunu ayarlama
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Anasayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin sayfası
app.get('/admin', (req, res) => {
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send('Dosyalar alınamadı.');
    }

    // Dosyaların tamamını göstermek için
    const fileNames = files.map(file => ({
      name: file, // Dosya adını olduğu gibi al
      path: `/uploads/${file}` // Dosya yolunu ayarla
    }));

    res.render('admin', { files: fileNames });
  });
});

// Dosya yükleme
app.post('/upload', (req, res) => {
  let uploadedFile = req.files.file;
  let uploadPath = path.join(__dirname, 'public', 'uploads', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.redirect('/admin');
  });
});

// Dosya sunma
app.get('/uploads/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.params.fileName);
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
