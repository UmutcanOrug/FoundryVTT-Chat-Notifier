# IC Chat Notifier

Foundry Virtual Tabletop V13 (Build 351) için, gelen IC sohbet mesajlarına sahne kapsamlı ses bildirimleri ekler.

## Davranış

- Yalnızca `IC` türündeki mesajlarda çalışır; OOC, zar ve emote mesajları sessizdir.
- Yalnızca mesajın sahnesi ile kullanıcının görüntülediği sahne aynıysa ses çalar.
- Kullanıcının kendi mesajında ses çalmaz.
- Normal IC mesajları için standart bildirim sesi çalar.
- Kullanıcı adı, atanmış karakter adı, oyuncuya açıkça sahipliği verilmiş aktör adı veya ayarlara eklenen bir isim mesajda geçiyorsa daha belirgin bir ses çalar.
- Aynı mesajda isim kaç kez geçerse geçsin yalnızca bir ses çalar. Bahsetme sesi seçildiyse normal ses ayrıca çalmaz.
- Varsayılan otomatik algılama hem `Alaric` hem `@Alaric` yazımını tanır. Karakter adı `Alaric Grey` ise tam adın yanında `Alaric` ilk adı da otomatik algılanır; `Alaric'e` ve `Alaricson` gibi devam eden yazımlar da eşleşir. İstenirse `@` işareti zorunlu tutulabilir.
- GM, normal ve bahsetme sesleri ile ses düzeylerini dünya varsayılanı olarak belirleyebilir.
- Oyuncular varsayılan olarak GM'nin dünya seslerini kullanır; isterlerse bu seçeneği kapatıp kişisel seslerini seçebilir.
- Etkinleştirme, isim algılama, ek isimler ve kişisel geçersiz kılmalar istemciye özeldir.

## Tabbed Chatlog

Modül sohbet arayüzünü veya sekmeleri değiştirmez. Foundry'nin `ChatMessage` olayını dinlediği için `fvtt-tabbed-chatlog` ile bağımsız çalışır.

## Kurulum

`ic-chat-notifier` klasörünü Foundry kullanıcı verilerindeki `Data/modules` klasörüne kopyalayın. Foundry'yi yeniden başlatıp dünyanızın **Modülleri Yönet** ekranından **IC Chat Notifier** modülünü etkinleştirin.

Foundry'nin **Add-on Modules > Install Module** ekranındaki manifest alanına aşağıdaki adresi yazarak da kurabilirsiniz:

```text
https://raw.githubusercontent.com/UmutcanOrug/FoundryVTT-Chat-Notifier/main/module.json
```

Kullanıcıya özel seçenekler **Oyun Ayarları > Ayarları Yapılandır > IC Chat Notifier > IC bildirimlerini ayarla** düğmesinden açılır. Normal ve bahsetme seslerinin yanındaki oynat düğmeleriyle sesler kaydetmeden önce denenebilir.

Ses alanlarındaki dosya düğmesi Foundry VTT'nin yerleşik ses seçicisini açar; `Data` klasörüne yüklediğiniz desteklenen ses dosyalarını buradan seçebilirsiniz. Kayıt düğmesi pencerenin altında sabit kalırken ayar içeriği kaydırılabilir.

GM aynı pencerede taç simgeli **GM dünya varsayılanları** bölümünü görür. Oyuncular bu bölümün salt okunur özetini ve ses deneme düğmelerini görür.

## Geliştirme kontrolleri

`npm test` komutu sahne filtresi, isim eşleşmesi, tek-mesaj/tek-ses garantisi, bahsetme sesinin normal sesin yerini alması ve oyuncu geçersiz kılmalarını sınar.
