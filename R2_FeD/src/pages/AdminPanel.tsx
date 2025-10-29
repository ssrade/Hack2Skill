import React from 'react'; // Added React import
import {
  ArrowLeft, Users, FileText, Zap, Database, CheckCircle, AlertTriangle, UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { cn } from '../components/lib/utils';

// (Animation variants remain unchanged)
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// (Props Interface remains unchanged)
interface AdminPanelProps { onBack: () => void; }

// (Dummy Data for Chart remains unchanged)
type ChartData = { name: string; uploads: number; apiCalls: number; };
const dailyUsageData: ChartData[] = [
  { name: 'Oct 1', uploads: 30, apiCalls: 2400 }, { name: 'Oct 2', uploads: 45, apiCalls: 2898 }, { name: 'Oct 3', uploads: 40, apiCalls: 3908 },
  { name: 'Oct 4', uploads: 51, apiCalls: 4800 }, { name: 'Oct 5', uploads: 62, apiCalls: 3800 }, { name: 'Oct 6', uploads: 55, apiCalls: 4300 },
  { name: 'Oct 7', uploads: 70, apiCalls: 5100 },
];

// (Dummy Data for Lists remains unchanged)
const recentActivity = [
  { icon: FileText, text: "User 'jane.doe' uploaded 'Employment Contract.pdf'", time: '5m ago' },
  { icon: AlertTriangle, text: "High-risk (92) document 'Merger_v3.pdf' flagged", time: '45m ago' },
  { icon: UserCheck, text: "New user 'legal.team@techcorp.com' signed up", time: '2h ago' },
  { icon: Database, text: 'System backup successfully completed', time: '3h ago' },
];
const recentUsers = [
  { name: 'Jane Doe', email: 'jane.doe@techcorp.com', initials: 'JD' },
  { name: 'John Smith', email: 'j.smith@lawfirm.com', initials: 'JS' },
  { name: 'Legal Team', email: 'legal.team@techcorp.com', initials: 'LT' },
];

// --- Custom Tooltip for Recharts (Updated Styles) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      // Update tooltip background, border, and text colors
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="label text-sm text-gray-600 dark:text-gray-400">{`${label}`}</p>
        <p className="text-blue-600 dark:text-blue-400">{`Uploads: ${payload[0].value}`}</p>
        <p className="text-purple-600 dark:text-purple-400">{`API Calls: ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

// --- Helper Component for Stat Cards (Updated Styles) ---
interface InfoCardProps { title: string; value: string; icon: React.ElementType; iconColorClass: string; iconLightBgClass: string; }
const InfoCard = ({ title, value, icon: Icon, iconColorClass, iconLightBgClass }: InfoCardProps) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
    {/* Update card background, border, hover states */}
    <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
      <CardContent className="p-4">
        {/* Update icon background and text color */}
        <div className={`w-10 h-10 rounded-lg ${iconLightBgClass} dark:bg-gradient-to-br ${iconColorClass} flex items-center justify-center mb-3`}>
          <Icon className={`w-5 h-5 ${iconColorClass} dark:text-white`} />
        </div>
        {/* Update text colors */}
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{title}</p>
        <p className="text-black dark:text-white text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main Admin Panel Component (Updated Styles) ---
export function AdminPanel({ onBack }: AdminPanelProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950 pt-3",
        "relative overflow-hidden"
      )}
    >
      {/* Background blobs */}
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1/4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col">
        {/* Update back button styles */}
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-4 w-fit border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 bg-white/50 dark:bg-gray-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>

        {/* Header */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          
        </motion.div>

        <motion.div
          className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Column 1: Key Metrics & Status */}
          <motion.div variants={itemVariants} className="col-span-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Update InfoCard props with light mode background classes */}
              <InfoCard title="Total Users" value="1,284" icon={Users} iconColorClass="text-blue-600 dark:from-blue-500/30 dark:to-blue-600/30" iconLightBgClass="bg-blue-100/50" />
              <InfoCard title="Total Documents" value="27,901" icon={FileText} iconColorClass="text-purple-600 dark:from-purple-500/30 dark:to-purple-600/30" iconLightBgClass="bg-purple-100/50" />
              <InfoCard title="API Calls (24h)" value="1.2M" icon={Zap} iconColorClass="text-yellow-600 dark:from-yellow-500/30 dark:to-yellow-600/30" iconLightBgClass="bg-yellow-100/50" />
              <InfoCard title="Database Size" value="4.8 TB" icon={Database} iconColorClass="text-green-600 dark:from-green-500/30 dark:to-green-600/30" iconLightBgClass="bg-green-100/50" />
            </div>
            {/* Server Status */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-black dark:text-white text-sm">API Service</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-black dark:text-white text-sm">Database</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                    <span className="text-black dark:text-white text-sm">Task Queue</span>
                  </div>
                  <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">3 Pending</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Column 2: Charts & Limits */}
          <motion.div variants={itemVariants} className="col-span-1 flex flex-col gap-6">
            {/* Usage Chart */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">Daily Usage (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-2">
                {/* Update chart grid/axis colors */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyUsageData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="uploads" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="apiCalls" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Quotas */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">Service Quotas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">API Token Limit</span>
                    <span className="text-black dark:text-white font-medium">8.2M / 10M</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Total Storage</span>
                    <span className="text-black dark:text-white font-medium">4.8 TB / 10 TB</span>
                  </div>
                  <Progress value={48} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Column 3: Activity & Users */}
          <motion.div variants={itemVariants} className="col-span-1 flex flex-col gap-6">
            {/* Recent Activity */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-700/30 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-black dark:text-white text-sm">{activity.text}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Recent Users */}
            <Card className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-black dark:text-white text-lg">Recently Active Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentUsers.map((user, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-black dark:text-white text-sm font-medium truncate">{user.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}