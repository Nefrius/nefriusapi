const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');
const app = express();
const PORT = 3000;

// Kullanıcı adı ve şifreleri ayarlama
const users = {
  'nefrius': 'nefrius' // Burada admin olarak kullanıcı adı ve password olarak şifre belirleyin
};

// HTTP Basic Authentication middleware'i
app.use('/admin', basicAuth({
  users: users,
  challenge: true,
  unauthorizedResponse: 'Yetkisiz Erişim'
}));

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
    const fileNames = files.map(file => {
      // Dosya adındaki iki kez uzantıyı düzelt
      let displayName = file;
      if (file.endsWith('.txt.txt')) {
        displayName = file.replace('.txt.txt', '.txt');
      }
      return {
        name: displayName,
        path: `/uploads/${file}`
      };
    });

    res.render('admin', { files: fileNames });
  });
});

// Dosya yükleme
app.post('/upload', (req, res) => {
  let uploadedFile = req.files.file;
  // Dosya adını kontrol et ve uzantıyı düzelt
  let fileName = uploadedFile.name;
  if (fileName.endsWith('.txt.txt')) {
    fileName = fileName.replace('.txt.txt', '.txt');
  }
  let uploadPath = path.join(__dirname, 'public', 'uploads', fileName);

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
