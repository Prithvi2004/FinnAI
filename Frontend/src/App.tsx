import { useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import {
  BookDown as BookDollar,
  BrainCircuit,
  BarChart3,
  PieChart,
  NewspaperIcon,
  MessageSquare,
  Shield,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  Loader2
} from "lucide-react";
import { UserMenu } from "./components/UserMenu";
import { FinnAILogo } from "./components/FinnAILogo";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TiltCard } from "./components/TiltCard";
import { motion } from "framer-motion";
import { FinancialProvider } from "./contexts/FinancialContext";
import { ToastProvider, useToast } from "./components/Toast";

const tickerItems = [
  { symbol: "AAPL", price: "173.50", change: "+1.2%" },
  { symbol: "TSLA", price: "202.64", change: "-0.8%" },
  { symbol: "BTC", price: "64,230", change: "+4.5%" },
  { symbol: "ETH", price: "3,450", change: "+2.1%" },
  { symbol: "NVDA", price: "850.20", change: "+3.4%" },
  { symbol: "MSFT", price: "420.55", change: "+0.5%" },
  { symbol: "SPY", price: "508.80", change: "+0.9%" },
  { symbol: "AMZN", price: "178.22", change: "+1.5%" },
];

const ChatWindow = lazy(() => import("./components/ChatWindow").then(m => ({ default: m.ChatWindow })));
const AuthPages = lazy(() => import("./components/AuthPages").then(m => ({ default: m.AuthPages })));
const InvestmentPage = lazy(() => import("./pages/InvestmentPage").then(m => ({ default: m.InvestmentPage })));
const FinancialDetailsForm = lazy(() => import("./components/FinancialDetailsForm").then(m => ({ default: m.FinancialDetailsForm })));

const LoadingFallback = () => (
  <div className="fixed inset-0 bg-charcoal-950/50 backdrop-blur-sm z-[100] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-bronze animate-spin" />
  </div>
);

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFinancialFormOpen, setIsFinancialFormOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const prevUserRef = useRef<typeof user>(undefined);

  // Detect login / logout transitions
  useEffect(() => {
    const prev = prevUserRef.current;
    if (prev === undefined) {
      prevUserRef.current = user;
      return;
    }
    if (!prev && user) {
      // Logged in
      showToast("success", "Welcome back! 👋", user.email ?? "You're now signed in.");
    } else if (prev && !user) {
      // Logged out
      showToast("info", "Signed out", "See you next time!");
    }
    prevUserRef.current = user;
  }, [user]);

  const handleStartInvesting = () => {
    setIsFinancialFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-warmGrey-100 font-sans">
      <div className="particles-bg"></div>

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-charcoal-950/80 backdrop-blur-xl border-b border-charcoal-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 group cursor-pointer">
              <FinnAILogo size={36} className="transition-transform duration-300 group-hover:scale-105" />
              <span className="text-xl font-bold font-serif tracking-tight">Finn<span className="text-bronze">AI</span></span>
            </div>

            <nav className="hidden md:flex space-x-6">
              {[
                "Home",
                "Learn",
                "Invest",
                "Portfolio",
                "Sentiment",
                "Support",
              ].map((item) => (
                <a key={item} href="#" className="nav-link">
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {!loading &&
                (user ? (
                  <>
                    <button
                      onClick={handleStartInvesting}
                      className="glow px-8 py-3 bg-bronze text-charcoal-950 font-medium rounded-lg hover:bg-bronze-light transition-colors"
                    >
                      Upload Data
                    </button>
                    <UserMenu />
                  </>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="hidden md:block px-6 py-2 bg-bronze text-charcoal-950 font-medium rounded-lg hover:bg-bronze-light transition-colors"
                  >
                    Sign In
                  </button>
                ))}
              <button
                className="md:hidden text-warmGrey-300 hover:text-bronze"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden bg-charcoal-900 border-b border-charcoal-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {[
                  "Home",
                  "Learn",
                  "Invest",
                  "Portfolio",
                  "Sentiment",
                  "Support",
                ].map((item) => (
                  <a key={item} href="#" className="nav-link">
                    {item}
                  </a>
                ))}
                {!loading && !user && (
                  <button
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="px-6 py-2 bg-bronze text-charcoal-950 font-medium rounded-lg hover:bg-bronze-light transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex items-center pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl text-left mx-auto lg:mx-0"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium mb-4 md:mb-6 leading-tight text-warmGrey-100">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="block"
                >Your</motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="italic text-bronze font-light block"
                >AI-Powered</motion.span>
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="block"
                >Financial Assistant.</motion.span>
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="text-base md:text-xl text-warmGrey-400 mb-8 md:mb-10 font-light max-w-lg"
              >
                Gain precision insights, simulate risk profiles, and navigate global markets effortlessly with our next-generation engine.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3"
              >
                {user ? (
                  <button
                    onClick={() => navigate("/invest")}
                    className="w-full xs:w-auto px-6 py-3 md:px-8 md:py-4 bg-bronze text-charcoal-950 font-medium rounded-xl hover:bg-bronze-light transition-all shadow-lg shadow-bronze/20 hover:shadow-bronze/40 hover:-translate-y-1 text-sm md:text-base"
                  >
                    Start Investing Now
                  </button>
                ) : null}
                <button className="w-full xs:w-auto px-6 py-3 md:px-8 md:py-4 border border-charcoal-700 text-warmGrey-300 rounded-xl hover:border-bronze transition-colors hover:text-bronze backdrop-blur-sm bg-charcoal-950/30 text-sm md:text-base text-center">
                  Explore Platform
                </button>
              </motion.div>
            </motion.div>

            {/* Visual Dashboard/Insights Graphic */}
            <div className="hidden lg:flex h-[600px] w-full relative items-center justify-center pointer-events-none perspective-[2000px]">
              {/* Main abstract card */}
              <motion.div
                initial={{ opacity: 0, rotateY: -15, z: -100 }}
                animate={{ opacity: 1, rotateY: -5, z: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute w-[400px] bg-charcoal-900/60 backdrop-blur-2xl border border-charcoal-800 rounded-3xl p-6 shadow-2xl flex flex-col"
              >
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-bronze/20 flex items-center justify-center">
                      <PieChart className="text-bronze w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-warmGrey-200 font-medium">Portfolio AI</h4>
                      <p className="text-xs text-warmGrey-500">Auto-Rebalanced</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full text-sm">+24.5%</span>
                </div>
                {/* Minimalist spline/graph placeholder */}
                <svg className="w-full h-24 mb-4 mt-8 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                    d="M0,30 Q20,25 40,10 T80,5 T100,0" 
                    fill="none" 
                    stroke="#b89a7a" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                    d="M0,30 Q20,25 40,10 T80,5 T100,0 L100,30 L0,30 Z" 
                    fill="url(#hero-gradient)" 
                  />
                  <defs>
                    <linearGradient id="hero-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#b89a7a" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#b89a7a" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-between text-xs text-warmGrey-500 z-10 border-t border-charcoal-800/50 pt-4">
                  <span>1M</span>
                  <span>3M</span>
                  <span>6M</span>
                  <span>1Y</span>
                  <span className="text-bronze font-medium">YTD</span>
                </div>
              </motion.div>

              {/* Floating Alert Widget */}
              <motion.div
                initial={{ opacity: 0, x: 50, y: 50 }}
                animate={{ opacity: 1, x: 130, y: 160 }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="absolute w-[280px] bg-charcoal-900/80 backdrop-blur-xl border border-bronze/30 rounded-2xl p-4 shadow-xl z-20"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-bronze/10 shrink-0">
                    <Shield className="w-6 h-6 text-bronze" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-warmGrey-100">Risk Assessment</h5>
                    <p className="text-xs text-warmGrey-400 mt-1 line-clamp-2">High volatility detected in tech sector. Hedge options suggested.</p>
                  </div>
                </div>
              </motion.div>

               {/* Floating Stat Widget */}
               <motion.div
                initial={{ opacity: 0, x: -50, y: -50 }}
                animate={{ opacity: 1, x: -200, y: -140 }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="absolute w-[220px] bg-charcoal-900/90 backdrop-blur-xl border border-charcoal-700/50 rounded-2xl p-4 shadow-xl z-20"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-charcoal-800 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-bronze" />
                  </div>
                  <div>
                    <p className="text-xs text-warmGrey-500">Predicted Yield</p>
                    <h5 className="text-lg font-medium text-warmGrey-100">8.4% APY</h5>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Live Market Ticker */}
      <div className="w-full bg-charcoal-900 border-y border-charcoal-800 py-3 overflow-hidden flex whitespace-nowrap relative z-20">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-charcoal-900 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-charcoal-900 to-transparent z-10"></div>
        <motion.div
           animate={{ x: ["0%", "-50%"] }}
           transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
           className="flex space-x-12 min-w-max px-6"
        >
           {[...tickerItems, ...tickerItems].map((item, i) => (
             <div key={i} className="flex items-center space-x-3 tracking-wide">
               <span className="text-warmGrey-300 font-bold">{item.symbol}</span>
               <span className="text-warmGrey-100">${item.price}</span>
               <span className={`text-sm font-medium px-2 py-0.5 rounded ${item.change.startsWith('+') ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                 {item.change}
               </span>
             </div>
           ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="py-16 md:py-24 relative z-10 w-full flex flex-col items-center max-w-7xl mx-auto px-4 sm:px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-10 md:mb-16 text-warmGrey-100">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {[
              {
                icon: <MessageSquare className="w-8 h-8 text-bronze mb-4" />,
                title: "User Interaction Bot",
              },
              {
                icon: <BookDollar className="w-8 h-8 text-bronze mb-4" />,
                title: "Financial Literacy Bot",
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-bronze mb-4" />,
                title: "Product Recommendation Bot",
              },
              {
                icon: <Shield className="w-8 h-8 text-bronze mb-4" />,
                title: "Risk Assessment Bot",
              },
              {
                icon: <PieChart className="w-8 h-8 text-bronze mb-4" />,
                title: "Portfolio Management Bot",
              },
              {
                icon: <NewspaperIcon className="w-8 h-8 text-bronze mb-4" />,
                title: "Sentiment Analysis Bot",
              },
            ].map((feature, index) => (
              <TiltCard key={index} className="h-full flex flex-col items-start px-2 py-2">
                {feature.icon}
                <h3 className="text-lg md:text-xl font-bold mb-3 text-warmGrey-100 tracking-tight">{feature.title}</h3>
                <p className="text-warmGrey-400 text-sm leading-relaxed">
                  Advanced AI-powered analysis and recommendations tailored to
                  your financial goals.
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <MessageSquare className="w-12 h-12 text-bronze" />,
                title: "Ask Your Question",
              },
              {
                icon: <BrainCircuit className="w-12 h-12 text-bronze" />,
                title: "Get Personalized Advice",
              },
              {
                icon: <BarChart3 className="w-12 h-12 text-bronze" />,
                title: "Invest Confidently",
              },
            ].map((step, index) => (
              <div key={index} className="text-center group p-6 rounded-2xl hover:bg-charcoal-900/50 transition-colors border border-transparent hover:border-charcoal-800/50">
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-500">{step.icon}</div>
                <h3 className="text-xl font-medium mb-3 text-warmGrey-200">{step.title}</h3>
                <p className="text-warmGrey-500 text-sm">
                  Experience the power of AI-driven financial guidance.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chatbot */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[60] glow">
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-bronze text-charcoal-950 p-3 sm:p-4 rounded-full shadow-2xl hover:bg-bronze-light transition-colors hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Chat Window */}
      <Suspense fallback={null}>
        <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </Suspense>

      {/* Auth Pages */}
      <Suspense fallback={<LoadingFallback />}>
        {isAuthOpen && <AuthPages onClose={() => setIsAuthOpen(false)} />}
      </Suspense>

      {/* Financial Details Form */}
      <Suspense fallback={<LoadingFallback />}>
        {isFinancialFormOpen && (
          <FinancialDetailsForm
            onClose={() => {
              setIsFinancialFormOpen(false);
              showToast("success", "Financial profile saved!", "Your details are ready for AI analysis.");
            }}
          />
        )}
      </Suspense>

      {/* Footer */}
      <footer className="bg-charcoal-950 border-t border-charcoal-800/50 py-12 md:py-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2.5 mb-4">
                <FinnAILogo size={28} />
                <h3 className="text-xl md:text-2xl font-serif font-medium text-warmGrey-100">Finn<span className="text-bronze">AI</span></h3>
              </div>
              <p className="text-warmGrey-500 leading-relaxed text-sm">
                Your trusted AI financial assistant
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-serif text-warmGrey-100 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-warmGrey-500 text-sm">
                <li><a href="#" className="hover:text-bronze transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-bronze transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-bronze transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 font-serif text-warmGrey-100 text-sm md:text-base">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-warmGrey-500 hover:text-bronze transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-warmGrey-500 hover:text-bronze transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-warmGrey-500 hover:text-bronze transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold mb-4 font-serif text-warmGrey-100 text-sm md:text-base">Newsletter</h4>
              <div className="flex w-full">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 bg-charcoal-950 border border-charcoal-800/30 rounded-l-lg px-3 md:px-4 py-2 text-sm focus:outline-none focus:border-bronze"
                />
                <button className="bg-bronze text-charcoal-950 px-3 md:px-4 py-2 rounded-r-lg hover:bg-bronze-light transition-colors font-medium text-sm shrink-0">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-charcoal-800/30 text-center text-warmGrey-600 text-xs">
            © 2025 FinnAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<HomePage />} />

              {/* Investment Page */}
              <Route path="/invest" element={<Suspense fallback={<LoadingFallback />}><InvestmentPage /></Suspense>} />
            </Routes>
          </Router>
        </ToastProvider>
      </FinancialProvider>
    </AuthProvider>
  );
}

export default App;
