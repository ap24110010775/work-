import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffdf9]">
      <HeaderNav />
      <InterfaceDecor />
      
      {/* Hero Section */}
      <section className="container relative z-10 mx-auto flex flex-col items-center justify-between gap-12 px-6 pb-16 pt-16 md:px-8 lg:flex-row lg:pt-20">
        <div className="w-full max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-5xl font-black leading-[0.95] text-[#1A1A1A] sm:text-6xl xl:text-7xl"
          >
            Find <span className="text-[#FF6B35]">Verified</span><br />
            Remote &<br />
            <span className="text-[#1A1A1A]">Flexible Jobs</span><br />
            Faster
          </motion.h1>
          <p className="mb-10 max-w-lg text-lg leading-8 text-gray-500 sm:text-xl">
            See your personalised job recommendations based on your skills and goals
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <a href="#opportunities" className="px-8 py-4 bg-[#FF6B35] text-white text-lg font-bold rounded-2xl hover:bg-[#e85a25] transition-all transform hover:scale-105 shadow-xl shadow-[#FF6B35]/30">
              Find course
            </a>
            <a href="#community" className="flex items-center gap-2 text-lg font-bold text-[#FF6B35] group">
              View our blog <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        <HeroImageCarousel />
      </section>

      {/* Stats Section */}
      <section id="community" className="relative z-10 bg-white/70 py-24 backdrop-blur-sm">
        <div className="container mx-auto px-8">
          <h2 className="text-4xl font-black text-center mb-4">
            Trusted by the <span className="text-[#FF6B35]">Community</span>
          </h2>
          <p className="text-center text-gray-500 mb-16">
            Millions rely on WorkYaar to get hired and hire faster.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StatCard count="32K+" label="Verified Jobs" color="bg-orange-50" textColor="text-[#FF6B35]" />
            <StatCard count="14K+" label="Companies" color="bg-purple-50" textColor="text-purple-600" />
            <StatCard count="2M+" label="Jobseekers" color="bg-yellow-50" textColor="text-yellow-600" />
          </div>
        </div>
      </section>

      {/* Latest Opportunities */}
      <section id="opportunities" className="relative z-10 py-24">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-4xl font-black mb-4">
            Latest <span className="text-[#FF6B35]">Opportunities</span>
          </h2>
          <p className="text-gray-500 mb-16">
            Fresh roles added daily from fast-growing, verified companies.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            <JobCard
              icon="FD"
              title="Frontend Developer"
              tags={["Remote", "Full-Time"]}
              color="bg-[#FF5A35] text-white"
            />
            <JobCard
              icon="BE"
              title="Backend Engineer"
              tags={["Bangalore", "Hybrid"]}
              color="bg-[#7C5CFF] text-white"
            />
            <JobCard
              icon="UX"
              title="UI/UX Designer"
              tags={["Remote", "Contract"]}
              color="bg-[#F5B612] text-white"
            />
          </div>

          <HireBanner />
        </div>
      </section>

      <Footer />
    </div>
  );
};

const InterfaceDecor = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div className="absolute -left-28 top-28 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
    <div className="absolute right-[-120px] top-36 h-96 w-96 rounded-full bg-yellow-100/80 blur-3xl" />
    <div className="absolute bottom-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-50 blur-2xl" />
    <div className="absolute left-8 top-[520px] hidden h-36 w-36 rounded-[2rem] border border-orange-200/70 md:block" />
    <div className="absolute right-16 top-[680px] hidden h-28 w-28 rounded-full border border-yellow-300/70 md:block" />
    <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#f56618_1px,transparent_1px)] [background-size:28px_28px]" />
    <Briefcase className="absolute left-[8%] top-[22%] hidden text-orange-200 md:block" size={42} />
    <Search className="absolute right-[10%] top-[48%] hidden text-orange-200 md:block" size={38} />
    <Sparkles className="absolute left-[46%] top-[18%] hidden text-yellow-300 lg:block" size={34} />
  </div>
);

const StatCard = ({ count, label, color, textColor }: any) => (
  <div className={cn("p-10 rounded-[32px] text-center border border-white shadow-xl shadow-gray-200/50", color)}>
    <div className={cn("text-5xl font-black mb-2", textColor)}>{count}</div>
    <div className="text-gray-600 font-bold">{label}</div>
  </div>
);

const heroSlides = [
  {
    src: '/assets/hero-pencil-rider.png',
    alt: 'Woman riding a purple pencil illustration',
  },
  {
    src: '/assets/hero-laptop-worker.png',
    alt: 'Woman working on a laptop illustration',
  },
];

const HeroImageCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative lg:-ml-12 xl:-ml-20"
    >
      <div className="relative flex h-[320px] w-[min(92vw,540px)] items-center justify-center overflow-hidden rounded-[44px] border-2 border-gray-100 bg-white sm:h-[400px] sm:rounded-[60px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={heroSlides[activeSlide].src}
            src={heroSlides[activeSlide].src}
            alt={heroSlides[activeSlide].alt}
            initial={{ x: -180, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const JobCard = ({ icon, title, tags, color }: { icon: string; title: string; tags: string[]; color: string }) => (
  <div className="rounded-[28px] border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/70">
    <div className={cn("mb-7 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black", color)}>
      {icon}
    </div>
    <h3 className="mb-4 text-2xl font-black text-gray-950">{title}</h3>
    <div className="mb-7 flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-bold",
            tag === 'Remote' ? 'bg-orange-50 text-[#FF5A35]' : 'bg-gray-100 text-gray-600',
          )}
        >
          {tag}
        </span>
      ))}
    </div>
    <Link to="/login" className="inline-flex items-center gap-2 text-lg font-black text-[#FF5A35] transition-transform hover:translate-x-1">
      Apply now <ArrowRight size={18} />
    </Link>
  </div>
);

const HireBanner = () => (
  <div className="relative mx-auto mt-24 max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-r from-[#FF5534] to-[#FF7442] px-6 py-24 text-center text-white">
    <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/10" />
    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
    <div className="relative z-10">
      <h2 className="mb-5 text-4xl font-black md:text-5xl">Hire Smarter with WorkYaar</h2>
      <p className="mb-9 text-lg font-medium text-white/90 md:text-xl">
        Reach qualified candidates instantly with AI matching.
      </p>
      <Link
        to="/dashboard/employer"
        className="inline-flex rounded-full bg-white px-12 py-5 text-lg font-black text-[#FF5534] shadow-xl shadow-orange-900/10 transition-transform hover:-translate-y-1"
      >
        Post a Job
      </Link>
    </div>
  </div>
);

export default LandingPage;
