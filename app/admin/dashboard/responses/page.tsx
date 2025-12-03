'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface ResponseData {
    id: string;
    created_at: string;
    user_data: Record<string, string>;
}

interface TemplateField {
    label: string;
}

function ResponsesContent() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('id');
    const [responses, setResponses] = useState<ResponseData[]>([]);
    const [fields, setFields] = useState<string[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!templateId) return;

        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Template Info
            const { data: tmpl } = await supabase
                .from('templates')
                .select('name')
                .eq('id', templateId)
                .single();

            if (tmpl) setTemplateName(tmpl.name);

            // 2. Fetch Fields (to know columns)
            const { data: flds } = await supabase
                .from('template_fields')
                .select('label')
                .eq('template_id', templateId);

            const fieldLabels = flds?.map(f => f.label) || [];
            setFields(fieldLabels);

            // 3. Fetch Responses
            const { data: resps, error } = await supabase
                .from('generated_certificates')
                .select('*')
                .eq('template_id', templateId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching responses:', error);
            } else {
                setResponses(resps || []);
            }

            setLoading(false);
        };

        fetchData();
    }, [templateId]);

    const handleExport = () => {
        if (responses.length === 0) return;

        // Flatten data for export
        const dataToExport = responses.map(r => {
            const row: Record<string, string> = {
                'Date Generated': new Date(r.created_at).toLocaleString(),
            };
            fields.forEach(field => {
                row[field] = r.user_data[field] || '-';
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
        XLSX.writeFile(workbook, `${templateName.replace(/\s+/g, '_')}_Responses.xlsx`);
    };

    if (!templateId) return <div>Invalid Template ID</div>;

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{templateName}</h1>
                            <p className="text-sm text-gray-500">Total Responses: {responses.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={responses.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    {fields.map((field) => (
                                        <th key={field} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {field}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {responses.length === 0 ? (
                                    <tr>
                                        <td colSpan={fields.length + 1} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No responses yet.
                                        </td>
                                    </tr>
                                ) : (
                                    responses.map((response) => (
                                        <tr key={response.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(response.created_at).toLocaleString()}
                                            </td>
                                            {fields.map((field) => (
                                                <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {response.user_data[field] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResponsesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>}>
            <ResponsesContent />
        </Suspense>
    );
}
