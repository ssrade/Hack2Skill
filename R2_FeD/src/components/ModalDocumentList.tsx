import { FileText, Clock, Inbox } from 'lucide-react';
import type { Document } from './MainApp';
import { ScrollArea } from './ui/scroll-area';
import { useTranslation } from '../contexts/TranslationContext';

interface ModalDocumentListProps {
  documents: Document[];
  onSelect: (id: string) => void;
}

export function ModalDocumentList({ documents, onSelect }: ModalDocumentListProps) {
  const { inline } = useTranslation();
  return (
    <div className="bg-transparent flex flex-col h-[78vh]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800/50">
        <h2 className="text-black dark:text-white text-xl font-semibold">{inline('Select Document')}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {documents.length > 0
            ? `${documents.length} ${inline(documents.length === 1 ? 'document' : 'documents')} ${inline('available')}`
            : inline('No documents uploaded yet')}
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden">
        <div className="p-4 sm:p-6">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center bg-gray text-gray-500 pt-10">
              <Inbox className="w-12 h-12 mb-4" />
              <p className="text-sm">{inline('No documents found.')}</p>
              <p className="text-xs">{inline('Upload a new document using the panel on the right.')}</p>
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className="w-full text-left p-3 sm:p-4 rounded-lg mb-3 transition-all backdrop-blur-xl hover:bg-gray-100 dark:hover:bg-[#090e1c] border border-transparent hover:border-blue-300 dark:hover:border-blue-500/30"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="text-black dark:text-white text-sm font-medium break-words line-clamp-2">{doc.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400 text-xs truncate">{doc.uploadDate}</span>
                    </div>
                    <div className="mt-2">
                      <div className={`inline-flex px-2 py-0.5 rounded text-xs ${doc.status === 'analyzed'
                          ? 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-gray-200/50 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                        }`}>
                        {doc.status === 'analyzed' ? inline('✓ Analyzed') : inline('Pending')}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}