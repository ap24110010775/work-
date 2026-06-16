import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import WorkYaarLogo from './WorkYaarLogo';

const navTopics = [
  {
    label: 'Career Advice',
    items: ['Resume tips', 'Interview preparation', 'Salary guide', 'Career paths'],
  },
  {
    label: 'Events',
    items: ['Hiring challenges', 'Webinars', 'Job fairs', 'Campus events'],
  },
  {
    label: 'Internships',
    items: ['Summer internships', 'Paid internships', 'Work from home', 'College internships'],
  },
  {
    label: 'Campus Hiring',
    items: ['For colleges', 'Placement drives', 'Fresher programs', 'Employer branding'],
  },
  {
    label: 'Browse Jobs',
    items: ['Remote jobs', 'Fresher jobs', 'Part-time jobs', 'Startup jobs'],
  },
];

type HeaderNavProps = {
  variant?: 'landing' | 'auth';
};

const HeaderNav = ({ variant = 'landing' }: HeaderNavProps) => {
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTopic = (topic: string) => {
    setOpenTopic((current) => (current === topic ? null : topic));
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl',
        variant === 'landing' ? 'px-5 py-3 md:px-8' : 'px-5 py-3 md:px-8',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <WorkYaarLogo imageClassName="h-14 w-14 rounded-xl bg-white shadow-sm" textClassName="text-3xl" />

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {navTopics.map((topic) => (
            <div key={topic.label} className="relative">
              <button
                type="button"
                onClick={() => toggleTopic(topic.label)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-gray-700 transition-colors',
                  openTopic === topic.label ? 'bg-orange-50 text-[#F56618]' : 'hover:bg-gray-50 hover:text-[#F56618]',
                )}
                aria-expanded={openTopic === topic.label}
              >
                {topic.label}
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', openTopic === topic.label && 'rotate-180')}
                />
              </button>

              <AnimatePresence>
                {openTopic === topic.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 8, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-1/2 top-full w-64 -translate-x-1/2 rounded-3xl border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-200/80"
                  >
                    <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                      {topic.label}
                    </p>
                    <div className="space-y-1">
                      {topic.items.map((item) => (
                        <a
                          key={item}
                          href="/#opportunities"
                          onClick={() => setOpenTopic(null)}
                          className="block rounded-2xl px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-orange-50 hover:text-[#F56618]"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/register"
            className="rounded-full bg-white px-6 py-3 text-sm font-black text-gray-900 shadow-lg shadow-gray-200 transition-transform hover:-translate-y-0.5"
          >
            Join Free
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-[#F56618] px-7 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition-transform hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-full border border-gray-200 p-2 text-gray-700 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-auto mt-4 max-w-7xl rounded-3xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-200/60">
              {navTopics.map((topic) => (
                <div key={topic.label} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.label)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-black text-gray-800"
                  >
                    {topic.label}
                    <ChevronDown size={16} className={cn('transition-transform', openTopic === topic.label && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {openTopic === topic.label && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          {topic.items.map((item) => (
                            <a
                              key={item}
                              href="/#opportunities"
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-orange-50 hover:text-[#F56618]"
                            >
                              {item}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link to="/register" className="rounded-full bg-gray-50 px-5 py-3 text-center text-sm font-black text-gray-900">
                  Join Free
                </Link>
                <Link to="/login" className="rounded-full bg-[#F56618] px-5 py-3 text-center text-sm font-black text-white">
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HeaderNav;