import React, { useEffect, useState } from 'react';

interface DataStreamProps {
  data: string[];
  speed?: number;
  color?: 'tech' | 'cyber' | 'hologram' | 'data';
  direction?: 'up' | 'down' | 'left' | 'right';
}

const DataStream: React.FC<DataStreamProps> = ({ 
  data, 
  speed = 1000,
  color = 'tech',
  direction = 'down'
}) => {
  const [currentData, setCurrentData] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentData(prev => {
        const newData = [...prev];
        const randomItem = data[Math.floor(Math.random() * data.length)];
        
        if (direction === 'down') {
          newData.push(randomItem);
          if (newData.length > 10) newData.shift();
        } else if (direction === 'up') {
          newData.unshift(randomItem);
          if (newData.length > 10) newData.pop();
        } else if (direction === 'right') {
          newData.push(randomItem);
          if (newData.length > 15) newData.shift();
        } else if (direction === 'left') {
          newData.unshift(randomItem);
          if (newData.length > 15) newData.pop();
        }
        
        return newData;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [data, speed, direction]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getColorClass = () => {
    switch (color) {
      case 'tech':
        return 'text-tech-primary';
      case 'cyber':
        return 'text-tech-accent';
      case 'hologram':
        return 'text-tech-success';
      case 'data':
        return 'text-tech-warning';
      default:
        return 'text-tech-primary';
    }
  };

  const getDirectionClass = () => {
    switch (direction) {
      case 'up':
        return 'flex-col-reverse';
      case 'down':
        return 'flex-col';
      case 'left':
        return 'flex-row-reverse';
      case 'right':
        return 'flex-row';
      default:
        return 'flex-col';
    }
  };

  return (
    <div className={`flex ${getDirectionClass()} space-y-1 space-x-1 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {currentData.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className={`font-mono text-xs ${getColorClass()} animate-data-stream`}
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: `${speed}ms`
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default DataStream;
