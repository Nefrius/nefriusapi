const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');
const app = express();
const PORT = process.env.PORT || 3000; // Vercel'de PORT ortam değişkeni kullanılır

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
app.use(express.static(path.join(__dirname, 'public')));
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

  // Dizin var mı kontrol et ve oluştur
  fs.mkdir(uploadDir, { recursive: true }, (err) => {
    if (err) {
      console.error('Upload dizini oluşturulamadı:', err);
      return res.status(500).send('Upload dizini oluşturulamadı.');
    }

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('Dosyalar alınamadı:', err);
        return res.status(500).send('Dosyalar alınamadı.');
      }

      const fileNames = files.map(file => {
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
});

// Dosya yükleme
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('Hiçbir dosya seçilmedi.');
  }

  let uploadedFile = req.files.file;
  let fileName = uploadedFile.name;
  if (fileName.endsWith('.txt.txt')) {
    fileName = fileName.replace('.txt.txt', '.txt');
  }
  let uploadPath = path.join(__dirname, 'public', 'uploads', fileName);

  // Yükleme dizinini kontrol et ve oluştur
  fs.mkdir(path.dirname(uploadPath), { recursive: true }, (err) => {
    if (err) {
      console.error('Dizin oluşturulamadı:', err);
      return res.status(500).send('Dizin oluşturulamadı.');
    }

    // Dosyayı geçici dizine yükle
    uploadedFile.mv(uploadPath, (err) => {
      if (err) {
        console.error('Dosya yükleme hatası:', err);
        return res.status(500).send(err);
      }

      // Dosyayı public/uploads dizinine kopyala
      const tempFilePath = path.join('/tmp', 'uploads', fileName);
      fs.copyFile(uploadPath, tempFilePath, (err) => {
        if (err) {
          console.error('Dosya kopyalama hatası:', err);
          return res.status(500).send('Dosya kopyalama hatası.');
        }

        res.redirect('/admin');
      });
    });
  });
});

// Dosya içeriğini gösterme
app.get('/view/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.params.fileName);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Dosya okunamadı:', err);
      return res.status(500).send('Dosya okunamadı.');
    }

    res.render('view', {
      fileName: req.params.fileName,
      fileContent: data
    });
  });
});

// Dosya sunma
app.get('/uploads/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.params.fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Dosya sunma hatası:', err);
      res.status(err.status).end();
    }
  });
});

app.post('/admin/delete/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.params.fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send('Dosya silinemedi.');
    }

    res.redirect('/admin');
  });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
