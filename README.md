# Sistem Sertifikat Digital - Lampung Cerdas

Platform resmi untuk pembuatan dan pengelolaan sertifikat digital secara dinamis dan efisien.

## 🚀 Fitur Utama

### 1. Pembuatan Template Sertifikat
- **Visual Mapper**: Upload gambar sertifikat kosong dan klik langsung pada area gambar untuk menambahkan kolom isian.
- **Drag & Drop**: Atur posisi kolom dengan mudah.
- **Kustomisasi Kolom**:
  - Tipe data (Text, Date, Email, Number).
  - Ukuran font dan warna teks.
  - **Horizontal Centering**: Opsi untuk menengahkan teks secara otomatis (mengabaikan koordinat X).
  - **Visibility Control**: Opsi untuk menyembunyikan kolom dari sertifikat PDF (hanya simpan di database).

### 2. Generasi Sertifikat Publik
- **Form Dinamis**: Halaman pengisian data otomatis dibuat berdasarkan template yang Anda desain.
- **Custom URL Slug**: Bagikan link yang mudah diingat (contoh: `domain.com/view?slug=webinar-nasional`).
- **Instant PDF**: Sertifikat langsung digenerate menjadi PDF siap download.
- **Desain Modern**: Antarmuka pengguna yang bersih, responsif, dan profesional.

### 3. Manajemen Admin
- **Dashboard**: Lihat daftar semua template sertifikat.
- **Database Respons**: Lihat siapa saja yang telah mengisi form dan generate sertifikat.
- **Export to Excel**: Unduh data respons peserta ke format Excel (.xlsx) untuk pelaporan.
- **Edit & Hapus**: Kelola template yang sudah ada kapan saja.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **PDF Generation**: `@react-pdf/renderer`.
- **Icons**: Lucide React.

## 📦 Cara Install & Menjalankan

1.  **Clone Repository**
    ```bash
    git clone [repository-url]
    cd sistem-sertifikat
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` di root project dan isi dengan kredensial Supabase Anda:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

4.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🗄️ Struktur Database (Supabase)

Pastikan Anda telah menjalankan query SQL berikut di Supabase SQL Editor:

```sql
-- Tabel Templates
create table templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  background_image_url text not null,
  created_by uuid references auth.users(id),
  slug text unique
);

-- Tabel Template Fields
create table template_fields (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references templates(id) on delete cascade,
  label text not null,
  type text not null,
  placeholder text,
  is_required boolean default true,
  x_coordinate numeric not null,
  y_coordinate numeric not null,
  font_size numeric default 12,
  color text default '#000000',
  is_center_x boolean default false,
  is_visible_on_certificate boolean default true
);

-- Tabel Generated Certificates
create table generated_certificates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  template_id uuid references templates(id),
  user_data jsonb not null
);
```

## 📝 Catatan Pengembang

- **PDF Rendering**: Sistem menggunakan `@react-pdf/renderer` dengan teknik *client-side generation* untuk menghindari isu kompatibilitas server-side pada Next.js App Router.
- **Slug vs ID**: Sistem mendukung akses via ID (`?id=uuid`) dan Slug (`?slug=custom-name`). Slug harus unik.

---
&copy; 2025 Lampung Cerdas. All rights reserved.
