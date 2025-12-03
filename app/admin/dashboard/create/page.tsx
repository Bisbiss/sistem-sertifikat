import { TemplateCreator } from '@/components/admin/TemplateCreator';

export default function CreateTemplatePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Certificate Template</h1>
            <TemplateCreator />
        </div>
    );
}
