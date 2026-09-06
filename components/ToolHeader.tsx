
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="bg-indigo-500/10 p-3 rounded-lg">
          <Icon className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-500">{title}</h1>
      </div>
      <p className="text-lg text-gray-400 ml-1">{description}</p>
    </div>
  );
};

export default ToolHeader;
