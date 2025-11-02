import { ArrowLeft, FileText, AlertTriangle, Scale, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';

export function TermsOfService() {
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                {inline('Terms of Service')}
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
          {/* Agreement to Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-semibold text-white">{inline('Agreement to Terms')}</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {inline('By accessing or using LawBuddy AI ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.')}
            </p>
          </section>

          {/* Important Legal Disclaimer */}
          <section className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-red-300 mb-2">{inline('Critical Legal Disclaimer')}</h2>
                <div className="space-y-3 text-gray-200">
                  <p className="font-semibold">
                    {inline('THIS SERVICE PROVIDES INFORMATIONAL ANALYSIS ONLY AND DOES NOT CONSTITUTE LEGAL ADVICE.')}
                  </p>
                  <p>
                    {inline('LawBuddy AI is an AI-powered document analysis tool designed to assist with understanding legal documents. It is NOT a substitute for professional legal counsel. Always consult with a qualified attorney before making any legal decisions.')}
                  </p>
                  <p>
                    {inline('The analysis, insights, and recommendations provided by this Service may contain errors, omissions, or inaccuracies. We make no representations or warranties regarding the accuracy, completeness, or reliability of any information provided.')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Use License */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Use License')}</h2>
            </div>
            <div className="text-gray-300 space-y-4">
              <p className="leading-relaxed">
                {inline('Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:')}
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{inline('Access and use the Service for your personal or business purposes')}</li>
                <li>{inline('Upload and analyze legal documents')}</li>
                <li>{inline('Access analysis results and reports generated by the Service')}</li>
              </ul>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Acceptable Use')}</h2>
            </div>
            <div className="text-gray-300 space-y-4">
              <p className="leading-relaxed mb-2">{inline('You agree to use the Service only for lawful purposes. You shall NOT:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{inline('Violate any applicable laws or regulations')}</li>
                <li>{inline('Upload malicious content or viruses')}</li>
                <li>{inline('Attempt to gain unauthorized access to the Service or related systems')}</li>
                <li>{inline('Reverse engineer, decompile, or disassemble the Service')}</li>
                <li>{inline('Use the Service to provide legal advice to third parties')}</li>
                <li>{inline('Share your account credentials with others')}</li>
                <li>{inline('Use automated tools to scrape or extract data from the Service')}</li>
              </ul>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('User Accounts')}</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="leading-relaxed">
                {inline('You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must:')}
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{inline('Provide accurate and complete registration information')}</li>
                <li>{inline('Keep your password secure and confidential')}</li>
                <li>{inline('Notify us immediately of any unauthorized use of your account')}</li>
                <li>{inline('Be responsible for all activities conducted through your account')}</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Intellectual Property')}</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="leading-relaxed">
                {inline('The Service, including all content, features, and functionality, is owned by LawBuddy AI and is protected by copyright, trademark, and other intellectual property laws.')}
              </p>
              <p className="leading-relaxed">
                {inline('You retain all rights to the documents you upload. By using the Service, you grant us a limited license to process your documents solely for the purpose of providing the Service to you.')}
              </p>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Prohibited Uses')}</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="leading-relaxed mb-2">{inline('The following uses are strictly prohibited:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{inline('Using the Service as a replacement for licensed legal counsel')}</li>
                <li>{inline('Relying solely on the Service for legal decision-making')}</li>
                <li>{inline('Distributing analysis results as professional legal opinions')}</li>
                <li>{inline('Using the Service to provide unauthorized legal services')}</li>
                <li>{inline('Training competing AI models using our Service')}</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Limitation of Liability')}</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="leading-relaxed font-semibold text-white">
                {inline('TO THE MAXIMUM EXTENT PERMITTED BY LAW:')}
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  {inline('THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED')}
                </li>
                <li>
                  {inline('WE ARE NOT LIABLE FOR ANY LEGAL DECISIONS MADE BASED ON THE SERVICE')}
                </li>
                <li>
                  {inline('WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES')}
                </li>
                <li>
                  {inline('OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE PAST 12 MONTHS')}
                </li>
              </ul>
            </div>
          </section>

          {/* Subscription and Billing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Subscription and Billing')}</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p className="leading-relaxed">
                {inline('Some features of the Service require a paid subscription. By subscribing, you agree to pay all applicable fees. Subscriptions automatically renew unless cancelled before the renewal date.')}
              </p>
              <p className="leading-relaxed">
                {inline('You may cancel your subscription at any time. Refunds are provided in accordance with our refund policy.')}
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Termination')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for violation of these Terms or for any other reason. Upon termination, your right to use the Service will immediately cease.')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Changes to Terms')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the updated Terms on this page. Your continued use of the Service after changes constitutes acceptance of the new Terms.')}
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">{inline('Governing Law')}</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {inline('These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LawBuddy AI operates, without regard to its conflict of law provisions.')}
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-400/30">
            <h2 className="text-2xl font-semibold text-white mb-3">{inline('Contact Us')}</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {inline('If you have any questions about these Terms of Service, please contact us at:')}
            </p>
            <a
              href="mailto:team.lawbuddy.ai@gmail.com?subject=Terms of Service Inquiry"
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
