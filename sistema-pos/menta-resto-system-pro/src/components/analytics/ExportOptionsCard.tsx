import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  FileText, 
  File, 
  Database,
  Download,
  Star,
  Zap,
  Crown,
  CheckCircle
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgColor: string;
  recommended?: boolean;
  premium?: boolean;
}

interface ExportOptionsCardProps {
  onSelectOption: (optionId: string) => void;
  selectedOption?: string;
}

export const ExportOptionsCard: React.FC<ExportOptionsCardProps> = ({
  onSelectOption,
  selectedOption
}) => {
  const exportOptions: ExportOption[] = [
    {
      id: 'excel',
      name: 'Excel Profesional',
      description: 'Múltiples hojas con análisis completo y gráficos integrados',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      features: [
        '5 hojas de análisis detallado',
        'Gráficos y visualizaciones',
        'Fórmulas automáticas',
        'Formato profesional',
        'Compatible con Excel/Google Sheets'
      ],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      recommended: true
    },
    {
      id: 'pdf',
      name: 'PDF Ejecutivo',
      description: 'Reporte visual para presentaciones y reuniones',
      icon: <FileText className="h-6 w-6" />,
      features: [
        'Diseño profesional',
        'Portada ejecutiva',
        'Gráficos de alta calidad',
        'Fácil de compartir',
        'Optimizado para impresión'
      ],
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      premium: true
    },
    {
      id: 'csv',
      name: 'CSV Avanzado',
      description: 'Datos estructurados para análisis y procesamiento',
      icon: <File className="h-6 w-6" />,
      features: [
        'Metadatos incluidos',
        'Datos enriquecidos',
        'Compatible con Excel',
        'Fácil procesamiento',
        'Tamaño optimizado'
      ],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'json',
      name: 'JSON Estructurado',
      description: 'Datos completos para desarrolladores y APIs',
      icon: <Database className="h-6 w-6" />,
      features: [
        'Estructura completa',
        'Metadatos detallados',
        'API ready',
        'Análisis programático',
        'Integración fácil'
      ],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Formatos de Exportación Disponibles
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona el formato que mejor se adapte a tus necesidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportOptions.map((option) => {
          const isSelected = selectedOption === option.id;
          
          return (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectOption(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${option.bgColor}`}>
                      <div className={option.color}>
                        {option.icon}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {option.name}
                        {option.recommended && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        )}
                        {option.premium && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Características:
                  </h4>
                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <Button 
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOption(option.id);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isSelected ? 'Seleccionado' : 'Seleccionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              💡 Consejo de Exportación
            </h4>
            <p className="text-sm text-blue-700">
              <strong>Excel Profesional</strong> es ideal para análisis detallados y presentaciones. 
              <strong>PDF Ejecutivo</strong> es perfecto para reportes gerenciales. 
              <strong>CSV Avanzado</strong> es excelente para procesamiento de datos. 
              <strong>JSON</strong> es ideal para integraciones y desarrollo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
