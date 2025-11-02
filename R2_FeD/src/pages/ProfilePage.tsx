import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  FileText,
} from 'lucide-react';
import { cn } from '../components/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { getAllDocuments } from '../api/agreementApi';

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { inline } = useTranslation();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // State for profile data
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [documentsCount, setDocumentsCount] = useState(0);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setInitials((user.name || '')
        .split(' ')
        .map(n => n[0])
        .slice(0,2)
        .join('')
        .toUpperCase());
      if (user.profilePhoto) setAvatarImage(user.profilePhoto);
    }
  }, [user]);

  // Fetch documents count
  useEffect(() => {
    const fetchDocumentsCount = async () => {
      try {
        const documents = await getAllDocuments();
        setDocumentsCount(documents.length);
      } catch (error) {
        console.error('Error fetching documents count:', error);
        setDocumentsCount(0);
      }
    };

    fetchDocumentsCount();
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-950"
      )}
    >
      <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {inline('Back')}
          </Button>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Profile Card */}
          <motion.div
            variants={itemVariants}
            className="col-span-1"
          >
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow h-full">
              <CardContent className="p-8 lg:p-10">
                <div className="flex flex-col items-center">
                  {/* Avatar */}
                  <div className="mb-6">
                    <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-gray-100 dark:border-gray-800">
                      <AvatarImage src={avatarImage || ''} alt={name} className="object-cover" />
                      <AvatarFallback className="bg-blue-600 text-white text-3xl sm:text-4xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 text-center">
                    {name}
                  </h1>
                  
                  {/* Divider */}
                  <div className="w-16 h-0.5 bg-blue-600 my-5"></div>

                  {/* Email section */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                          {inline('Email Address')}
                        </p>
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium truncate">
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Documents Card */}
          <motion.div
            variants={itemVariants}
            className="col-span-1"
          >
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-4 p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {inline('Documents')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-8 lg:pb-10 px-8 lg:px-10">
                <div className="text-center">
                  {/* Document count */}
                  <div className="text-6xl sm:text-7xl font-bold text-blue-600 dark:text-blue-500 mb-3">
                    {documentsCount}
                  </div>
                  
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium mb-8">
                    {inline('Total documents analyzed')}
                  </p>
                  
                  {/* Info card */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {documentsCount === 0 
                        ? inline('Upload your first document to get started with legal analysis') 
                        : documentsCount === 1
                        ? inline('You have analyzed 1 document')
                        : inline(`You have analyzed ${documentsCount} documents`)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
