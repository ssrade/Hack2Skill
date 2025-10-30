import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Edit2,
  Check,
  Camera,
  FileText,
  Image,
} from 'lucide-react';
import { cn } from '../components/lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
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

  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('Legal Professional');
  const [initials, setInitials] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { user, updateProfile } = useAuth();

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
      // keep profession and role as defaults unless backend provides them
      setProfession((user as any).profession || 'Legal Professional');
      setRole((user as any).role || 'Legal Analyst');
      if (user.picture) setAvatarImage(user.picture);
    }
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarImage(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCoverImage(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950 p-6",
        "relative overflow-hidden"
      )}
    >
      {/* Background blobs */}
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1/4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-4 w-fit border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 bg-white/50 dark:bg-gray-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          className="flex-1 max-w-5xl mx-auto w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Profile Card */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 overflow-hidden">
              {/* Profile Header with cover image background */}
              <div className="h-32 md:h-48 relative group overflow-hidden">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                )}
                
                {/* Upload Cover Image Button - Shows on hover or when editing */}
                <div 
                  className={cn(
                    "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity cursor-pointer",
                    isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">
                      {coverImage ? 'Change Cover Photo' : 'Add Cover Photo'}
                    </p>
                  </div>
                </div>
                
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverImageChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                />
              </div>
              
              <CardContent className="relative px-8 pb-8">
                {/* Avatar positioned to overlap header */}
                <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-xl">
                      <AvatarImage src={avatarImage || ''} alt={name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div
                        className="absolute inset-0 w-32 h-32 rounded-full bg-black/60 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-end">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="name"
                              className="text-gray-600 dark:text-gray-400 text-sm mb-1"
                            >
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="profession"
                              className="text-gray-600 dark:text-gray-400 text-sm mb-1"
                            >
                              Profession
                            </Label>
                            <Input
                              id="profession"
                              value={profession}
                              onChange={(e) => setProfession(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label
                            htmlFor="initials"
                            className="text-gray-600 dark:text-gray-400 text-sm mb-1"
                          >
                            Avatar Initials (2 characters)
                          </Label>
                          <Input
                            id="initials"
                            value={initials}
                            onChange={(e) =>
                              setInitials(e.target.value.toUpperCase())
                            }
                            maxLength={2}
                            className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white max-w-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-black dark:text-white text-3xl font-bold mb-2">{name}</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-3">{profession}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">
                          Member since March 2024
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-end">
                    {isEditing ? (
                      <Button
                        onClick={() => {
                          // Save changes to AuthContext
                          updateProfile({ name, email, picture: avatarImage || '' });
                          setIsEditing(false);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700/50 my-6"></div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-black dark:text-white text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Personal Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                            Email Address
                          </Label>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-black dark:text-white">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <p>{email}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                            Role
                          </Label>
                          {isEditing ? (
                            <Input
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-black dark:text-white">
                              <User className="w-4 h-4 text-gray-400" />
                              <p>{role}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Statistics */}
                  <div>
                    <h3 className="text-black dark:text-white text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Account Overview
                    </h3>
                    <div className="space-y-3">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30"
                      >
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Documents</p>
                          <p className="text-black dark:text-white text-2xl font-bold">127</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/30"
                      >
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Account Status</p>
                          <p className="text-black dark:text-white text-xl font-semibold">Active</p>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Security */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 h-full">
                <CardHeader>
                  <CardTitle className="text-black dark:text-white text-lg">
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-black dark:text-white text-sm">Password</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">••••••••</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preferences */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 h-full">
                <CardHeader>
                  <CardTitle className="text-black dark:text-white text-lg">
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-black dark:text-white text-sm">Language</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">English</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <span className="text-black dark:text-white text-sm">Time Zone</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">UTC-5</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}