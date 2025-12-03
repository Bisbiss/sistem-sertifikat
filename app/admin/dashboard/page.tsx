'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Template } from '@/types';
import { Plus, ExternalLink, Edit, Trash2, Database } from 'lucide-react';

export default function Dashboard() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) console.error(error);
            else setTemplates(data || []);
            setLoading(false);
        };

        fetchTemplates();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;

        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting template:', error);
            alert('Error deleting template');
        } else {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                <Link
                    href="/admin/dashboard/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                </Link>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {templates.map((template) => (
                            <li key={template.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img
                                            src={template.background_image_url}
                                            alt={template.name}
                                            className="h-12 w-12 object-cover rounded mr-4"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-blue-600 truncate">{template.name}</p>
                                            {template.slug && (
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">/{template.slug}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-4 items-center">
                                        <Link
                                            href={template.slug ? `/view?slug=${template.slug}` : `/view?id=${template.id}`}
                                            target="_blank"
                                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                                            title="View Public Page"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/dashboard/responses?id=${template.id}`}
                                            className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                                            title="View Responses"
                                        >
                                            <Database className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/dashboard/edit?id=${template.id}`}
                                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                            title="Edit Template"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                                            title="Delete Template"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {templates.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">No templates found. Create one!</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
