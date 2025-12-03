import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white">
      <h1 className="text-5xl font-bold mb-4">Certificate Generator</h1>
      <p className="text-xl mb-8">Create and manage dynamic certificates easily.</p>
      <div className="space-x-4">
        <Link
          href="/admin"
          className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
}
