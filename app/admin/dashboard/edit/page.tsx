'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplateCreator } from '@/components/admin/TemplateCreator';
import { Loader2 } from 'lucide-react';

function EditTemplateContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return <div>Invalid Template ID</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Certificate Template</h1>
            <TemplateCreator templateId={id} />
        </div>
    );
}

export default function EditTemplatePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>}>
            <EditTemplateContent />
        </Suspense>
    );
}
