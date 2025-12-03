# Dynamic Certificate Generator System

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the contents of `supabase_schema.sql`.
3. Go to Project Settings -> API and copy the `URL` and `anon` key.
4. Create a `.env.local` file in the root directory (see `.env.local.example` if available, or use the format below):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Go to Authentication -> Providers and enable Email/Password.
6. Create an Admin user in the Authentication tab (or sign up via the API if you enable signups).

### 2. Development
Run the development server:
```bash
npm run dev
```

### 3. Deployment (cPanel / Static Export)
This project is configured for `output: 'export'`.

1. Run the build command:
   ```bash
   npm run build
   ```
   This will create an `out` directory.

2. Upload the contents of the `out` directory to your cPanel `public_html` (or a subdirectory).

3. **IMPORTANT: Dynamic Routes on Static Hosting**
   Since we use dynamic routes (e.g., `/template-id`), accessing them directly might cause a 404 on cPanel because the file `template-id.html` doesn't exist (it's a Single Page App route).
   
   Create a `.htaccess` file in your deployment folder with the following content to redirect all requests to `index.html` (SPA fallback):

   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
   (Adjust `RewriteBase` if you are deploying to a subdirectory, e.g., `RewriteBase /certificates/` and `RewriteRule . /certificates/index.html [L]`).

## Features
- **Admin Dashboard**: Login, Create Templates, Interactive Mapper.
- **User Page**: Fill form, Generate PDF.
- **PDF Generation**: Client-side using `@react-pdf/renderer`.
