import { LegalHero } from "../components/LandingPageComps/LegalHero";
import { LegalDisclaimer } from "../components/LandingPageComps/LegalDisclaimer";
import {
    ArrowDown,
    Shield,
    Zap,
    Target,
    Crown,
    Brain
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from '../contexts/TranslationContext';

const Index = () => {
    const { inline } = useTranslation();

    const features = [
        {
            icon: <Shield className="w-8 h-8 text-blue-400" />,
            title: inline("Bank-Level Security"),
            description: inline("Military-grade encryption ensures your legal documents remain completely confidential and secure."),
            // Unique "floating" resting state
            anim: { rotateX: 10, rotateY: -15, rotateZ: 3 }
        },
        {
            icon: <Zap className="w-8 h-8 text-purple-400" />,
            title: inline("Instant Analysis"),
            description: inline("Analyze complex legal documents in seconds with our advanced AI algorithms."),
            // Unique "floating" resting state
            anim: { rotateX: 5, rotateY: 12, rotateZ: -2 }
        },
        {
            icon: <Target className="w-8 h-8 text-green-400" />,
            title: inline("Precision Insights"),
            description: inline("Using RAG and vertexAI with a reference of deeds book."),
            // Unique "floating" resting state
            anim: { rotateX: 12, rotateY: 8, rotateZ: 5 }
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
            <div className="fixed -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
            <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>

            {/* Hero Section */}
            <LegalHero />

            {/* Animated scroll indicator */}
            <motion.div
                className="flex justify-center mt-4 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center text-gray-400"
                >
                    <span className="text-sm mb-2">{inline('Scroll to explore')}</span>
                    <ArrowDown className="w-5 h-5" />
                </motion.div>
            </motion.div>

            {/* Main Application */}
            <div className="container mx-auto px-6 py-16 relative z-10">
                <div className="max-w-6xl mx-auto space-y-20">

                    {/* Features Showcase (shown when no document uploaded) */}

                    <motion.section
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                        className="text-center py-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-4">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-blue-200 font-medium">{inline('Why Choose LawBuddy AI?')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl p-3 font-bold mb-12 bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                            {inline('Enterprise-Grade Legal AI')}
                        </h2>

                        <div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            // 1. Add perspective to the parent container
                            style={{ perspective: '1200px' }}
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 group cursor-pointer" // Removed hover styles, motion props will handle it

                                    // 2. Add style for 3D rendering
                                    style={{ transformStyle: 'preserve-3d' }}

                                    // 3. Define the initial state (fades and "flies" up into the float)
                                    initial={{ opacity: 0, y: 60, scale: 0.9, ...feature.anim }}

                                    // 4. Define the resting "floating" state (using the unique values from our array)
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        rotateX: feature.anim.rotateX,
                                        rotateY: feature.anim.rotateY,
                                        rotateZ: feature.anim.rotateZ
                                    }}

                                    // 5. Define the hover state (flat, zoomed, and popped forward)
                                    whileHover={{
                                        y: -10,      // Lift it up slightly
                                        rotateX: 0,  // Flatten it
                                        rotateY: 0,
                                        rotateZ: 0,
                                        scale: 1.05, // Zoom in
                                        translateZ: 50, // "Pop" it towards the user in 3D
                                        boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.35)' // Add a shadow to enhance the "lift"
                                    }}

                                    // 6. Define the "bouncing" spring transition
                                    transition={{
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 20,
                                        // Apply a slight delay to the initial "float-in" animation
                                        delay: index * 0.1
                                    }}
                                >
                                    {/* These children will now move in 3D space with their parent.
        You can even add a `translateZ` to them on hover to make them "pop" 
        out of the card, but let's start with the card itself.
      */}
                                    <div
                                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                                        // Also apply preserve-3d here if you plan to animate the icon itself
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>

                    </motion.section>


                    {/* Legal Disclaimer */}
                    <motion.section
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <LegalDisclaimer />
                    </motion.section>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-800/50 mt-20 py-12 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                                    {inline('LawBuddy AI')}
                                </span>
                                <p className="text-gray-400 text-sm">{inline('AI-Powered Legal Analysis')}</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm text-center md:text-right">
                            © {new Date().getFullYear()} {inline('LawBuddy AI. Transforming legal document analysis.')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;