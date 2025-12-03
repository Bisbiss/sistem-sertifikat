'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CertificateGenerator } from '@/components/certificate/CertificateGenerator';
import { Loader2 } from 'lucide-react';

function CertificateContent() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('id') || searchParams.get('slug');

    if (!templateId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                    <p className="text-gray-600">No certificate template ID provided.</p>
                </div>
            </div>
        );
    }

    return <CertificateGenerator templateId={templateId} />;
}

export default function CertificatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>}>
            <CertificateContent />
        </Suspense>
    );
}
