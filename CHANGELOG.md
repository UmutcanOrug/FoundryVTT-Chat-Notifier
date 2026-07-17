# Changelog

## 0.2.2

- Forge Assets gibi `http/https` ses bağlantıları, uzun MP3 dosyalarının tamamen indirilip çözülmesini beklemeden doğrudan akış olarak oynatılır.
- Harici sesler hem ayarlardaki deneme düğmesinde hem de gerçek IC bildirimlerinde aynı oynatma yolunu kullanır.
- Harici ses akışlarında Foundry'nin genel arayüz ses seviyesi ve genel sessize alma durumu uygulanır.

## 0.2.1

- Ayar penceresine her ekran boyutunda çalışan kaydırılabilir içerik ve daima görünür kayıt alanı eklendi.
- Ses alanları Foundry VTT V13'ün yerleşik ses dosyası seçicisine geçirildi; Data klasörüne yüklenen sesler doğrudan seçilebilir.
- Tam karakter adının yanı sıra ilk ad da otomatik bahsetme adı olarak algılanır.
- Adın sonuna ek veya başka harfler geldiğinde de eşleşme yapılır; örneğin `Alaric`, `Alaric'e` ve `Alaricson` aynı özel sesi tetikler.

## 0.2.0

- GM tarafından yönetilen dünya normal ve bahsetme sesi varsayılanları eklendi.
- Oyuncular için GM dünya seslerini kullanma veya kişisel seslerle geçersiz kılma seçeneği eklendi.
- Aynı ChatMessage nesnesinin iki kez ses üretmesini engelleyen koruma eklendi.
- Bir mesajda isim birden çok kez geçse bile yalnızca tek bahsetme sesi çaldığını ve normal sesin ayrıca çalmadığını doğrulayan testler eklendi.

## 0.1.0

- V13.351 için ilk sürüm.
- Aynı sahneye bağlı IC mesaj sesleri ve karakter adı algılama eklendi.
