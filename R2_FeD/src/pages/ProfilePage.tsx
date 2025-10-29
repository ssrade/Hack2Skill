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
  Shield,
  FileText,
  Clock,
  TrendingUp,
  Award,
  Bell,
  Lock,
  Settings,
  Edit2,
  Check,
  Camera,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Profile Info */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 flex flex-col gap-6"
          >
            {/* Profile Card */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarImage || ''} alt={name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div
                        className="absolute inset-0 w-24 h-24 rounded-full bg-black/60 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                  />

                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <div className="text-left">
                        <Label
                          htmlFor="name"
                          className="text-gray-500 dark:text-gray-400 text-xs mb-1"
                        >
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                        />
                      </div>
                      <div className="text-left">
                        <Label
                          htmlFor="profession"
                          className="text-gray-500 dark:text-gray-400 text-xs mb-1"
                        >
                          Profession
                        </Label>
                        <Input
                          id="profession"
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                        />
                      </div>
                      <div className="text-left">
                        <Label
                          htmlFor="initials"
                          className="text-gray-500 dark:text-gray-400 text-xs mb-1"
                        >
                          Avatar Initials (Fallback)
                        </Label>
                        <Input
                          id="initials"
                          value={initials}
                          onChange={(e) =>
                            setInitials(e.target.value.toUpperCase())
                          }
                          maxLength={2}
                          className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-black dark:text-white text-2xl font-bold mb-1">{name}</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{profession}</p>
                    </>
                  )}

                  <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700/50 mt-4">
                    {isEditing ? (
                      <Button
                        onClick={() => {
                          // Save changes to AuthContext
                          updateProfile({ name, email, picture: avatarImage || '' });
                          setIsEditing(false);
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Premium Account</span>
                        </div>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    )}
                    {!isEditing && (
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-3 text-center">
                        Member since March 2024
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Email</p>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white text-sm"
                      />
                    ) : (
                      <p className="text-black dark:text-white text-sm">{email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Role</p>
                    {isEditing ? (
                      <Input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-black dark:text-white text-sm"
                      />
                    ) : (
                      <p className="text-black dark:text-white text-sm">{role}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Middle Column - Statistics */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 flex flex-col gap-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100/50 dark:bg-transparent dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-600/20 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Documents</p>
                    <p className="text-black dark:text-white text-2xl font-bold">127</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100/50 dark:bg-transparent dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-purple-600/20 flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Hours Saved</p>
                    <p className="text-black dark:text-white text-2xl font-bold">342</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100/50 dark:bg-transparent dark:bg-gradient-to-br dark:from-green-500/20 dark:to-green-600/20 flex items-center justify-center mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg. Risk Score</p>
                    <p className="text-black dark:text-white text-2xl font-bold">52</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100/50 dark:bg-transparent dark:bg-gradient-to-br dark:from-yellow-500/20 dark:to-yellow-600/20 flex items-center justify-center mb-3">
                      <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Achievements</p>
                    <p className="text-black dark:text-white text-2xl font-bold">8</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: 'Analyzed Service Agreement', time: '2 hours ago', icon: FileText },
                  { action: 'Updated Profile Settings', time: '1 day ago', icon: Settings },
                  { action: 'Completed NDA Review', time: '2 days ago', icon: Award },
                  { action: 'Uploaded Employment Contract', time: '3 days ago', icon: FileText },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-700/30 last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black dark:text-white text-sm">{activity.action}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Settings & Preferences */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 flex flex-col gap-6"
          >
            {/* Quick Settings */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Bell, label: 'Notifications', status: 'Enabled' },
                  { icon: Shield, label: 'Two-Factor Auth', status: 'Active' },
                  { icon: Lock, label: 'Privacy Mode', status: 'On' },
                ].map((setting, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-100/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-all cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <setting.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-black dark:text-white text-sm">
                        {setting.label}
                      </span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                      {setting.status}
                    </span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Usage This Month */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border-gray-200 dark:border-gray-700/50 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">
                  Usage This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Documents Analyzed</span>
                    <span className="text-black dark:text-white font-medium">28 / 50</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700/30 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: '56%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Storage Used</span>
                    <span className="text-black dark:text-white font-medium">3.2 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700/30 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                      style={{ width: '32%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">API Calls</span>
                    <span className="text-black dark:text-white font-medium">847 / 1000</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700/30 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full"
                      style={{ width: '84.7%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm border-blue-200 dark:border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-black dark:text-white font-semibold">Premium Plan</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-xs">
                      Renews on April 15, 2024
                    </p>
                  </div>
                </div>
                <Button className="w-full mt-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white border-black/10 dark:border-white/20">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}