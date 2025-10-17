import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface EstadisticasCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
}

export const EstadisticasCard: React.FC<EstadisticasCardProps> = ({
  title,
  value,
  icon: Icon,
  colorClass = 'text-blue-500'
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
};

