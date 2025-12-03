'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Upload, Trash, Settings, Type, Move, Palette } from 'lucide-react';
import { TemplateField } from '@/types';

interface FieldDraft {
    id: string; // temp id
    label: string;
    type: 'text' | 'date' | 'email' | 'number';
    placeholder: string;
    isRequired: boolean;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    isCenterX: boolean;
    isVisible: boolean;
}

export function TemplateCreator({ templateId }: { templateId?: string }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldDraft[]>([]);
    const [loading, setLoading] = useState(!!templateId);
    const [activeTab, setActiveTab] = useState<'visual' | 'form'>('visual');
    const imageRef = useRef<HTMLImageElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!templateId) return;

        const fetchData = async () => {
            setLoading(true);
            // Fetch template
            const { data: tmpl, error: tmplError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (tmplError) {
                console.error(tmplError);
                alert('Error fetching template');
                return;
            }

            setName(tmpl.name);
            setSlug(tmpl.slug || '');
            setPreviewUrl(tmpl.background_image_url);
            // We don't set 'file' because it's already uploaded.

            // Fetch fields
            const { data: flds, error: fldsError } = await supabase
                .from('template_fields')
                .select('*')
                .eq('template_id', templateId);

            if (fldsError) {
                console.error(fldsError);
            } else if (flds) {
                setFields(flds.map((f: any) => ({
                    id: f.id,
                    label: f.label,
                    type: f.type,
                    placeholder: f.placeholder || '',
                    isRequired: f.is_required,
                    x: f.x_coordinate,
                    y: f.y_coordinate,
                    fontSize: f.font_size,
                    color: f.color,
                    isCenterX: f.is_center_x || false,
                    isVisible: f.is_visible_on_certificate !== false, // default true
                })));
            }
            setLoading(false);
        };

        fetchData();
    }, [templateId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add a new field at this position
        const newField: FieldDraft = {
            id: Math.random().toString(36).substr(2, 9),
            label: `Field ${fields.length + 1}`,
            type: 'text',
            placeholder: '',
            isRequired: true,
            x,
            y,
            fontSize: 16,
            color: '#000000',
            isCenterX: false,
            isVisible: true,
        };

        setFields([...fields, newField]);
    };

    const updateField = (id: string, key: keyof FieldDraft, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        if (!name || (!file && !templateId)) {
            alert('Please provide a name and background image.');
            return;
        }

        setLoading(true);

        try {
            let publicUrl = previewUrl;

            // 1. Upload Image if changed
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('backgrounds')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('backgrounds')
                    .getPublicUrl(fileName);
                publicUrl = urlData.publicUrl;
            }

            if (!publicUrl) throw new Error('No background image URL');

            // 2. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let currentTemplateId = templateId;

            // 3. Create or Update Template
            const templateData = {
                name,
                slug: slug || null, // Handle empty string as null
                background_image_url: publicUrl,
            };

            if (templateId) {
                const { error: updateError } = await supabase
                    .from('templates')
                    .update(templateData)
                    .eq('id', templateId);

                if (updateError) throw updateError;
            } else {
                const { data: template, error: insertError } = await supabase
                    .from('templates')
                    .insert({
                        ...templateData,
                        created_by: user.id,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                currentTemplateId = template.id;
            }

            if (!currentTemplateId) throw new Error('Failed to get template ID');

            // 4. Update Fields (Delete all and re-insert strategy)
            // First delete existing fields
            if (templateId) {
                const { error: deleteError } = await supabase
                    .from('template_fields')
                    .delete()
                    .eq('template_id', templateId);
                if (deleteError) throw deleteError;
            }

            // Then insert current fields
            const dbFields = fields.map(f => ({
                template_id: currentTemplateId,
                label: f.label,
                type: f.type,
                placeholder: f.placeholder,
                is_required: f.isRequired,
                x_coordinate: f.x,
                y_coordinate: f.y,
                font_size: f.fontSize,
                color: f.color,
                is_center_x: f.isCenterX,
                is_visible_on_certificate: f.isVisible,
            }));

            if (dbFields.length > 0) {
                const { error: fieldsError } = await supabase
                    .from('template_fields')
                    .insert(dbFields);

                if (fieldsError) throw fieldsError;
            }

            router.push('/admin/dashboard');
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            alert('Error saving template: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Basic Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-slate-950"
                                placeholder="e.g. Webinar Participation Certificate"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL Slug (Optional)</label>
                            <div className="flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    /view?id=
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                                    className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 border p-2.5 text-slate-950 sm:text-sm"
                                    placeholder="my-custom-event"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Leave empty to use the generated ID.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> background</p>
                                    <p className="text-xs text-gray-500">PNG, JPG (A4 Landscape Recommended)</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
                    </div>
                </div>
            </div>

            {previewUrl && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Visual Editor */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Move className="w-5 h-5 mr-2 text-blue-500" />
                                    Visual Mapper
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    Click on image to add field
                                </span>
                            </div>

                            <div className="relative inline-block cursor-crosshair border rounded overflow-hidden shadow-inner bg-gray-100" onClick={handleImageClick}>
                                <img
                                    ref={imageRef}
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full h-auto block"
                                    draggable={false}
                                />
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="absolute border-2 border-blue-500 bg-blue-500/20 text-blue-900 px-2 py-1 text-xs font-bold rounded pointer-events-none whitespace-nowrap shadow-sm backdrop-blur-sm"
                                        style={{
                                            left: field.x,
                                            top: field.y,
                                            transform: 'translate(0, -50%)',
                                        }}
                                    >
                                        {field.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Field Settings */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-blue-500" />
                                    Field Settings
                                </h3>
                            </div>

                            <div className="p-4 space-y-6">
                                {fields.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Type className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No fields added yet.</p>
                                        <p className="text-sm">Click on the image to place a field.</p>
                                    </div>
                                ) : (
                                    fields.map((field, index) => (
                                        <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Field {index + 1}</span>
                                                <button
                                                    onClick={() => removeField(field.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Label & Type */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Label</label>
                                                        <input
                                                            type="text"
                                                            value={field.label}
                                                            onChange={(e) => updateField(field.id, 'label', e.target.value)}
                                                            className="w-full text-sm border-gray-300 rounded-md text-slate-950 focus:ring-blue-500 focus:border-blue-500 border p-1.5"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                                                        <select
                                                            value={field.type}
                                                            onChange={(e) => updateField(field.id, 'type', e.target.value)}
                                                            className="w-full text-sm border-gray-300 rounded-md text-slate-950 focus:ring-blue-500 focus:border-blue-500 border p-1.5"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="date">Date</option>
                                                            <option value="email">Email</option>
                                                            <option value="number">Number</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Placeholder & Required */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Placeholder</label>
                                                        <input
                                                            type="text"
                                                            value={field.placeholder}
                                                            onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                                                            className="w-full text-sm border-gray-300 rounded-md text-slate-950 focus:ring-blue-500 focus:border-blue-500 border p-1.5"
                                                            placeholder="e.g. John Doe"
                                                        />
                                                    </div>
                                                    <div className="flex items-center pt-5">
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.isRequired}
                                                                onChange={(e) => updateField(field.id, 'isRequired', e.target.checked)}
                                                                className="rounded text-slate-950 border-gray-300"
                                                            />
                                                            <span className="text-xs font-medium text-gray-700">Required</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Styling: Font Size & Color */}
                                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Font Size (px)</label>
                                                        <input
                                                            type="number"
                                                            value={field.fontSize}
                                                            onChange={(e) => updateField(field.id, 'fontSize', parseInt(e.target.value))}
                                                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-slate-950 border p-1.5"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Color</label>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="color"
                                                                value={field.color}
                                                                onChange={(e) => updateField(field.id, 'color', e.target.value)}
                                                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                                            />
                                                            <span className="text-xs text-gray-500">{field.color}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Coords & Options */}
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 mb-1 block">X</label>
                                                            <input
                                                                type="number"
                                                                value={Math.round(field.x)}
                                                                onChange={(e) => updateField(field.id, 'x', parseInt(e.target.value))}
                                                                disabled={field.isCenterX}
                                                                className="w-full text-sm border-gray-300 text-slate-950 rounded-md focus:ring-blue-500 focus:border-blue-500 border p-1.5 bg-gray-50 disabled:opacity-50"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Y</label>
                                                            <input
                                                                type="number"
                                                                value={Math.round(field.y)}
                                                                onChange={(e) => updateField(field.id, 'y', parseInt(e.target.value))}
                                                                className="w-full text-sm border-gray-300 text-slate-950 rounded-md focus:ring-blue-500 focus:border-blue-500 border p-1.5 bg-gray-50"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.isCenterX}
                                                                onChange={(e) => updateField(field.id, 'isCenterX', e.target.checked)}
                                                                className="rounded text-slate-950 border-gray-300"
                                                            />
                                                            <span className="text-xs font-medium text-gray-700">Center Horizontally (X)</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.isVisible}
                                                                onChange={(e) => updateField(field.id, 'isVisible', e.target.checked)}
                                                                className="rounded text-slate-950 border-gray-300"
                                                            />
                                                            <span className="text-xs font-medium text-gray-700">Visible on Certificate</span>
                                                        </label>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Save Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
