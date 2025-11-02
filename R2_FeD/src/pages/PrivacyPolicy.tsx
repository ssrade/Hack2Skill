import { ArrowLeft, Shield, Eye, Lock, Server, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const { inline } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {inline('Back to Home')}
          </Button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                {inline('Privacy Policy')}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {inline('Last updated')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8"
        >
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-semibold text-white">{inline('Introduction')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {inline('Welcome to LawBuddy AI. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered legal document analysis platform.')}
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Information We Collect')}</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{inline('Personal Information')}</h3>
                <p className="leading-relaxed">
                  {inline('We collect information you provide directly to us, including:')}
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>{inline('Name and email address')}</li>
                  <li>{inline('Account credentials')}</li>
                  <li>{inline('Profile information')}</li>
                  <li>{inline('Payment information (processed securely through third-party providers)')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{inline('Document Data')}</h3>
                <p className="leading-relaxed">
                  {inline('When you upload documents for analysis, we temporarily process the content to provide our services. Documents are encrypted and stored securely.')}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{inline('Usage Information')}</h3>
                <p className="leading-relaxed">
                  {inline('We automatically collect certain information about your device and how you interact with our platform, including IP address, browser type, and usage patterns.')}
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('How We Use Your Information')}</h2>
            </div>
            <div className="text-gray-300 space-y-2">
              <p className="leading-relaxed">{inline('We use the information we collect to:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{inline('Provide, maintain, and improve our services')}</li>
                <li>{inline('Process your documents and deliver analysis results')}</li>
                <li>{inline('Communicate with you about your account and services')}</li>
                <li>{inline('Detect, prevent, and address technical issues and security threats')}</li>
                <li>{inline('Comply with legal obligations')}</li>
                <li>{inline('Improve our AI models and service quality')}</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Data Security')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We implement industry-standard security measures to protect your information, including:')}
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-gray-300">
              <li>{inline('End-to-end encryption for data transmission')}</li>
              <li>{inline('Encrypted storage of sensitive documents')}</li>
              <li>{inline('Regular security audits and updates')}</li>
              <li>{inline('Access controls and authentication measures')}</li>
              <li>{inline('Secure data centers with physical security')}</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Data Retention')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We retain your personal information and documents only for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your data at any time by contacting us.')}
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Your Rights')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-2">
              {inline('You have the right to:')}
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-gray-300">
              <li>{inline('Access and review your personal information')}</li>
              <li>{inline('Request corrections to your data')}</li>
              <li>{inline('Request deletion of your account and data')}</li>
              <li>{inline('Opt-out of marketing communications')}</li>
              <li>{inline('Export your data')}</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-pink-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Third-Party Services')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We use trusted third-party services for authentication (Google OAuth), payment processing, and infrastructure. These providers are contractually obligated to protect your information and use it only for providing services to us.')}
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Changes to This Policy')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.')}
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-400/30">
            <h2 className="text-2xl font-semibold text-white mb-3">{inline('Contact Us')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {inline('If you have any questions about this Privacy Policy, please contact us at:')}
            </p>
            <a
              href="mailto:team.lawbuddy.ai@gmail.com?subject=Privacy Policy Inquiry"
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              team.lawbuddy.ai@gmail.com
            </a>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
