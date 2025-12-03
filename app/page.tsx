import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white">
      <div className="bg-white p-4 rounded-full shadow-lg mb-8">
        <img src="/logo.png" alt="Lampung Cerdas Logo" className="h-24 w-auto" />
      </div>
      <h1 className="text-5xl font-bold mb-4 text-center">Sistem Sertifikat</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">Platform resmi pembuatan dan pengelolaan sertifikat digital Lampung Cerdas.</p>
      <div className="space-x-4">
        <Link
          href="/admin"
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold shadow-md hover:bg-gray-100 transition transform hover:scale-105"
        >
          Masuk sebagai Admin
        </Link>
      </div>
    </div>
  );
}
