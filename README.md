# Penjana RPH Jawi

App web ringkas untuk menghasilkan **Rancangan Pengajaran Harian (RPH)** dalam tulisan Jawi,
mengikut format jadual RPH SRA JAIM (Melaka). Isi data → terus muat turun **Word (.docx)** atau **PDF**.

## Cara guna

1. Buka `dist/RPH-Jawi.html` (satu fail, boleh guna tanpa internet) — atau `index.html` jika menyimpan seluruh folder.
2. Tab **Tetapan**: nama sekolah, tajuk, nama guru, logo, font Jawi & saiz.
3. Tab **RPH**: pilih tarikh — hari, tarikh Masihi dan tarikh Hijri diisi automatik dalam Jawi.
   Taip isi pelajaran dalam Jawi (papan kekunci Jawi anda, atau butang huruf Jawi di bawah borang).
4. **Salin ke hari berikut** — salin RPH ke hari persekolahan seterusnya (tarikh dikemas kini automatik).
5. **Muat turun Word** — semua RPH dalam satu fail `.docx`.
   **Cetak / Simpan PDF** — pilih *Save as PDF* dalam tetingkap cetak.

Data disimpan automatik dalam pelayar. Gunakan **Fail data → Simpan data (.json)** untuk sandaran
atau pindah ke komputer lain.

## Font

Templat asal guna font **Arabic Typesetting** (18pt). Pilih font lain (atau taip nama font sendiri)
di Tetapan. Fail Word akan guna font itu — pastikan font dipasang di komputer yang membuka fail.

## Pembangun

- `index.html`, `style.css`, `app.js` — kod app (tiada pelayan; semuanya dalam pelayar).
- `vendor/docx.umd.js` — pustaka [docx](https://github.com/dolanmiu/docx) 8.5.0 (MIT) untuk menjana `.docx`.
- `python3 build.py` — gabung semua fail menjadi `dist/RPH-Jawi.html`.
