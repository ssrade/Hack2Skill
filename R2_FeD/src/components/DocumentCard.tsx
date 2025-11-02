import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface DocumentCardProps {
  doc: {
    id: string;
    title: string;
    description: string;
  };
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc }) => {
  const { inline } = useTranslation();
  
  return (
    <div className="bg-[#111827] rounded-xl p-4 mb-3 hover:bg-[#1f2937] transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg font-semibold">{doc.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{doc.description}</p>
        </div>
        <span className="text-gray-600 text-xs">{inline('ID')}: {doc.id.slice(0, 6)}...</span>
      </div>
    </div>
  );
};

export default DocumentCard;
