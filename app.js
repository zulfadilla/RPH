/* Penjana RPH Jawi — semua data disimpan dalam pelayar (localStorage). */
(function () {
  "use strict";

  // ---------------------------------------------------------------- data Jawi
  const HARI = ["احد", "اثنين", "ثلاث", "رابو", "خميس", "جمعة", "سبتو"];
  const BULAN_M = ["جانواري", "فيبرواري", "مارچ", "اڤريل", "مي", "جون", "جولاي",
    "اوݢوس", "سيڤتيمبر", "اوکتوبر", "نوۏيمبر", "ديسيمبر"];
  const BULAN_H = ["محرم", "صفر", "ربيع الاول", "ربيع الاخير", "جمادالاول", "جمادالأخير",
    "رجب", "شعبان", "رمضان", "شوال", "ذوالقعدة", "ذوالحجة"];
  // Pilihan masa: 2.30 – 6.15 petang, setiap 15 minit
  const MASA = [];
  for (let m = 14 * 60 + 30; m <= 18 * 60 + 15; m += 15) MASA.push(`${Math.floor(m / 60) - 12}.${String(m % 60).padStart(2, "0")}`);
  const MASA_MULA = "2.30", MASA_TAMAT = "6.15";
  const masaIdx = (t) => MASA.indexOf(t);
  function masaLines(e) {
    if (!e.masaMula && !e.masaTamat && e.masa) return lines(e.masa); // data lama
    return [`${e.masaMula || MASA_MULA} – ${e.masaTamat || MASA_TAMAT}`, "ڤتڠ"];
  }
  const SUBJEK = ["جاوي", "ڤنديديقن القرءان", "عقيدة"];
  const CATATAN = ["چوتي ساكيت", "چوتي خاص", "كورسوس/ بيڠكيل", "مشوارت", "ڨروڬرم سكوله", "لاين۲"];
  const JAWI_PAD = ["ڤ", "ڠ", "چ", "ݢ", "ڬ", "ۏ", "ڽ", "ة", "ء", "أ", "إ", "ى", "۲", "،", "؟"];

  const LABEL = {
    minggu: "ميڠݢو", kelas: "کلس", hari: "هاري", tarikh: "تاريخ", masa: "ماس", kehadiran: "کحاضيرن",
    subjek: "مات ڤلاجرن", sk: "ستندرد کاندوڠن", sp: "ستندرد ڤمبلاجرن", objektif: "اوبجيکتيف ڤمبلاجرن",
    aktiviti: "اکتيۏيتي ڤمبلاجرن", bahan: "باهن بنتو بلاجر", nilai: "نيلاي مورني", penilaian: "ڤنيلاين",
    refleksi: "ايمڤك/ريفليكسي", catatan: "چاتتن", dibawa: "ڤمبلاجرن اکن دباوا کهاري برايکوتڽ",
  };

  const FONTS = [
    { name: "Arabic Typesetting", size: 18, note: "sama seperti templat asal" },
    { name: "Traditional Arabic", size: 14 },
    { name: "Simplified Arabic", size: 12 },
    { name: "Times New Roman", size: 12 },
    { name: "Noto Naskh Arabic", size: 12, note: "font web, sentiasa tersedia" },
    { name: "Amiri", size: 13, note: "font web" },
  ];

  const BLANK = "_____";
  const BLANK_RE = /_{3,}/g;
  const REFLEKSI_DEFAULT = [
    "1. _____ اورڠ موريد داڤت منچاڤاي اوبجيکتيف ڤمبلاجرن يڠ دتتڤكن.",
    "2. _____ اورڠ موريد ماسيه بلوم مڠواساءي اوبجيکتيف ڤمبلاجرن يڠ دتتڤکن. موريد اکن دبري بيمبيڠن برتروسن درڤد ݢورو.",
  ].join("\n");

  const GRID = [890, 1170, 827, 3027, 636, 1284, 1526]; // twip, kanan → kiri
  const TABLE_W = GRID.reduce((a, b) => a + b, 0);
  const GREEN = "A8D08D";

  // ---------------------------------------------------------------- state
  const KEY = "rph-jawi-v1";
  const DEFAULT_SETTINGS = {
    sekolah: "SEKOLAH RENDAH AGAMA JAIM TAMAN DESA MOLEK, 75460 MELAKA",
    tajuk: "رانچڠن ڤڠاجرن هارين ڤنديديقن إسلام",
    disediakan: "سلوى هيدايو بنت عثمان",
    disemak: "",
    font: "Arabic Typesetting",
    fontSize: 18,
    hijriOffset: 0,
    pageBreak: true,
    refleksiTemplate: REFLEKSI_DEFAULT,
    logoKiri: null,
    logoKanan: null,
  };

  function sampleEntry() {
    return {
      id: uid(),
      tarikhISO: "2026-11-16",
      minggu: "45", kelas: "تاهڤ 1", hari: "اثنين",
      tarikhM: "16 نوۏيمبر 2026", tarikhH: "06 جمادالأخير 1448",
      masaMula: MASA_MULA, masaTamat: MASA_TAMAT, kehadiran: "115 /",
      subjek: "عقيدة",
      sk: "اولڠكاجي دان لاتيهن",
      sp: "1. ممباچ اولڠكاجي دان لاتيهن\n2. مماهمي اولڠكاجي دان لاتيهن\n3. منوليس جواڤن اولڠكاجي دان لاتيهن",
      objektif: "دأخير ڨمبلاجرن موريد داڨت ممباچ، مماهمي دان منوليس جواڤن اولڠكاجي دان لاتيهن دڠن بتول.",
      aktiviti: "1. موريد دبري ڨنراڠن دري ڬورو.\n2. موريد ممباچ دان مماهمي اولڠكاجي دان لاتيهن دالم كومڤولن.\n3. موريد منوليس جواڤن اولڠكاجي دان لاتيهن جواب دالم بوكو اكتيۏيتي ماسيڠ۲.",
      bahan: "بوكو اكتيۏيتي", nilai: "تومڤوان", penilaian: "ڤمرهاتين/ ڬرق كرجا برتوليس",
      refleksiNilai: [],
      catatan: [], catatanLain: "",
      dibawa: "اكتيۏيتي تاهڤ 1 سلڤس ڤڤريقساءن اخير تاهون (سوكانيک)",
    };
  }

  function blankEntry() {
    const e = sampleEntry();
    for (const k of ["minggu", "kehadiran", "subjek", "sk", "sp", "objektif", "aktiviti", "bahan", "nilai", "penilaian", "dibawa"]) e[k] = "";
    e.tarikhISO = todayISO();
    applyDate(e);
    return e;
  }

  let state = load();
  let current = state.entries[0] ? state.entries[0].id : null;
  let lastJawiInput = null;

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function todayISO() { const d = new Date(); return iso(d); }
  function iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.entries)) return { settings: { ...DEFAULT_SETTINGS, ...s.settings }, entries: s.entries };
      }
    } catch (_) { /* storage tidak tersedia */ }
    return { settings: { ...DEFAULT_SETTINGS }, entries: [sampleEntry()] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { } }
  const entry = () => state.entries.find((e) => e.id === current);

  // ---------------------------------------------------------------- tarikh
  function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function hijri(date, offset) {
    const d = new Date(date); d.setDate(d.getDate() + Number(offset || 0));
    for (const cal of ["islamic-umalqura", "islamic"]) {
      try {
        const parts = new Intl.DateTimeFormat("en-u-ca-" + cal + "-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
        const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
        if (get("month")) return { d: get("day"), m: get("month"), y: get("year") };
      } catch (_) { }
    }
    return null;
  }
  function applyDate(e) {
    if (!e.tarikhISO) return;
    const d = parseISO(e.tarikhISO);
    e.hari = HARI[d.getDay()];
    e.tarikhM = `${String(d.getDate()).padStart(2, "0")} ${BULAN_M[d.getMonth()]} ${d.getFullYear()}`;
    const h = hijri(d, state ? state.settings.hijriOffset : 0);
    e.tarikhH = h ? `${String(h.d).padStart(2, "0")} ${BULAN_H[h.m - 1]} ${h.y}` : "";
  }
  function nextSchoolDay(isoStr) {
    const d = parseISO(isoStr);
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
    return iso(d);
  }

  // ---------------------------------------------------------------- teks
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  function numbered(s) {
    const ls = lines(s);
    if (ls.length < 2) return ls;
    return ls.map((l, i) => (/^[0-9٠-٩۰-۹]+\s*[.)]/.test(l) ? l : `${i + 1}. ${l}`));
  }
  const refleksiTpl = () => lines(state.settings.refleksiTemplate ?? REFLEKSI_DEFAULT);
  function refleksiVals(e) {
    // data lama (sebelum templat): capai / belum
    if (!Array.isArray(e.refleksiNilai)) e.refleksiNilai = [e.capai || "", e.belum || ""];
    return e.refleksiNilai;
  }
  function refleksiLines(e) {
    const vals = refleksiVals(e);
    let n = 0;
    return refleksiTpl().map((l) => l.replace(BLANK_RE, () => String(vals[n++] ?? "").trim() || BLANK));
  }
  function refleksiFormHTML(e) {
    const vals = refleksiVals(e);
    let n = 0;
    const tpl = refleksiTpl();
    if (!tpl.length) return `<span class="hint">Templat kosong — isi di tab Tetapan.</span>`;
    return `<div class="rf-list">${tpl.map((l) => `<div class="rf-line jawi-in" dir="rtl">${
      l.split(BLANK_RE).map((part, i, arr) => esc(part) + (i < arr.length - 1
        ? `<input type="text" inputmode="numeric" class="rf-in" data-rf="${n}" value="${esc(vals[n++] ?? "")}" placeholder="__" aria-label="Nombor">` : "")).join("")
    }</div>`).join("")}</div>`;
  }
  function catatanLabel(i, e) {
    let t = `${i + 1}. ${CATATAN[i]}`;
    if (i === 5 && e.catatanLain) t += `: ${e.catatanLain}`;
    return t;
  }

  // ---------------------------------------------------------------- form
  const RPH_FIELDS = [
    { legend: "Maklumat kelas", rows: [
      { box: "date-box", rows: [
        { k: "tarikhISO", t: "date", label: "📅 Pilih tarikh", jawi: LABEL.tarikh },
        { quickDates: true },
        { k: "hari", t: "select", options: HARI.slice(1, 6), label: "Hari", jawi: LABEL.hari },
        { grid: [
          { k: "tarikhM", t: "text", label: "Tarikh Masihi (auto)" },
          { k: "tarikhH", t: "text", label: "Tarikh Hijri (auto)" },
        ] },
        { hint: "Pilih tarikh sahaja — hari, tarikh Masihi dan Hijri dalam Jawi diisi automatik (masih boleh diubah)." },
      ] },
      { grid: [
        { k: "minggu", t: "text", label: "Minggu", jawi: LABEL.minggu, plain: true },
        { k: "kelas", t: "text", label: "Kelas", jawi: LABEL.kelas },
      ] },
      { grid: [
        { k: "masaMula", t: "select", options: MASA, plain: true, label: "Masa mula (petang)", jawi: LABEL.masa },
        { k: "masaTamat", t: "select", options: MASA, plain: true, label: "Masa tamat (petang)" },
      ] },
      { k: "kehadiran", t: "text", label: "Kehadiran", jawi: LABEL.kehadiran },
    ] },
    { legend: "Isi pelajaran", rows: [
      { k: "subjek", t: "select", options: SUBJEK, label: "Mata pelajaran", jawi: LABEL.subjek },
      { k: "sk", t: "area", label: "Standard kandungan", jawi: LABEL.sk, rows: 2 },
      { k: "sp", t: "area", label: "Standard pembelajaran", jawi: LABEL.sp, rows: 3, hint: "Satu baris satu perkara — nombor ditambah automatik." },
      { k: "objektif", t: "area", label: "Objektif pembelajaran", jawi: LABEL.objektif, rows: 3 },
      { k: "aktiviti", t: "area", label: "Aktiviti pembelajaran", jawi: LABEL.aktiviti, rows: 4, hint: "Satu baris satu aktiviti — nombor ditambah automatik." },
    ] },
    { legend: "Bahan, nilai & penilaian", rows: [
      { k: "bahan", t: "text", label: "Bahan bantu belajar", jawi: LABEL.bahan },
      { grid: [
        { k: "nilai", t: "text", label: "Nilai murni", jawi: LABEL.nilai },
        { k: "penilaian", t: "text", label: "Penilaian", jawi: LABEL.penilaian },
      ] },
    ] },
    { legend: "Impak / refleksi", rows: [
      { refleksi: true },
      { hint: "Isi nombor dalam kotak. Biarkan kosong untuk garisan _____ (isi dengan tangan). Ayat templat boleh diubah di tab Tetapan." },
    ] },
    { legend: "Catatan", rows: [{ catatan: true }, { k: "catatanLain", t: "text", label: "Lain-lain (jika ada)" }] },
    { legend: "Pembelajaran dibawa ke hari berikutnya", rows: [{ k: "dibawa", t: "area", label: "", jawi: LABEL.dibawa, rows: 2 }] },
  ];

  function fieldHTML(f, src) {
    const id = `f_${f.k}`;
    const val = src[f.k] ?? "";
    const jawiCls = f.t !== "date" && !f.plain ? "jawi-in" : "";
    let input;
    if (f.t === "select") {
      const opts = val && !f.options.includes(val) ? [...f.options, val] : f.options;
      input = `<select id="${id}" data-k="${f.k}" ${f.plain ? "" : 'class="jawi-in" dir="rtl"'}>${val ? "" : `<option value="" selected disabled>— Pilih —</option>`}${
        opts.map((o) => `<option value="${esc(o)}" ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    } else if (f.t === "area") input = `<textarea id="${id}" data-k="${f.k}" rows="${f.rows || 3}" class="${jawiCls}">${esc(val)}</textarea>`;
    else if (f.t === "date") input = `<input type="date" id="${id}" data-k="${f.k}" value="${esc(val)}">`;
    else input = `<input type="text" id="${id}" data-k="${f.k}" value="${esc(val)}" class="${jawiCls}" ${f.plain ? 'dir="auto"' : ""}>`;
    const lbl = f.label || f.jawi ? `<label for="${id}"><span>${esc(f.label)}</span>${f.jawi ? `<span class="jl" dir="rtl">${esc(f.jawi)}</span>` : ""}</label>` : "";
    return `<div class="f">${lbl}${input}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ""}</div>`;
  }

  function renderRphForm() {
    const form = document.getElementById("formRph");
    const e = entry();
    if (!e) { form.innerHTML = `<p class="empty">Tiada RPH. Tekan “+ RPH baharu”.</p>`; return; }
    const row = (r) => {
      if (r.box) return `<div class="${r.box}">${r.rows.map(row).join("")}</div>`;
      if (r.quickDates) return `<div class="quick-dates">${[["Semalam", -1], ["Hari ini", 0], ["Esok", 1]].map(([t, d]) => `<button type="button" class="btn small" data-qd="${d}">${t}</button>`).join("")}</div>`;
      if (r.grid) return `<div class="grid2">${r.grid.map((f) => fieldHTML(f, e)).join("")}</div>`;
      if (r.hint) return `<span class="hint">${esc(r.hint)}</span>`;
      if (r.refleksi) return refleksiFormHTML(e);
      if (r.catatan) return `<div class="cat-grid">${CATATAN.map((c, i) => `<label><input type="checkbox" data-cat="${i}" ${e.catatan.includes(i) ? "checked" : ""}> ${esc(c)}</label>`).join("")}</div>`;
      return fieldHTML(r, e);
    };
    form.innerHTML = RPH_FIELDS.map((fs) => `<fieldset><legend>${esc(fs.legend)}</legend>${fs.rows.map(row).join("")}</fieldset>`).join("");
  }

  function renderSetForm() {
    const s = state.settings;
    const known = FONTS.some((f) => f.name === s.font);
    const form = document.getElementById("formSet");
    form.innerHTML = `
      <fieldset><legend>Kepala surat</legend>
        ${fieldHTML({ k: "sekolah", t: "text", label: "Nama sekolah (Rumi)", plain: true }, s)}
        ${fieldHTML({ k: "tajuk", t: "text", label: "Tajuk (Jawi)" }, s)}
        <div class="f"><label>Logo kiri &amp; kanan</label>
          <div class="logo-row">
            <img id="imgKiri" alt="Logo kiri"><input type="file" accept="image/*" data-logo="logoKiri">
          </div>
          <div class="logo-row" style="margin-top:6px">
            <img id="imgKanan" alt="Logo kanan"><input type="file" accept="image/*" data-logo="logoKanan">
          </div>
          <button type="button" class="btn small" id="btnLogoReset" style="margin-top:6px;align-self:flex-start">Guna logo asal</button>
        </div>
      </fieldset>
      <fieldset><legend>Templat Impak / Refleksi</legend>
        ${fieldHTML({ k: "refleksiTemplate", t: "area", label: "Ayat refleksi", jawi: LABEL.refleksi, rows: 5,
          hint: "Satu baris satu poin. Tulis _____ (garis bawah) di tempat nombor — dalam borang RPH ia jadi kotak untuk diisi." }, s)}
        <button type="button" class="btn small" id="btnRfReset" style="margin-top:6px;align-self:flex-start">Guna templat asal</button>
      </fieldset>
      <fieldset><legend>Tandatangan</legend>
        ${fieldHTML({ k: "disediakan", t: "text", label: "Disediakan oleh", jawi: "دسدياكن اوليه" }, s)}
        ${fieldHTML({ k: "disemak", t: "text", label: "Disemak oleh", jawi: "دسيمق اوليه" }, s)}
      </fieldset>
      <fieldset><legend>Font Jawi</legend>
        <div class="f"><label for="selFont">Font</label>
          <select id="selFont">
            ${FONTS.map((f) => `<option value="${esc(f.name)}" ${f.name === s.font ? "selected" : ""}>${esc(f.name)}${f.note ? " — " + esc(f.note) : ""}</option>`).join("")}
            <option value="__custom" ${known ? "" : "selected"}>Lain-lain (taip nama font)…</option>
          </select>
        </div>
        <div class="f" id="customFontWrap" ${known ? "hidden" : ""}><label for="inpFont">Nama font (seperti dalam Word)</label>
          <input type="text" id="inpFont" value="${esc(known ? "" : s.font)}" placeholder="cth: Jawi Uthman Taha">
          <span class="hint">Font mesti dipasang pada komputer yang membuka fail Word.</span>
        </div>
        <span class="hint" id="fontWarn"></span>
        <div class="grid2">
          <div class="f"><label for="f_fontSize">Saiz font (pt)</label><input type="number" min="8" max="36" step="1" id="f_fontSize" data-k="fontSize" value="${esc(s.fontSize)}"></div>
          <div class="f"><label for="f_hijriOffset">Pelarasan Hijri (hari)</label><input type="number" min="-2" max="2" step="1" id="f_hijriOffset" data-k="hijriOffset" value="${esc(s.hijriOffset)}"></div>
        </div>
      </fieldset>
      <fieldset><legend>Susun atur</legend>
        <label class="chk"><input type="checkbox" id="chkPageBreak" ${s.pageBreak ? "checked" : ""}> Setiap RPH bermula pada muka surat baharu</label>
      </fieldset>`;
    refreshLogoPreviews();
  }

  const logoSrc = (side) => state.settings[side === "kiri" ? "logoKiri" : "logoKanan"]?.src || (window.DEFAULT_LOGOS || {})[side] || "";
  function refreshLogoPreviews() {
    const a = document.getElementById("imgKiri"), b = document.getElementById("imgKanan");
    if (a) a.src = logoSrc("kiri");
    if (b) b.src = logoSrc("kanan");
  }

  function renderSelect() {
    const sel = document.getElementById("selRph");
    sel.innerHTML = state.entries.map((e, i) => `<option value="${e.id}" ${e.id === current ? "selected" : ""}>${i + 1}. ${esc(e.tarikhISO || "")} — ${esc(e.subjek || "(tiada tajuk)")}</option>`).join("");
  }

  // ---------------------------------------------------------------- pratonton
  function fontInstalled(name) {
    try {
      const c = document.createElement("canvas").getContext("2d");
      const txt = "رانچڠن ڤڠاجرن abcXYZ 123";
      return ["serif", "sans-serif", "monospace"].some((b) => {
        c.font = `40px ${b}`; const w0 = c.measureText(txt).width;
        c.font = `40px "${name}", ${b}`; return c.measureText(txt).width !== w0;
      });
    } catch (_) { return true; }
  }
  function updateFontWarn() {
    const el = document.getElementById("fontWarn"); if (!el) return;
    const f = state.settings.font;
    const web = ["Noto Naskh Arabic", "Amiri"].includes(f);
    el.textContent = !web && !fontInstalled(f)
      ? `Font “${f}” tidak dijumpai pada peranti ini — pratonton/PDF guna font ganti (Noto Naskh Arabic). Fail Word tetap guna “${f}” apabila dibuka di komputer yang ada font tersebut.`
      : "";
    el.style.color = "#b3261e";
  }

  function applyFontVars() {
    const s = state.settings;
    document.documentElement.style.setProperty("--jawi", `"${s.font.replace(/"/g, "")}", "Arabic Typesetting", "Noto Naskh Arabic", "Amiri", serif`);
    document.documentElement.style.setProperty("--jawi-size", `${Number(s.fontSize) || 18}pt`);
    updateFontWarn();
  }

  const ps = (arr) => arr.map((l) => `<p>${esc(l)}</p>`).join("") || "<p>&nbsp;</p>";

  function rphHTML(e) {
    const s = state.settings;
    const lbl = (t, span = 2) => `<td class="lbl" colspan="${span}">${esc(t)}</td>`;
    const body = (html, span = 5) => `<td colspan="${span}">${html}</td>`;
    const catRows = [0, 2, 4].map((i) => `<tr>${[i, i + 1].map((j) => `<td>${esc(catatanLabel(j, e))}</td><td style="width:1.3em"><span class="box">${e.catatan.includes(j) ? "/" : ""}</span></td>`).join("")}</tr>`).join("");
    return `
    <div class="paper">
      <div class="rph-head">
        <img src="${logoSrc("kiri")}" alt="">
        <div class="ht"><div class="school">${esc(s.sekolah)}</div><div class="title" dir="rtl">${esc(s.tajuk)}</div></div>
        <img src="${logoSrc("kanan")}" alt="">
      </div>
      <div class="rph-head-line"></div>
      <table class="rph">
        <colgroup>${GRID.map((w) => `<col style="width:${(w / TABLE_W * 100).toFixed(2)}%">`).join("")}</colgroup>
        <tr>${[LABEL.minggu, LABEL.kelas, LABEL.hari, LABEL.tarikh].map((t) => `<td class="lbl c">${t}</td>`).join("")}<td class="lbl c" colspan="2">${LABEL.masa}</td><td class="lbl c">${LABEL.kehadiran}</td></tr>
        <tr>
          <td class="c">${esc(e.minggu)}</td><td class="c">${esc(e.kelas)}</td><td class="c">${esc(e.hari)}</td>
          <td class="c">${ps([e.tarikhM, e.tarikhH].filter(Boolean))}</td>
          <td class="c" colspan="2">${ps(masaLines(e))}</td><td class="c">${esc(e.kehadiran)}</td>
        </tr>
        <tr>${lbl(LABEL.subjek)}${body(`<b>${esc(e.subjek)}</b>`)}</tr>
        <tr>${lbl(LABEL.sk)}${body(ps(lines(e.sk)))}</tr>
        <tr>${lbl(LABEL.sp)}${body(ps(numbered(e.sp)))}</tr>
        <tr>${lbl(LABEL.objektif)}${body(ps(lines(e.objektif)))}</tr>
        <tr>${lbl(LABEL.aktiviti)}${body(ps(numbered(e.aktiviti)))}</tr>
        <tr>${lbl(LABEL.bahan)}<td class="lbl c" colspan="3">${LABEL.nilai}</td><td class="lbl c" colspan="2">${LABEL.penilaian}</td></tr>
        <tr><td colspan="2">${ps(lines(e.bahan))}</td><td class="c" colspan="3">${ps(lines(e.nilai))}</td><td colspan="2">${ps(lines(e.penilaian))}</td></tr>
        <tr>${lbl(LABEL.refleksi)}${body(ps(refleksiLines(e)))}</tr>
        <tr>${lbl(LABEL.catatan)}${body(`<table class="cat">${catRows}</table>`)}</tr>
        <tr>${lbl(LABEL.dibawa)}${body(ps(lines(e.dibawa)))}</tr>
      </table>
      <div class="sign">
        <div>دسدياكن اوليه : <u>${esc(s.disediakan)}</u></div>
        <div>دسيمق اوليه : ${esc(s.disemak)}</div>
      </div>
    </div>`;
  }

  let renderTimer = 0;
  function renderPreview(now) {
    clearTimeout(renderTimer);
    const run = () => {
      applyFontVars();
      const all = document.getElementById("chkAll").checked;
      const list = all ? state.entries : state.entries.filter((e) => e.id === current);
      document.getElementById("preview").innerHTML = list.length ? list.map(rphHTML).join("") : `<div class="empty">Tiada RPH.</div>`;
    };
    if (now) run(); else renderTimer = setTimeout(run, 120);
  }

  // ---------------------------------------------------------------- Word (.docx)
  function dataURLtoBytes(url) {
    const b64 = url.split(",")[1] || "";
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function imgSize(src) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => res({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
      im.onerror = () => res({ w: 1, h: 1 });
      im.src = src;
    });
  }

  async function buildDocx(entries) {
    const D = window.docx;
    if (!D) throw new Error("Pustaka Word tidak dimuatkan.");
    const s = state.settings;
    const F = s.font;
    const SZ = Math.round((Number(s.fontSize) || 18) * 2);
    const font = { ascii: F, hAnsi: F, cs: F, eastAsia: F };

    const run = (text, o = {}) => new D.TextRun({ text, font, size: o.size || SZ, sizeComplexScript: o.size || SZ, bold: !!o.bold, boldComplexScript: !!o.bold, rightToLeft: true, underline: o.u ? {} : undefined });
    const para = (text, o = {}) => new D.Paragraph({
      bidirectional: true,
      alignment: o.center ? D.AlignmentType.CENTER : undefined,
      spacing: { before: 0, after: 0 },
      children: o.children || [run(text, o)],
    });
    const paras = (arr, o) => (arr.length ? arr : [""]).map((t) => para(t, o));
    const cell = (children, o = {}) => new D.TableCell({
      children,
      columnSpan: o.span || 1,
      width: { size: o.w, type: D.WidthType.DXA },
      verticalAlign: D.VerticalAlign.CENTER,
      margins: { left: 80, right: 80, top: 0, bottom: 0 },
      shading: o.green ? { type: D.ShadingType.CLEAR, color: "auto", fill: GREEN } : undefined,
      borders: o.borders,
    });
    const w = (from, n) => GRID.slice(from, from + n).reduce((a, b) => a + b, 0);
    const lblCell = (t, from = 0, n = 2, center = false) => cell([para(t, { bold: true, center })], { span: n, w: w(from, n), green: true });
    const bodyCell = (children) => cell(children, { span: 5, w: w(2, 5) });

    const NONE = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const LINE = { style: D.BorderStyle.SINGLE, size: 6, color: "000000" };
    const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

    function catatanTable(e) {
      const lw = 3150, bw = 400;
      const rows = [0, 2, 4].map((i) => new D.TableRow({
        children: [i, i + 1].flatMap((j) => [
          cell([para(catatanLabel(j, e))], { w: lw, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE } }),
          cell([para(e.catatan.includes(j) ? "/" : "", { center: true })], { w: bw, borders: { top: LINE, bottom: LINE, left: LINE, right: LINE } }),
        ]),
      }));
      return new D.Table({
        rows, visuallyRightToLeft: true, layout: D.TableLayoutType.FIXED,
        columnWidths: [lw, bw, lw, bw], width: { size: 2 * (lw + bw), type: D.WidthType.DXA }, borders: noBorders,
      });
    }

    function rphTable(e) {
      const hdr = [LABEL.minggu, LABEL.kelas, LABEL.hari, LABEL.tarikh];
      const rows = [
        new D.TableRow({ children: [
          ...hdr.map((t, i) => lblCell(t, i, 1, true)),
          lblCell(LABEL.masa, 4, 2, true), lblCell(LABEL.kehadiran, 6, 1, true),
        ] }),
        new D.TableRow({ children: [
          cell([para(e.minggu, { center: true })], { w: w(0, 1) }),
          cell([para(e.kelas, { center: true })], { w: w(1, 1) }),
          cell([para(e.hari, { center: true })], { w: w(2, 1) }),
          cell(paras([e.tarikhM, e.tarikhH].filter(Boolean), { center: true }), { w: w(3, 1) }),
          cell(paras(masaLines(e), { center: true }), { span: 2, w: w(4, 2) }),
          cell([para(e.kehadiran, { center: true })], { w: w(6, 1) }),
        ] }),
        new D.TableRow({ children: [lblCell(LABEL.subjek), bodyCell([para(e.subjek, { bold: true })])] }),
        new D.TableRow({ children: [lblCell(LABEL.sk), bodyCell(paras(lines(e.sk)))] }),
        new D.TableRow({ children: [lblCell(LABEL.sp), bodyCell(paras(numbered(e.sp)))] }),
        new D.TableRow({ children: [lblCell(LABEL.objektif), bodyCell(paras(lines(e.objektif)))] }),
        new D.TableRow({ children: [lblCell(LABEL.aktiviti), bodyCell(paras(numbered(e.aktiviti)))] }),
        new D.TableRow({ children: [lblCell(LABEL.bahan), lblCell(LABEL.nilai, 2, 3, true), lblCell(LABEL.penilaian, 5, 2, true)] }),
        new D.TableRow({ children: [
          cell(paras(lines(e.bahan)), { span: 2, w: w(0, 2) }),
          cell(paras(lines(e.nilai), { center: true }), { span: 3, w: w(2, 3) }),
          cell(paras(lines(e.penilaian)), { span: 2, w: w(5, 2) }),
        ] }),
        new D.TableRow({ children: [lblCell(LABEL.refleksi), bodyCell(paras(refleksiLines(e)))] }),
        new D.TableRow({ children: [lblCell(LABEL.catatan), bodyCell([catatanTable(e), para("")])] }),
        new D.TableRow({ children: [lblCell(LABEL.dibawa), bodyCell(paras(lines(e.dibawa)))] }),
      ];
      return new D.Table({
        rows, visuallyRightToLeft: true, layout: D.TableLayoutType.FIXED,
        columnWidths: GRID, width: { size: TABLE_W, type: D.WidthType.DXA },
      });
    }

    const signature = () => [
      para(""),
      para("", { children: [run("دسدياكن اوليه : "), run(s.disediakan, { u: true })] }),
      para(`دسيمق اوليه : ${s.disemak || ""}`),
    ];

    // kepala surat
    // ukuran logo dikira sekali; objek imej baharu dicipta untuk setiap kepala surat
    const logoInfo = async (side) => {
      const src = logoSrc(side);
      if (!src) return null;
      const { w: iw, h: ih } = await imgSize(src);
      const wpx = Math.min(64, Math.round(50 * iw / ih));
      return { src, w: wpx, h: Math.round(wpx * ih / iw) };
    };
    const [infoL, infoR] = await Promise.all([logoInfo("kiri"), logoInfo("kanan")]);
    const logoPara = (info) => info
      ? new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ data: dataURLtoBytes(info.src), transformation: { width: info.w, height: info.h } })] })
      : new D.Paragraph({ children: [] });
    const header = () => new D.Header({ children: [
      new D.Table({
        layout: D.TableLayoutType.FIXED, columnWidths: [1300, 6760, 1300], width: { size: TABLE_W, type: D.WidthType.DXA }, borders: noBorders,
        rows: [new D.TableRow({ children: [
          new D.TableCell({ children: [logoPara(infoL)], width: { size: 1300, type: D.WidthType.DXA }, verticalAlign: D.VerticalAlign.CENTER, borders: noBorders }),
          new D.TableCell({ verticalAlign: D.VerticalAlign.CENTER, width: { size: 6760, type: D.WidthType.DXA }, borders: noBorders, children: [
            new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: s.sekolah, font: "Arial", size: 17 })] }),
            new D.Paragraph({ alignment: D.AlignmentType.CENTER, bidirectional: true, children: [new D.TextRun({ text: s.tajuk, font, size: Math.round(SZ * 0.75), sizeComplexScript: Math.round(SZ * 0.75), rightToLeft: true })] }),
          ] }),
          new D.TableCell({ children: [logoPara(infoR)], width: { size: 1300, type: D.WidthType.DXA }, verticalAlign: D.VerticalAlign.CENTER, borders: noBorders }),
        ] })],
      }),
      new D.Paragraph({ border: { bottom: { style: D.BorderStyle.THICK_THIN_SMALL_GAP, size: 18, color: "7B1F1F", space: 1 } }, children: [] }),
    ] });

    const pageProps = {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 941, bottom: 568, left: 1440, right: 1440, header: 448, footer: 0 },
      },
    };
    const block = (e) => [rphTable(e), ...signature()];
    const sections = s.pageBreak
      ? entries.map((e) => ({ properties: pageProps, headers: { default: header() }, children: block(e) }))
      : [{ properties: pageProps, headers: { default: header() }, children: entries.flatMap((e, i) => (i ? [para(""), para(""), ...block(e)] : block(e))) }];

    const doc = new D.Document({
      creator: "Penjana RPH Jawi",
      title: "RPH",
      styles: { default: { document: { run: { font, size: SZ, sizeComplexScript: SZ } } } },
      sections,
    });
    return fixDocx(await D.Packer.toBlob(doc));
  }

  // Betulkan XML supaya Microsoft Word (yang ketat) boleh membuka fail:
  //  1) susunan elemen dalam <w:rPr> mesti ikut skema OOXML
  //  2) setiap <wp:docPr id> (imej) mesti unik dalam seluruh dokumen
  const RPR_ORDER = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline",
    "shadow", "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern",
    "position", "sz", "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs", "em",
    "lang", "eastAsianLayout", "specVanish", "oMath"];
  async function fixDocx(blob) {
    if (!window.JSZip) return blob;
    const zip = await window.JSZip.loadAsync(blob);
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
    const parts = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*|styles)\.xml$/.test(n)).sort();
    let docPrId = 1;
    for (const name of parts) {
      const xml = await zip.file(name).async("string");
      const dom = new DOMParser().parseFromString(xml, "application/xml");
      if (dom.getElementsByTagName("parsererror").length) continue;
      for (const rPr of Array.from(dom.getElementsByTagNameNS(W, "rPr"))) {
        const kids = Array.from(rPr.children);
        const rank = (el) => { const i = RPR_ORDER.indexOf(el.localName); return i < 0 ? 999 : i; };
        kids.slice().sort((a, b) => rank(a) - rank(b)).forEach((el) => rPr.appendChild(el));
      }
      for (const dp of Array.from(dom.getElementsByTagNameNS(WP, "docPr"))) dp.setAttribute("id", String(docPrId++));
      let out = new XMLSerializer().serializeToString(dom);
      if (!out.startsWith("<?xml")) out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + out;
      zip.file(name, out);
    }
    return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function fileName(ext) {
    const ds = state.entries.map((e) => e.tarikhISO).filter(Boolean).sort();
    const tag = ds.length ? (ds[0] === ds[ds.length - 1] ? ds[0] : `${ds[0]}_${ds[ds.length - 1]}`) : todayISO();
    const m = (state.entries[0] && state.entries[0].minggu) ? `M${state.entries[0].minggu}_` : "";
    return `RPH_${m}${tag}.${ext}`;
  }

  // ---------------------------------------------------------------- UI events
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function refreshAll() { renderSelect(); renderRphForm(); renderPreview(true); }

  function bind() {
    // tabs
    document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
      document.getElementById("tab-rph").hidden = b.dataset.tab !== "rph";
      document.getElementById("tab-tetapan").hidden = b.dataset.tab !== "tetapan";
    }));

    // RPH form
    const fr = document.getElementById("formRph");
    fr.addEventListener("input", (ev) => {
      const e = entry(); if (!e) return;
      const el = ev.target;
      if (el.dataset.rf !== undefined) {
        const vals = refleksiVals(e);
        vals[Number(el.dataset.rf)] = el.value;
      } else if (el.dataset.cat !== undefined) {
        const i = Number(el.dataset.cat);
        e.catatan = el.checked ? [...new Set([...e.catatan, i])].sort() : e.catatan.filter((x) => x !== i);
      } else if (el.dataset.k) {
        e[el.dataset.k] = el.value;
        if (el.dataset.k === "tarikhISO") {
          applyDate(e);
          const sel = document.getElementById("f_hari");
          if (sel && ![...sel.options].some((o) => o.value === e.hari)) renderRphForm(); // hujung minggu
          for (const k of ["hari", "tarikhM", "tarikhH"]) { const x = document.getElementById("f_" + k); if (x) x.value = e[k]; }
        }
        if (["tarikhISO", "subjek"].includes(el.dataset.k)) renderSelect();
        if (["masaMula", "masaTamat"].includes(el.dataset.k)) {
          delete e.masa;
          e.masaMula = e.masaMula || MASA_MULA; e.masaTamat = e.masaTamat || MASA_TAMAT;
          if (masaIdx(e.masaTamat) <= masaIdx(e.masaMula)) {
            if (el.dataset.k === "masaMula") e.masaTamat = MASA[Math.min(MASA.length - 1, masaIdx(e.masaMula) + 1)];
            else e.masaMula = MASA[Math.max(0, masaIdx(e.masaTamat) - 1)];
            document.getElementById("f_masaMula").value = e.masaMula;
            document.getElementById("f_masaTamat").value = e.masaTamat;
          }
        }
      }
      save(); renderPreview();
    });

    fr.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-qd]"); if (!b) return;
      const d = new Date(); d.setDate(d.getDate() + Number(b.dataset.qd));
      const inp = document.getElementById("f_tarikhISO");
      inp.value = iso(d);
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // settings form
    const fs = document.getElementById("formSet");
    fs.addEventListener("input", (ev) => {
      const s = state.settings, el = ev.target;
      if (el.id === "selFont") {
        const custom = el.value === "__custom";
        document.getElementById("customFontWrap").hidden = !custom;
        if (!custom) {
          s.font = el.value;
          const f = FONTS.find((x) => x.name === el.value);
          if (f) { s.fontSize = f.size; document.getElementById("f_fontSize").value = f.size; }
        } else if (document.getElementById("inpFont").value.trim()) s.font = document.getElementById("inpFont").value.trim();
      } else if (el.id === "inpFont") {
        if (el.value.trim()) s.font = el.value.trim();
      } else if (el.id === "chkPageBreak") {
        s.pageBreak = el.checked;
      } else if (el.dataset.k) {
        s[el.dataset.k] = el.type === "number" ? Number(el.value) : el.value;
        if (el.dataset.k === "hijriOffset") { state.entries.forEach(applyDate); renderRphForm(); }
        if (el.dataset.k === "refleksiTemplate") renderRphForm();
      }
      save(); renderPreview();
    });
    fs.addEventListener("change", async (ev) => {
      const el = ev.target;
      if (!el.dataset.logo || !el.files[0]) return;
      try {
        state.settings[el.dataset.logo] = { src: await toPNG(el.files[0]) };
        save(); refreshLogoPreviews(); renderPreview(true);
      } catch (_) { toast("Gambar tidak dapat dibaca."); }
    });
    fs.addEventListener("click", (ev) => {
      if (ev.target.id === "btnRfReset") {
        state.settings.refleksiTemplate = REFLEKSI_DEFAULT;
        document.getElementById("f_refleksiTemplate").value = REFLEKSI_DEFAULT;
        save(); renderRphForm(); renderPreview(true);
      }
      if (ev.target.id === "btnLogoReset") {
        state.settings.logoKiri = null; state.settings.logoKanan = null;
        save(); refreshLogoPreviews(); renderPreview(true);
      }
    });

    // RPH list
    document.getElementById("selRph").addEventListener("change", (ev) => { current = ev.target.value; renderRphForm(); renderPreview(true); });
    document.getElementById("btnAdd").addEventListener("click", () => {
      const e = blankEntry();
      const prev = entry();
      if (prev) { e.minggu = prev.minggu; e.kelas = prev.kelas; e.masaMula = prev.masaMula; e.masaTamat = prev.masaTamat; e.masa = prev.masa; }
      state.entries.push(e); current = e.id; save(); refreshAll();
      toast("RPH baharu ditambah.");
    });
    document.getElementById("btnNextDay").addEventListener("click", () => {
      const p = entry(); if (!p) return;
      const e = { ...JSON.parse(JSON.stringify(p)), id: uid(), refleksiNilai: [], kehadiran: p.kehadiran };
      e.tarikhISO = nextSchoolDay(p.tarikhISO || todayISO());
      applyDate(e);
      const idx = state.entries.findIndex((x) => x.id === p.id);
      state.entries.splice(idx + 1, 0, e); current = e.id; save(); refreshAll();
      toast(`Disalin ke ${e.tarikhISO}.`);
    });
    document.getElementById("btnDel").addEventListener("click", () => {
      const p = entry(); if (!p) return;
      if (!confirm("Padam RPH ini?")) return;
      const idx = state.entries.findIndex((x) => x.id === p.id);
      state.entries.splice(idx, 1);
      current = state.entries[Math.max(0, idx - 1)]?.id || null;
      save(); refreshAll();
    });
    document.getElementById("chkAll").addEventListener("change", () => renderPreview(true));

    // export
    document.getElementById("btnWord").addEventListener("click", async () => {
      if (!state.entries.length) return toast("Tiada RPH untuk dieksport.");
      try {
        toast("Menjana fail Word…");
        download(await buildDocx(state.entries), fileName("docx"));
        toast("Fail Word dimuat turun.");
      } catch (err) { console.error(err); toast("Gagal menjana Word: " + err.message); }
    });
    document.getElementById("btnPdf").addEventListener("click", () => {
      const chk = document.getElementById("chkAll");
      const was = chk.checked; chk.checked = true; renderPreview(true);
      setTimeout(() => { window.print(); if (!was) { chk.checked = false; renderPreview(true); } }, 150);
    });
    document.getElementById("btnExportJson").addEventListener("click", () => {
      download(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), fileName("json"));
    });
    document.getElementById("inpImportJson").addEventListener("change", async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const s = JSON.parse(await f.text());
        if (!Array.isArray(s.entries)) throw new Error("format");
        state = { settings: { ...DEFAULT_SETTINGS, ...s.settings }, entries: s.entries.map((e) => ({ ...sampleEntry(), ...e })) };
        current = state.entries[0]?.id || null; save(); renderSetForm(); refreshAll();
        toast("Data dibuka.");
      } catch (_) { toast("Fail data tidak sah."); }
      ev.target.value = "";
    });
    document.getElementById("btnReset").addEventListener("click", () => {
      if (!confirm("Padam semua RPH dan tetapan?")) return;
      state = { settings: { ...DEFAULT_SETTINGS }, entries: [sampleEntry()] };
      current = state.entries[0].id; save(); renderSetForm(); refreshAll();
    });

    // papan huruf Jawi
    document.addEventListener("focusin", (ev) => {
      if (ev.target.classList && ev.target.classList.contains("jawi-in") && ev.target.tagName !== "SELECT") lastJawiInput = ev.target;
    });
    const pad = document.getElementById("jawiPad");
    JAWI_PAD.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = ch; b.title = "Masukkan " + ch;
      b.addEventListener("mousedown", (ev) => ev.preventDefault());
      b.addEventListener("click", () => {
        const el = lastJawiInput; if (!el || !document.body.contains(el)) return toast("Klik pada ruangan Jawi dahulu.");
        const a = el.selectionStart ?? el.value.length, z = el.selectionEnd ?? el.value.length;
        el.value = el.value.slice(0, a) + ch + el.value.slice(z);
        el.selectionStart = el.selectionEnd = a + ch.length;
        el.focus();
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      pad.appendChild(b);
    });
  }

  function toPNG(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, 300 / Math.max(im.naturalWidth, im.naturalHeight));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(im.naturalWidth * k));
          c.height = Math.max(1, Math.round(im.naturalHeight * k));
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL("image/png"));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------- mula
  renderSetForm();
  bind();
  refreshAll();
})();
