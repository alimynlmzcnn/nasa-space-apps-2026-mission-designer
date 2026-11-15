# Assetler ve kaynak notları

Bu dosya, `CREDITS.md` ve `README.md` yazılırken kullanılmak üzere hangi görselin nereden geldiğini kaydeder.

## Nasıl çalıştırılır
`index.html` dosyasını tarayıcıda açmak yeterli. Sunucu gerekmez.

Test kısayolları (adres satırına eklenir): `?room=0` (hangar), `?scene=pad` (rampa), `?t=120` (uçuşta 120. saniyeye atla).
Klavye: ← → oda değiştirir, Enter/Boşluk ekranı açar ya da fırlatır, Esc kontrol odasına döner.

## Takımın çizimcisi tarafından çizilenler (Krita)
| Dosya | Ne |
|---|---|
| `rocket_sls_idle.png` | Tam roket |
| `rocket_sls_nosrb.png` | Yan roketsiz (çekirdek + üst kademe + kule) |
| `rocket_sls_stage1.png` | Çekirdek kademe |
| `rocket_sls_srb_l.png`, `rocket_sls_srb_r.png` | Yan roket (`_r` aynalanmış kopya) |
| `rocket_sls_stage2.png` | Üst kademe + Orion |
| `rocket_sls_las.png` | Fırlatma iptal kulesi |
| `fx_flame_01..08.png`, `fx_flame_sheet_8x1.png` | 8 karelik alev animasyonu |

Not: Alev çizilirken filigranlı bir stok görsel referans alınmıştı; o görsel oyunda **kullanılmıyor**.

## Yapay zekâ (Claude) ile kodla üretilenler
Çizimcinin tarzına (düz dolgu, yumuşak gri kontur, hafif titrek çizgi) benzetilerek SVG olarak çizilip PNG'ye çevrildi.
Üreten betikler `tools/` klasöründe: `gen_assets.py` (nesneler), `gen_bg.py` (arka plan).

- Arka plan: `bg_space.png`, `bg_stars_near.png` (takımın verdiği mor yıldızlı örnek görselin renklerinden esinlenildi, görselin kendisi kullanılmadı), `bg_earth_limb.png`
- Görev kontrol odası: `room_console_amfi.png`, `room_screen_big.png`, `room_desk.png`, `room_map.png`, `room_whiteboard.png`, `room_poster_frame.png` (içinde SLS afişi), `room_server.png`, `room_plant.png`, `room_lamp.png`
- İnsanlar: `char_*` (bilim insanı, mühendis, kontrolör, yönetici; oturma, yürüme, işaret etme kareleri)
- Hangar: `hangar_stand`, `hangar_crate`, `hangar_barrel`, `hangar_toolboard`, `hangar_label`, `hangar_bench`, `hangar_cart`, `hangar_tank`, `hangar_sign`, `hangar_crane`, `hangar_hook`, `hangar_pipes` (.png)
- Oda detayları: `room_shelf`, `room_coffee`, `room_extinguisher`, `room_clock`, `room_board`, `room_vent` (.png)
- Rampa: `pad_tower.png`, `pad_platform.png`, `pad_lightning.png`, `pad_water.png`, `pad_hills_far.png`, `pad_hills_near.png`, `pad_apron.png`
- Efekt: `fx_cloud_1..3.png`, `fx_smoke_1..3.png`

## Kod
`game.js`, `scene.js`, `ui.js`, `index.html`, `data/data.js` Claude ile birlikte bu etkinlikte sıfırdan yazıldı.
Eski MissionForge prototipi yalnızca görünüm ve akış fikri için örnek alındı; kodundan hiçbir şey kopyalanmadı.
Yazı tipi: işletim sisteminin kendi yazı tipi (ek lisans gerekmez). Harici kütüphane yok.

## Doğrulanması gereken bilimsel veriler
`data/data.js` içindeki sayılar **yaklaşık**tır (Artemis I uçuşu ve US Standard Atmosphere 1976 esas alındı):
olay zamanları (yan roket ayrılması ~T+2:12, iptal kulesi ~T+3:17, MECO ~T+8:03, çekirdek ayrılması ~T+8:15),
irtifa ve hız profili, atmosfer katmanı sınırları, hangar bilgi kartlarındaki ölçüler.
Araştırmacı bunları NASA kaynaklarından doğrulayıp `CREDITS.md`'ye kaynak eklemeli.

## Oyun mekaniği (game.js)
Fırlatmadan önce oyuncu üç ayar yapar: çekirdek yakıtı (%60–110), yan roket yakıtı (%80–110) ve yük (20–110 t).
Hesap iki aşamalı Tsiolkovsky roket denklemidir (`Game.calc`): Δv = Isp · g0 · ln(m0 / mf). Yörüngeye ulaşmak için gereken Δv 9,3 km/s
(≈7,8 km/s yörünge hızı + ~1,5 km/s kayıp). Isp değerleri (300 s ve 450 s) ve kütleler YAKLAŞIKTIR ve denge için ayarlanmıştır; araştırmacı doğrulamalı.
Sonda görev raporu (skor, Δv bütçesi, zaman çizelgesi, analiz, yazdırma/indirme) çıkar. En iyi skor tarayıcıda (`localStorage`) saklanır.
Test kısayolu: `?core=60&srb=100&payload=60&t=505`.

## Güncelleme notları (son tur)
- Oyunun tamamı İngilizce (arayüz, rapor, bilgi kartları ve görsellerin içindeki yazılar).
- Çizimcinin roket PNG'leri `tools/clean_art.py` ile **4 kat büyütülüp kenarları temizlendi** (pürüzlü silüet yumuşatıldı, kopuk lekeler silindi, çizgiler hafif keskinleştirildi).
  Çizimcinin **özgün (küçük, temizlenmemiş) dosyaları projede tutulmuyor**; çizimcide ve takımın `ayrilmis_assetler` paketinde duruyor.
  Çizimci yeni roket çizimi verirse: özgün PNG'leri geçici bir `art_originals/` klasörüne koyun, `python3 tools/clean_art.py art_originals assets` çalıştırın, sonra `tools/make_sprites.py` ile `data/sprites.js` dosyasını yenileyin (ikisi de özgün dosyaları okur). İş bitince klasörü silin.
- İlk fırlatma aşaması gündüz ve Dünya gibi: mavi gökyüzü, yeşil zemin, yükseldikçe uzaya geçiş, altta mavi atmosfer parıltısı.
- Görev kontrol odası simetrik amfi düzenine alındı (her yanda üç basamak, masalar merkeze bakar).

## Üçüncü tur: gezegenler, ekonomi, rakipler, mekik
- Yeni dosyalar: `economy.js` (bütçe, sözleşmeler, Ar-Ge, rakip ajanslar, 12 turluk sezon), `data/world.js` (hedefler, uzay araçları, Ar-Ge listesi, mekik verisi).
  Rakip ajans adları kurgusaldır. `data/world.js` içindeki mesafe, süre ve Δv değerleri YAKLAŞIKTIR; araştırmacı doğrulamalı.
- Hedefler: Dünya yörüngesi, Ay, Mars, Venüs, Jüpiter. Uzay araçları: Orion mürettebat kapsülü, bilim sondası, kargo iniş aracı.
  Mürettebatlı görevlerde yeterli erzak (yiyecek-su) taşınmazsa mürettebat yolda kaybedilir.
- Uzay Mekiği (çizimcinin `shuttle_idle.png` çizimi) yörüngedeki istasyona erzak taşır; istasyonun erzağı her turda azalır.
- Yeni görseller (Claude ile üretildi): `craft_orbiter`, `craft_outpost`, `craft_probe`, `craft_lander`. Gezegenler kodla çizilir (görsel dosyası yok).
- Kayıt: tarayıcıda `localStorage` anahtarı `smd-save-v2`. Test kısayolu: `?scene=pad&dest=mars&craft=probe&deep=0.5`.

## Dördüncü tur: yerçekimi dönüşü (gravity turn) ve uydu fly-by
- `trajectory.js`: kalkış yörüngesi gerçek fizikten hesaplanır. Roket önce dikey kalkar, ~8. saniyede küçük bir pitch-over (≈1°) yapar, sonra yerçekimi
  uçuş yolunu denklemle bükür: dγ/dt = −(g/v − v/(R+h))·cosγ. Hız profili itki eğrisinden verilir, kick açısı bisection ile motor kesilirken γ≈0 olacak şekilde bulunur.
  İrtifa, yatay mesafe (downrange) ve roketin eğimi bu çözümden gelir. Park yörüngesi ≈243 km, yatay mesafe ≈1430 km (yaklaşık değerler, kaynaktan doğrulanmalı).
- Roket gövdesi ve alevi eğimle birlikte döner, ayrılan parçalar eğik eksene göre savrulur, yıldızlar uçuş yönüne göre kayar.
- Uydular: `data/world.js` içinde 3 kurgusal uydu, aynı park yörüngesinde. Fırlatma gecikmesi (launch window) ayarı kimin yanından geçileceğini belirler; puan: <300 km mesafede 150·(1−d/300).

- Güncelleme: roket eğimi (gravity turn çizimi) kullanıcı isteğiyle kaldırıldı; roket ekranda dikey yükseliyor. `trajectory.js` yalnızca irtifa, hız ve uydu hesabı için kullanılıyor.

## NASA planet photos
Planets are real NASA photographs (public domain) in assets/nasa/. Sources and processing: assets/nasa/CREDITS.txt. Add them to the root CREDITS.md.
Mission Control: wall-size video wall + rear-view engineer desks (rearStation in scene.js).

## Satellite sprites
assets/sats/*.png: hand-drawn style drawings of the real spacecraft (ISS, Hubble, IMECE, Goktürk-2, LRO, CAPSTONE, ARTEMIS P1, MRO, MAVEN, Odyssey, Magellan, Pioneer Venus Orbiter, Parker, Juno, Galileo, Europa Clipper, Landsat 9), generated by oyun/tools/gen_sats.py from their public appearance. They are simplified; the artist can redraw them.

## Solar-system cruise (scientific)
Planet trips show a heliocentric map: orbits and distances to scale (Mercury 0.387, Venus 0.723, Earth 1, Mars 1.524, asteroid belt 2.2-3.2, Jupiter 5.203 AU), planets at their real orbital periods, a tangent (Hohmann-style) transfer ellipse, live Earth distance and radio delay. The Moon trip shows the Sun and the geostationary ring (6.6 Earth radii) with Turksat 5A/5B/6A. Planet sizes are not to scale. Orbital data in data/world.js (WORLD.helio).

## Landing flags
Moon: United States flag (Apollo 11, 20-21 July 1969, first and so far only humans on the Moon). Hover the flag, the Mars lander or the Venus probe for short science notes (data/data.js landingParts).
