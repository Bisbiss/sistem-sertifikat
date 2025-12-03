export interface TemplateField {
    id: string;
    template_id: string;
    label: string;
    type: 'text' | 'date' | 'email' | 'number';
    placeholder?: string;
    is_required?: boolean;
    x_coordinate: number;
    y_coordinate: number;
    font_size: number;
    color: string;
    width?: number;
    alignment?: 'left' | 'center' | 'right';
    is_center_x?: boolean;
    is_visible_on_certificate?: boolean;
}

export interface Template {
    id: string;
    name: string;
    background_image_url: string;
    created_by: string;
    slug?: string;
    fields?: TemplateField[];
}
