---
inclusion: manual
name: workflow
description: Panduan workflow pengembangan fitur baru pada project Life Dashboard
---

# Life Dashboard — Workflow & Agent Guide

## Kapan Menggunakan Dokumen Ini

Aktifkan steering file ini (#workflow di chat) saat akan:
- Menambahkan fitur baru ke dashboard
- Melakukan refactor pada salah satu dari tiga file utama
- Memperbaiki bug yang melibatkan perubahan multi-file
- Menjalankan code review pada perubahan yang sudah dibuat

---

## Struktur Artefak Workflow

Semua artefak agent disimpan di `.agents/tasks/`:

```
.agents/tasks/
  plan.md              # Implementation plan dari wf-planner
  code-review.md       # Review report dari semantic_reviewer
  review.json          # Verdict dan findings dalam format machine-readable
  YYYY-MM-DD-HHmmss-review.md   # Review dengan timestamp (bila ada beberapa iterasi)
```

Jangan hapus file di `.agents/tasks/` — ini adalah rekam jejak keputusan desain dan review.

---

## Alur Kerja Standar untuk Fitur Baru

```
1. INVESTIGATE  →  2. PLAN  →  3. IMPLEMENT  →  4. REVIEW
```

### 1. Investigate (bila perlu)
Gunakan `bundled://investigate` bila fitur baru memerlukan pemahaman mendalam tentang kode yang ada sebelum direncanakan.

Brief minimal harus memuat:
- Pertanyaan spesifik yang perlu dijawab
- File yang relevan: `index.html`, `css/style.css`, `js/script.js`
- Path report: `.agents/tasks/`

### 2. Plan
Gunakan `wf-planner` atau `bundled://feature-pipeline`. Plan ditulis ke `.agents/tasks/plan.md`.

Plan wajib menyertakan:
- Snapshot kode yang akan diubah (bagian relevan saja)
- Langkah-langkah bernomor dengan target file spesifik
- Instruksi verifikasi per langkah (bukan hanya "no errors")
- Final checklist

### 3. Implement
Gunakan `wf-coder`. Coder membaca `plan.md` dan mengeksekusi satu langkah per iterasi.

Constraint yang selalu disertakan di prompt:
- Tidak ada dependency eksternal
- Tidak ada perubahan pada struktur tiga file utama
- Setiap langkah diverifikasi dengan membuka `index.html` di browser
- Jangan mutasi `state.tasks` saat render

### 4. Review
Gunakan `semantic_reviewer` atau `bundled://semantic-review-multi-model`.

Output review ditulis ke:
- `.agents/tasks/code-review.md` (dokumen lengkap)
- `.agents/tasks/review.json` (verdict + findings, machine-readable)

Format `review.json`:
```json
{
  "verdict": "APPROVED" | "CHANGES_REQUESTED",
  "findings": ["..."],
  "reviewDoc": "<path ke .md>"
}
```

---

## Constraint Tetap untuk Semua Agent

Sertakan constraint ini di setiap prompt agent yang menyentuh kode:

```
CONSTRAINTS:
- Tiga file utama adalah: index.html, css/style.css, js/script.js
- Jangan tambahkan dependency eksternal (npm, CDN, library)
- Jangan ubah nama localStorage key yang sudah ada di KEYS object
- Selalu cek null sebelum mengakses DOM element
- CSS baru di-append ke bawah style.css, bukan disisipkan di tengah
- Verifikasi: buka index.html langsung di browser (bukan dev server)
```

---

## Pola Loop Implement–Review

Bila review mengembalikan `CHANGES_REQUESTED`:

```
wf-coder (fix findings)  →  semantic_reviewer (re-review)
         ↑_____________________________________|
                  (ulang sampai APPROVED)
```

Review selalu menjadi langkah terakhir yang menentukan `stopCondition`.

---

## Catatan Khusus Project Ini

- **Modal**: dibuka/ditutup via `style.display` langsung (bukan toggle class `.open`) — ini sudah diketahui sebagai inkonsistensi dengan CSS, tapi runtime-nya benar. Jangan ubah mekanisme ini tanpa mendiskusikan dulu.
- **`#timer-display` CSS**: ada dua rule (line 180 dan 639 di style.css) — rule kedua menang via cascade. Ini known issue dari review; boleh di-cleanup saat refactor CSS berikutnya.
- **Sort**: `getSortedTasks()` bekerja pada spread copy `[...state.tasks]` — jangan ubah ini jadi mutasi langsung.
- **Timer duration**: divalidasi 1–120 menit saat load dan saat input.
