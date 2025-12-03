import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { TemplateField } from '@/types';

interface CertificateDocumentProps {
    backgroundImageUrl: string;
    fields: TemplateField[];
    values: Record<string, string>;
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
    },
    fieldContainer: {
        position: 'absolute',
    },
});

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({
    backgroundImageUrl,
    fields,
    values,
}) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Background Image */}
                {backgroundImageUrl && (
                    <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
                        <Image
                            src={backgroundImageUrl}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </View>
                )}


                {/* Dynamic Fields */}
                {fields
                    .filter(field => field.is_visible_on_certificate !== false) // Default to true if undefined
                    .map((field) => {
                        const isCenterX = field.is_center_x;
                        const style: any = {
                            position: 'absolute',
                            top: field.y_coordinate,
                        };

                        if (isCenterX) {
                            style.left = 0;
                            style.right = 0;
                            style.width = '100%';
                            style.textAlign = 'center';
                        } else {
                            style.left = field.x_coordinate;
                            style.width = field.width || 'auto';
                        }

                        return (
                            <View
                                key={field.id}
                                style={style}
                            >
                                <Text
                                    style={{
                                        fontSize: field.font_size,
                                        color: field.color,
                                        textAlign: isCenterX ? 'center' : (field.alignment || 'left'),
                                        fontFamily: 'Helvetica',
                                    }}
                                >
                                    {values[field.label] || ''}
                                </Text>
                            </View>
                        );
                    })}
            </Page>
        </Document>
    );
};
