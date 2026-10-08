# Life Dashboard — Project Steering

## Deskripsi Project

**Life Dashboard** adalah aplikasi web single-page (SPA) berbasis vanilla JavaScript yang berjalan sepenuhnya di browser tanpa backend atau build tool. Aplikasi ini berfungsi sebagai dashboard produktivitas personal dengan fitur-fitur berikut:

- **Custom Name** — pengguna memasukkan nama mereka, disimpan via localStorage
- **Light / Dark Mode** — toggle tema, persisten via localStorage
- **Focus Timer (Pomodoro)** — timer hitung mundur dengan settings panel (preset 15/25/45/60 menit dan custom), SVG progress ring, serta empat visual state (`idle`, `running`, `paused`, `finished`)
- **To-Do List** — CRUD task (tambah, edit, hapus, toggle selesai), validasi duplikat case-insensitive, sort dengan 7 opsi, progress summary + progress bar
- **Quick Links** — simpan dan kelola link favorit

Semua data persisten menggunakan `localStorage` dengan enam key yang didefinisikan di objek `KEYS` dalam `js/script.js`.

---

## Stack Teknologi

| Layer  | Teknologi                      |
|--------|-------------------------------|
| HTML   | Semantic HTML5, satu file      |
| CSS    | Vanilla CSS, custom properties (`var(--...)`) |
| JS     | Vanilla ES6+, no framework     |
| Data   | `localStorage` hanya           |
| Build  | Tidak ada — buka langsung di browser |

**Tidak ada:**
- Node.js / npm
- Framework (React, Vue, Angular, dll.)
- CSS preprocessor (Sass, Less)
- External library atau CDN
- Backend / API

---

## Struktur File

```
index.html          # Markup utama, satu-satunya HTML file
css/style.css       # Semua styling, di-append berurutan per fitur
js/script.js        # Semua logic, dibagi per section dengan komentar blok
.gitattributes      # LF normalization
.kiro/              # Konfigurasi Kiro IDE
.agents/tasks/      # Artefak workflow agent (plan, review, dll.)
```

---

## Konvensi Coding

### HTML
- Semantic elements (`<section>`, `<header>`, dll.) dengan `id` deskriptif
- Setiap interaktif element wajib punya `aria-label` atau label terhubung
- Tidak ada inline `<style>` — semua styling di `css/style.css`

### CSS
- Semua warna, spacing, dan typography menggunakan CSS custom properties (`--accent`, `--bg-primary`, `--border`, dll.)
- CSS ditambahkan secara append per fitur — **jangan hapus rule yang sudah ada** kecuali memang duplikat/stale
- Penamaan class: `kebab-case`, deskriptif fungsi bukan tampilan (`task-item` bukan `blue-box`)
- Setiap blok fitur baru diawali komentar section: `/* === FITUR: NAMA === */`

### JavaScript
- `script.js` dibagi ke section bernomor dengan komentar blok:
  ```
  /* === SECTION 1: CONSTANTS & STATE === */
  /* === SECTION 2: LOCALSTORAGE === */
  /* === SECTION 3: RENDER — THEME & USERNAME === */
  /* === SECTION 4: TIMER === */
  /* === SECTION 5: TASKS === */
  /* === SECTION 6: LINKS === */
  /* === SECTION 7: MODAL === */
  /* === SECTION 8: THEME & USERNAME HANDLERS === */
  /* === SECTION 9: EVENT LISTENERS === */
  /* === SECTION 10: INIT === */
  ```
- Semua DOM access menggunakan `getElementById` atau `querySelector` — selalu cek `null` sebelum digunakan (`if (!el) return`)
- Jangan mutasi `state.tasks` saat render/sort — gunakan spread copy: `[...state.tasks]`
- Event listener untuk list items menggunakan event delegation bila memungkinkan

### localStorage Keys
Semua key didefinisikan di objek `KEYS` (jangan hardcode string):
```js
const KEYS = {
  username:      'dashboard_username',
  theme:         'dashboard_theme',
  tasks:         'dashboard_tasks',
  links:         'dashboard_links',
  timerDuration: 'dashboard_timer_duration',
  sortOrder:     'dashboard_sort'
};
```

---

## Aturan Saat Membuat Perubahan

1. **Jangan tambah dependency eksternal** — tidak ada npm install, tidak ada CDN
2. **Jangan ubah struktur file** — tiga file utama sudah final: `index.html`, `css/style.css`, `js/script.js`
3. **Pertahankan accessibility** — setiap perubahan HTML harus mempertahankan `aria-*` attributes
4. **Verifikasi di browser** — setelah perubahan apapun, buka `index.html` langsung di browser (bukan dev server) dan pastikan tidak ada console error
5. **localStorage tetap kompatibel** — jangan ubah nama key yang sudah ada; tambahkan key baru bila perlu fitur baru
