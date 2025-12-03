'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { Template, TemplateField } from '@/types';
import dynamic from 'next/dynamic';
import { Loader2, Download, CheckCircle, AlertCircle, Award, Sparkles } from 'lucide-react';

const CertificateDocument = dynamic(
    () => import('./CertificateDocument').then((mod) => mod.CertificateDocument),
    { ssr: false }
);

export function CertificateGenerator({ templateId }: { templateId: string }) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [fields, setFields] = useState<TemplateField[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const { register, watch, handleSubmit, formState: { errors, isValid } } = useForm<Record<string, string>>({
        mode: 'onChange'
    });
    const values = watch();

    useEffect(() => {
        const fetchTemplate = async () => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);

            let query = supabase.from('templates').select('*');

            if (isUuid) {
                query = query.eq('id', templateId);
            } else {
                query = query.eq('slug', templateId);
            }

            const { data: tmpl, error: tmplError } = await query.single();

            if (tmplError || !tmpl) {
                console.error('Error fetching template:', tmplError);
                setLoading(false);
                return;
            }

            setTemplate(tmpl);

            const { data: flds, error: fldsError } = await supabase
                .from('template_fields')
                .select('*')
                .eq('template_id', tmpl.id); // Use the ID from the fetched template

            if (fldsError) {
                console.error('Error fetching fields:', fldsError);
            } else {
                setFields(flds || []);
            }
            setLoading(false);
        };

        fetchTemplate();
    }, [templateId]);

    const onSubmit = async (data: Record<string, string>) => {
        try {
            setGenerating(true);
            // Log generation
            if (!template?.id) throw new Error('Template ID not found');

            const { error } = await supabase.from('generated_certificates').insert({
                template_id: template.id,
                user_data: data,
            });

            if (error) throw error;

            setGenerating(false);
            setGenerated(true);
        } catch (error) {
            console.error('Error generating certificate:', error);
            alert('Failed to generate certificate. Please try again.');
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!template || !fields) {
            alert('Template data is missing');
            return;
        }

        try {
            console.log('Generating PDF with:', { template, fields, values });
            const { pdf } = await import('@react-pdf/renderer');
            const { CertificateDocument: Doc } = await import('./CertificateDocument');

            const blob = await pdf(
                <Doc
                    backgroundImageUrl={template.background_image_url}
                    fields={fields}
                    values={values}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name.replace(/\s+/g, '_')}_Certificate.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF: ' + (error.message || 'Unknown error'));
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Loading Template...</p>
            </div>
        </div>
    );

    if (!template) return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Template Not Found</h2>
                <p className="text-slate-600">The certificate template you are looking for does not exist or has been removed.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-3xl" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-purple-200/30 blur-3xl" />
            </div>

            <div className="max-w-4xl w-full bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/50 z-10 transition-all duration-500 hover:shadow-indigo-500/10">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                    {/* Left Side: Header/Branding */}
                    <div className="md:col-span-2 bg-linear-to-br from-indigo-600 to-blue-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                        <div className="relative z-10">
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md mb-6 shadow-inner border border-white/10">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2 leading-tight">{template.name}</h1>
                            <div className="h-1 w-20 bg-indigo-400 rounded-full mb-4"></div>
                            <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                                Fill in your details carefully to generate your official certificate. Ensure all information is correct before submitting.
                            </p>
                        </div>

                        <div className="relative z-10 mt-8">
                            <div className="flex items-center space-x-2 text-xs text-indigo-200 bg-indigo-800/30 py-2 px-3 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                                <Sparkles className="h-4 w-4 text-yellow-300" />
                                <span>Instant PDF Generation</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:col-span-3 p-8 md:p-10 bg-white">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                {fields.map((field) => (
                                    <div key={field.id} className="group">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 group-focus-within:text-indigo-600 transition-colors">
                                            {field.label} {field.is_required && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                                                {...register(field.label, { required: field.is_required })}
                                                className={`block w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white sm:text-sm py-3 px-4 border transition-all duration-200 ease-in-out ${errors[field.label] ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : 'hover:border-indigo-300'}`}
                                                placeholder={field.placeholder || `Enter ${field.label}`}
                                            />
                                        </div>
                                        {errors[field.label] && (
                                            <p className="mt-1.5 text-xs text-red-500 flex items-center font-medium animate-pulse ml-1">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                This field is required
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 mt-6 border-t border-slate-100">
                                {!generated ? (
                                    <button
                                        type="submit"
                                        disabled={!isValid || generating}
                                        className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                                Generating Certificate...
                                            </>
                                        ) : (
                                            'Generate Certificate'
                                        )}
                                    </button>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center text-green-700">
                                            <div className="bg-green-100 rounded-full p-1 mr-3">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <span className="font-medium">Certificate ready for download!</span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                onClick={handleDownload}
                                                className="flex-1 flex items-center justify-center py-3.5 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
                                            >
                                                <Download className="mr-2 h-5 w-5" />
                                                Download PDF
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setGenerated(false)}
                                                className="flex-1 flex items-center justify-center py-3.5 px-6 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all duration-200"
                                            >
                                                Generate Another
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center text-slate-400 text-xs">
                <p>&copy; {new Date().getFullYear()} Certificate Generator System. All rights reserved.</p>
            </div>
        </div>
    );
}
