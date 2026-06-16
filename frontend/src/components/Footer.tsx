import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Send } from 'lucide-react';
import WorkYaarLogo from './WorkYaarLogo';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#090D16] text-gray-400 overflow-hidden border-t border-white/5 pt-20 pb-8 font-sans selection:bg-[#F56618] selection:text-white">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-[#F56618]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[25vw] h-[25vw] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-8 relative z-10 max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-16">
          {/* Brand and Description */}
          <div className="lg:col-span-2 space-y-6">
            <WorkYaarLogo 
              onDark={true}
              className="inline-flex" 
              imageClassName="h-12 w-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-1"
              textClassName="text-white text-2xl"
              yaarClassName="text-[#FF6B35]"
            />
            <p className="text-gray-400 text-[15px] leading-relaxed max-w-sm">
              WorkYaar connects top-tier talent with fast-growing companies through AI-powered matching, smart ATS analysis, and flexible gig solutions.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="Twitter"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all hover:-translate-y-1 text-gray-400"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all hover:-translate-y-1 text-gray-400"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="GitHub"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all hover:-translate-y-1 text-gray-400"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="YouTube"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all hover:-translate-y-1 text-gray-400"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">For Candidates</h4>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <a href="#opportunities" className="hover:text-[#FF6B35] transition-colors">Browse Jobs</a>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#FF6B35] transition-colors">Create Profile</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">On-Demand Gigs</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">WorkYaar Pro</Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">For Employers</h4>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Post a Job</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Find Candidates</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">ATS Screening</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Pricing Plans</Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-[15px]">
              <li>
                <a href="#community" className="hover:text-[#FF6B35] transition-colors">Blog & News</a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Help Center</Link>
              </li>
              <li>
                <a href="mailto:support@workyaar.com" className="hover:text-[#FF6B35] transition-colors">Contact Support</a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Success Stories</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Stay Updated</h4>
            <p className="text-gray-400 text-[14px]">
              Subscribe to get the latest job postings and career growth advice.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="relative flex items-center">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-white outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all pr-12 placeholder-gray-500"
                />
                <button 
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="absolute right-1.5 w-9 h-9 rounded-lg bg-[#FF6B35] hover:bg-[#e85a25] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <Send size={14} />
                </button>
              </div>
              {subscribed && (
                <p className="text-emerald-500 text-xs font-semibold">
                  Thank you! You have successfully subscribed to our newsletter.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/5 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} WorkYaar Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-[#FF6B35] transition-colors">Terms of Service</Link>
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              Back to Top
              <ArrowUp size={12} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
