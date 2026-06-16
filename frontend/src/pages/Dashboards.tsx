import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  Crown,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  User,
  Video,
  X,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkYaarLogo from '../components/WorkYaarLogo';
import { clearAuthUser, getAuthUser, getInitials, type AuthUser } from '../lib/auth';
import { cn } from '../lib/utils';

type Role = 'admin' | 'candidate' | 'employer';
type NavigateHandler = (page: string) => void;

function resolveResumeUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function getAtsLists(score: { strengths?: string[]; weaknesses?: string[]; matches?: string[]; improvements?: string[] }) {
  return {
    strengths: score?.strengths?.length ? score.strengths : score?.matches || [],
    weaknesses: score?.weaknesses?.length ? score.weaknesses : score?.improvements || [],
  };
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const URL_REGEX = /^https?:\/\/.+\..+/i;

function validateCompanyForm(fields: {
  name: string; website: string; logoUrl: string; employeeCount: string;
  foundedYear: string; employerType: string; hiringStatus: string; gstNumber: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.name.trim() || fields.name.trim().length < 2) errors.name = 'Company name is required (min 2 chars)';
  if (fields.website.trim() && !URL_REGEX.test(fields.website.trim())) errors.website = 'Enter a valid website URL (https://...)';
  if (fields.logoUrl.trim() && !URL_REGEX.test(fields.logoUrl.trim())) errors.logoUrl = 'Logo URL must start with http:// or https://';
  if (fields.gstNumber.trim() && !GSTIN_REGEX.test(fields.gstNumber.trim())) {
    errors.gstNumber = 'Invalid GSTIN — must be 15 characters (e.g. 29ABCDE1234F1Z5)';
  }
  if (fields.foundedYear.trim()) {
    const y = Number(fields.foundedYear);
    const current = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1800 || y > current) errors.foundedYear = `Year must be 1800–${current}`;
  }
  return errors;
}

let sharedMessageApplicationId: number | null = null;

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  page: string;
  badge?: string;
  premium?: boolean;
}

interface TopicCard {
  icon: typeof LayoutDashboard;
  title: string;
  text: string;
  to: string;
}

const dashboardNavTopics = [
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

const menuItems: Record<Role, MenuItem[]> = {
  candidate: [
    { icon: Home, label: 'Dashboard', page: 'Dashboard' },
    { icon: User, label: 'Profile', page: 'Profile' },
    { icon: Briefcase, label: 'Jobs', page: 'Jobs' },
    { icon: Send, label: 'Applications', page: 'Applications' },
    { icon: Bookmark, label: 'Saved Jobs', page: 'Saved Jobs' },
    { icon: Compass, label: 'Discover', page: 'Discover' },
    { icon: Zap, label: 'On-Demand Gigs', page: 'On-Demand Gigs' },
    { icon: MessageSquare, label: 'Messages', page: 'Messages' },
    { icon: Calendar, label: 'Interviews', page: 'Interviews' },
    { icon: Crown, label: 'WorkYaar Pro', page: 'WorkYaar Pro', premium: true },
  ],
  employer: [
    { icon: Home, label: 'Dashboard', page: 'Dashboard' },
    { icon: Building2, label: 'Company Profile', page: 'Company Profile' },
    { icon: Plus, label: 'Post Job', page: 'Post Job' },
    { icon: Briefcase, label: 'Manage Jobs', page: 'Manage Jobs' },
    { icon: Send, label: 'Applications', page: 'Applications' },
    { icon: MessageSquare, label: 'Messages', page: 'Messages' },
    { icon: Calendar, label: 'Interviews', page: 'Interviews' },
  ],
  admin: [
    { icon: Home, label: 'Dashboard', page: 'Dashboard' },
    { icon: User, label: 'Users', page: 'Users' },
    { icon: Briefcase, label: 'Jobs', page: 'Jobs' },
    { icon: Building2, label: 'Companies', page: 'Companies' },
  ],
};

const defaultSubtitles: Record<Role, string> = {
  admin: 'Manage users, jobs and platform activity with ease.',
  candidate: 'Plan, prioritize, and accomplish your job search with ease.',
  employer: 'Plan, prioritize, and accomplish your tasks with ease.',
};

const topicDescriptions: Record<Role, Record<string, string>> = {
  candidate: {
    Profile: 'Update your resume, skills, education, and profile completion details.',
    Jobs: 'Browse verified jobs matched to your skills and preferred work style.',
    Applications: 'Track every job application and see the next step clearly.',
    'Saved Jobs': 'Review roles you saved and apply when you are ready.',
    Discover: 'Explore roles, learning paths, and companies recommended for you.',
    'On-Demand Gigs': 'Find quick projects and flexible earning opportunities.',
    Messages: 'Open recruiter and company conversations in one place.',
    Interviews: 'View upcoming interviews, meeting links, and preparation notes.',
    'WorkYaar Pro': 'Unlock priority matching, resume review, and premium career tools.',
    Settings: 'Control account preferences, privacy, and notifications.',
    Help: 'Find support articles and ways to contact the WorkYaar team.',
    Notifications: 'Review recent updates from jobs, messages, and interviews.',
  },
  employer: {
    'Company Profile': 'Show candidates your company story, hiring values, and benefits.',
    'Post Job': 'Create a verified role with requirements, location, salary, and screening questions.',
    'Manage Jobs': 'Edit active jobs, pause listings, and review performance.',
    Applications: 'Review candidates, shortlist profiles, and move people to interviews.',
    Interviews: 'Manage interview schedules, meeting links, and notes.',
    Settings: 'Control team access, billing preferences, and notification rules.',
    Help: 'Get hiring support and platform guidance.',
    Notifications: 'Review new applicant, job, and interview updates.',
  },
  admin: {
    Users: 'Review platform users, roles, and account activity.',
    Jobs: 'Moderate posted jobs and keep listings verified.',
    Companies: 'Manage employer accounts and company verification.',
    Settings: 'Control admin preferences and platform defaults.',
    Help: 'Open support and moderation documentation.',
    Notifications: 'Review platform alerts and moderation reminders.',
  },
};

const DashboardShell = ({
  role,
  renderDashboard,
}: {
  role: Role;
  renderDashboard: (navigate: NavigateHandler) => ReactNode;
}) => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser] = useState<AuthUser | null>(() => getAuthUser());
  const header = useMemo(() => getHeaderCopy(role, activePage), [role, activePage]);
  const employerDetailPages = ['Company Profile', 'Post Job', 'Manage Jobs', 'Applications', 'Interviews'];
  const hideHeader = role === 'employer' && employerDetailPages.includes(activePage);

  const navigate = (page: string) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <DashboardTopBar
        role={role}
        onNavigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <div className="flex">
        <Sidebar role={role} activePage={activePage} onNavigate={navigate} />
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              aria-label="Close dashboard menu"
              className="absolute inset-0 bg-black/35"
              onClick={() => setMobileMenuOpen(false)}
            />
            <Sidebar role={role} activePage={activePage} onNavigate={navigate} mobile />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {!hideHeader && <Header role={role} title={header.title} subtitle={header.subtitle} onNavigate={navigate} authUser={authUser} />}
          <main className="p-4 sm:p-6 lg:p-8">
            {activePage === 'Dashboard' ? renderDashboard(navigate) : <TopicPanel role={role} page={activePage} onNavigate={navigate} />}
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardTopBar = ({
  role,
  onNavigate,
  mobileMenuOpen,
  onToggleMobileMenu,
}: {
  role: Role;
  onNavigate: NavigateHandler;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}) => {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const toggleTopic = (topic: string) => {
    setOpenTopic((current) => (current === topic ? null : topic));
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-8">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="rounded-xl border border-gray-200 p-2 text-gray-700 lg:hidden"
          aria-label="Open dashboard menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {role === 'admin' && <WorkYaarLogo imageClassName="h-10 w-10" textClassName="text-2xl" />}
        <nav className="hidden items-center gap-1 text-sm font-bold text-gray-600 lg:flex">
          <Link to="/" className="rounded-full px-4 py-2 transition-colors hover:bg-orange-50 hover:text-[#F56618]">
            Home
          </Link>
          {dashboardNavTopics.map((topic) => (
            <div key={topic.label} className="relative">
              <button
                type="button"
                onClick={() => toggleTopic(topic.label)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-4 py-2 transition-colors',
                  openTopic === topic.label ? 'bg-orange-50 text-[#F56618]' : 'hover:bg-orange-50 hover:text-[#F56618]',
                )}
                aria-expanded={openTopic === topic.label}
              >
                {topic.label}
                <ChevronDown size={16} className={cn('transition-transform', openTopic === topic.label && 'rotate-180')} />
              </button>

              {openTopic === topic.label && (
                <div className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 rounded-3xl border border-orange-100 bg-white p-3 shadow-2xl shadow-orange-100/80">
                  <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
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
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('Notifications')}
          className="relative rounded-full border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-[#F56618] hover:text-[#F56618]"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F56618]" />
        </button>
        {role === 'admin' && (
          <Link onClick={clearAuthUser} to="/login" className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-2 text-sm font-bold text-gray-900 transition-colors hover:bg-white">
            Logout
          </Link>
        )}
      </div>
    </div>
  );
};

const getHeaderCopy = (role: Role, page: string) => {
  if (page === 'Dashboard') {
    return {
      title: role === 'admin' ? 'Admin Dashboard' : 'Dashboard',
      subtitle: defaultSubtitles[role],
    };
  }

  return {
    title: page,
    subtitle: topicDescriptions[role][page] ?? 'Open related tools and actions for this section.',
  };
};

const Sidebar = ({
  role,
  activePage,
  onNavigate,
  mobile = false,
}: {
  role: Role;
  activePage: string;
  onNavigate: NavigateHandler;
  mobile?: boolean;
}) => {
  const items = menuItems[role];

  return (
    <aside
      className={cn(
        'z-10 flex shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white',
        mobile ? 'h-full w-72 shadow-2xl shadow-black/20' : 'sticky top-16 hidden h-[calc(100vh-4rem)] w-64 lg:flex',
      )}
    >
      <div className="p-6">
        <WorkYaarLogo
          className="mb-8 justify-center rounded-2xl bg-white px-3 py-3 shadow-xl shadow-orange-100"
          imageClassName="h-11 w-11 rounded-xl bg-white"
          textClassName="text-xl text-[#111827]"
        />

        <div className="space-y-1">
          <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Menu</p>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;

            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onNavigate(item.page)}
                className={cn(
                  'group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all',
                  isActive ? 'bg-[#F56618] text-white shadow-lg shadow-[#F56618]/20' : 'text-gray-500 hover:bg-gray-50',
                  item.premium && !isActive && 'border border-yellow-100 bg-yellow-50 text-yellow-700',
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon size={20} className={cn(isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#F56618]')} />
                  <span className="text-sm font-bold">{item.label}</span>
                </span>
                {item.badge && <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">{item.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-1 p-6">
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">General</p>
        <SidebarUtilityButton icon={Settings} label="Settings" active={activePage === 'Settings'} onClick={() => onNavigate('Settings')} />
        <SidebarUtilityButton icon={HelpCircle} label="Help" active={activePage === 'Help'} onClick={() => onNavigate('Help')} />
        <Link onClick={clearAuthUser} to="/login" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-gray-500 hover:bg-gray-50">
          <LogOut size={20} className="text-gray-400" />
          <span className="text-sm">Logout</span>
        </Link>
      </div>
    </aside>
  );
};

const SidebarUtilityButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold transition-colors',
      active ? 'bg-[#F56618] text-white' : 'text-gray-500 hover:bg-gray-50',
    )}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-gray-400'} />
    <span className="text-sm">{label}</span>
  </button>
);

const Header = ({
  role,
  title,
  subtitle,
  onNavigate,
  authUser,
}: {
  role: Role;
  title: string;
  subtitle: string;
  onNavigate: NavigateHandler;
  authUser: AuthUser | null;
}) => (
  <header className="flex flex-col gap-5 border-b border-gray-100 bg-white p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
    <div className="min-w-0">
      <h1 className="mb-1 text-3xl font-black text-gray-900">{title}</h1>
      <p className="text-sm font-medium text-gray-400">{subtitle}</p>
    </div>

    <div className="flex flex-wrap items-center gap-3 lg:gap-4">
      <div className="mr-2 flex items-center gap-3 lg:mr-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-sm font-black text-[#F56618]">
          {getInitials(authUser?.name ?? role)}
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-400">Welcome</span>
          <span className="block text-sm font-black text-gray-900">{authUser?.name ?? role}</span>
        </div>
      </div>

      {role === 'admin' ? (
        <>
          <ActionButton icon={RefreshCw} label="Refresh" onClick={() => onNavigate('Dashboard')} primary />
          <ActionButton label="Manage Users" onClick={() => onNavigate('Users')} />
        </>
      ) : role === 'employer' ? (
        <>
          <ActionButton icon={Plus} label="Post Job" onClick={() => onNavigate('Post Job')} primary />
          <ActionButton label="Manage Jobs" onClick={() => onNavigate('Manage Jobs')} />
        </>
      ) : (
        <>
          <ActionButton icon={Search} label="Find Jobs" onClick={() => onNavigate('Jobs')} primary />
          <ActionButton label="Edit Profile" onClick={() => onNavigate('Profile')} />
        </>
      )}
      <button
        type="button"
        onClick={() => onNavigate('Notifications')}
        className="rounded-full bg-gray-50 p-2.5 text-gray-400 transition-colors hover:text-gray-900"
        aria-label="Open notifications"
      >
        <Bell size={20} />
      </button>
    </div>
  </header>
);

const ActionButton = ({ icon: Icon, label, onClick, primary = false }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5',
      primary ? 'bg-[#F56618] text-white shadow-lg shadow-[#F56618]/20' : 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
    )}
  >
    {Icon && <Icon size={18} />}
    {label}
  </button>
);

const StatCard = ({ label, value, trend, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex h-48 flex-col justify-between rounded-[32px] border p-8 text-left transition-all hover:-translate-y-1',
      active ? 'border-transparent bg-[#F56618] text-white shadow-2xl shadow-[#F56618]/30' : 'border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-200/60',
    )}
  >
    <div className="flex items-start justify-between">
      <span className={cn('text-lg font-bold', active ? 'text-white/90' : 'text-gray-500')}>{label}</span>
      <span className={cn('rounded-full p-1.5', active ? 'bg-white/20' : 'bg-gray-50')}>
        <ArrowRight size={16} className={active ? 'text-white' : 'text-gray-400'} />
      </span>
    </div>
    <div>
      <div className="mb-2 text-5xl font-black">{value}</div>
      <div className="flex items-center gap-1">
        <Plus size={14} className={active ? 'text-white' : 'text-[#F56618]'} />
        <span className={cn('text-xs font-bold', active ? 'text-white/80' : 'text-gray-400')}>{trend}</span>
      </div>
    </div>
  </button>
);

export const AdminDashboard = () => <DashboardShell role="admin" renderDashboard={(navigate) => <AdminHome onNavigate={navigate} />} />;

export const CandidateDashboard = () => <DashboardShell role="candidate" renderDashboard={(navigate) => <CandidateHome onNavigate={navigate} />} />;

export const EmployerDashboard = () => <DashboardShell role="employer" renderDashboard={(navigate) => <EmployerHome onNavigate={navigate} />} />;

const AdminHome = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0, companies: 0 });

  useEffect(() => {
    fetch('/api/v1/admin/stats')
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.stats))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard label="Users" value={String(stats.users)} trend="Open user controls" active onClick={() => onNavigate('Users')} />
        <StatCard label="Jobs" value={String(stats.jobs)} trend="Review posted roles" onClick={() => onNavigate('Jobs')} />
        <StatCard label="Applications" value={String(stats.applications)} trend="View platform activity" onClick={() => onNavigate('Users')} />
        <StatCard label="Companies" value={String(stats.companies)} trend="Manage employers" onClick={() => onNavigate('Companies')} />
      </div>
      <Panel title="Platform Analytics">
        <div className="relative h-64 border-b border-l border-gray-100">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="absolute w-full border-t border-gray-50" style={{ top: `${i * 20}%` }} />
          ))}
        </div>
      </Panel>
    </>
  );
};

const CandidateHome = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [stats, setStats] = useState({ applications: 0, savedJobs: 0, interviews: 0 });
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('workyaar.auth.token');
    fetch('/api/v1/candidate/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.stats))
      .catch(() => {});

    fetch('/api/v1/profile/completion')
      .then((r) => r.json())
      .then((d) => d.success && setCompletionPercent(d.completionPercent))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard label="Applications" value={String(stats.applications)} trend="Open applications" active onClick={() => onNavigate('Applications')} />
        <StatCard label="Saved Jobs" value={String(stats.savedJobs)} trend="Open saved jobs" onClick={() => onNavigate('Saved Jobs')} />
        <StatCard label="Profile Views" value="0" trend="Update profile" onClick={() => onNavigate('Profile')} />
        <StatCard label="Interviews" value={String(stats.interviews)} trend="Open interviews" onClick={() => onNavigate('Interviews')} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel title="Application Activity">
            <EmptyState
              title="No activity yet"
              text="Your application chart will update after you start applying to jobs."
              actionLabel="Find Jobs"
              onAction={() => onNavigate('Jobs')}
            />
          </Panel>

          <Panel title="Recent Applications" action={<MiniButton label="View all" onClick={() => onNavigate('Applications')} />}>
            <EmptyState
              title="No applications yet"
              text="Applications will appear here after you apply for a role."
              actionLabel="Browse Jobs"
              onAction={() => onNavigate('Jobs')}
            />
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel title="Upcoming Interview">
            <EmptyState
              title="No interviews scheduled"
              text="Interview invitations will appear here when recruiters respond."
              actionLabel="Open Interviews"
              onAction={() => onNavigate('Interviews')}
            />
          </Panel>

          <button type="button" onClick={() => onNavigate('Profile')} className="w-full text-left">
            <Panel title="Profile Completion">
              <ProgressGauge label="Completed" percent={completionPercent} />
            </Panel>
          </button>
        </div>
      </div>
    </>
  );
};

const EmployerHome = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [stats, setStats] = useState({ totalJobs: 0, applications: 0, shortlisted: 0, interviews: 0 });

  useEffect(() => {
    const token = localStorage.getItem('workyaar.auth.token');
    fetch('/api/v1/employer/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.stats))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard label="Total Jobs" value={String(stats.totalJobs)} trend="Manage jobs" active onClick={() => onNavigate('Manage Jobs')} />
        <StatCard label="Applications" value={String(stats.applications)} trend="Review candidates" onClick={() => onNavigate('Applications')} />
        <StatCard label="Shortlisted" value={String(stats.shortlisted)} trend="Open shortlist" onClick={() => onNavigate('Applications')} />
        <StatCard label="Interviews" value={String(stats.interviews)} trend="Schedule interviews" onClick={() => onNavigate('Interviews')} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel title="Project Analytics">
            <EmptyState
              title="No job analytics yet"
              text="Analytics will appear after you post a job and candidates start applying."
              actionLabel="Post Job"
              onAction={() => onNavigate('Post Job')}
            />
          </Panel>

          <Panel title="Team Collaboration" action={<MiniButton label="Add Member" icon={Plus} onClick={() => onNavigate('Company Profile')} />}>
            <EmptyState
              title="No team members yet"
              text="Team activity will update after you add hiring members."
              actionLabel="Company Profile"
              onAction={() => onNavigate('Company Profile')}
            />
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel title="Project" action={<MiniButton label="New" icon={Plus} onClick={() => onNavigate('Post Job')} />}>
            <EmptyState
              title="No projects yet"
              text="Posted jobs and hiring projects will show here."
              actionLabel="Post Job"
              onAction={() => onNavigate('Post Job')}
            />
          </Panel>

          <button type="button" onClick={() => onNavigate('Manage Jobs')} className="w-full text-left">
            <Panel title="Project Progress">
              <ProgressGauge label="Project Progress" percent={0} />
            </Panel>
          </button>
        </div>
      </div>
    </>
  );
};

const TopicPanel = ({ role, page, onNavigate }: { role: Role; page: string; onNavigate: NavigateHandler }) => {
  if (page === 'Notifications') return <NotificationCenter role={role} onNavigate={onNavigate} />;

  if (role === 'candidate') {
    if (page === 'Profile') return <CandidateProfilePage onNavigate={onNavigate} />;
    if (page === 'Jobs') return <CandidateJobsPage onNavigate={onNavigate} />;
    if (page === 'Applications') return <CandidateApplicationsPage onNavigate={onNavigate} />;
    if (page === 'Saved Jobs') return <CandidateSavedJobsPage onNavigate={onNavigate} />;
    if (page === 'Discover') return <CandidateDiscoverPage onNavigate={onNavigate} />;
    if (page === 'On-Demand Gigs') return <CandidateGigsPage onNavigate={onNavigate} />;
    if (page === 'Messages') return <MessagesInbox role="candidate" onNavigate={onNavigate} />;
    if (page === 'Interviews') return <CandidateInterviewsPage onNavigate={onNavigate} />;
    if (page === 'WorkYaar Pro') return <WorkYaarProPage />;
  }

  if (role === 'employer') {
    if (page === 'Company Profile') return <CompanyProfilePage onNavigate={onNavigate} />;
    if (page === 'Post Job') return <PostJobPage onNavigate={onNavigate} />;
    if (page === 'Manage Jobs') return <ManageJobsPage onNavigate={onNavigate} />;
    if (page === 'Applications') return <EmployerApplicationsPage onNavigate={onNavigate} />;
    if (page === 'Messages') return <MessagesInbox role="employer" onNavigate={onNavigate} />;
    if (page === 'Interviews') return <EmployerInterviewsPage onNavigate={onNavigate} />;
  }

  if (role === 'admin') {
    if (page === 'Users') return <AdminUsersPage onNavigate={onNavigate} />;
    if (page === 'Jobs') return <AdminJobsPage onNavigate={onNavigate} />;
    if (page === 'Companies') return <AdminCompaniesPage onNavigate={onNavigate} />;
  }

  const topic = getTopicCards(role, page);

  return (
    <div className="space-y-8">
      <Panel title={page} action={<MiniButton label="Back to Dashboard" onClick={() => onNavigate('Dashboard')} />}>
        <p className="mb-8 max-w-3xl text-gray-500">{topic.description}</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {topic.cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => onNavigate(card.to)}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-6 text-left transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-gray-200/70"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F56618] text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-black text-gray-950">{card.title}</h3>
                <p className="mb-5 text-sm leading-6 text-gray-500">{card.text}</p>
                <span className="inline-flex items-center gap-2 text-sm font-black text-[#F56618]">
                  Open {card.to} <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

const NotificationCenter = ({ role, onNavigate }: { role: Role; onNavigate: NavigateHandler }) => {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Unread', 'Jobs', 'Interviews'];
  const isEmployer = role === 'employer';
  const notificationCards = isEmployer
    ? [
        {
          icon: Send,
          title: 'Applications',
          text: 'New applicant alerts will appear here as candidates apply.',
          to: 'Applications',
        },
        {
          icon: Briefcase,
          title: 'Job Updates',
          text: 'Job approvals, edits, and listing performance updates will show here.',
          to: 'Manage Jobs',
        },
        {
          icon: Calendar,
          title: 'Interviews',
          text: 'Interview reminders and schedule changes will be collected here.',
          to: 'Interviews',
        },
      ]
    : [
        {
          icon: Briefcase,
          title: 'Job Matches',
          text: 'Fresh job matches and recommendations will appear here.',
          to: 'Jobs',
        },
        {
          icon: Send,
          title: 'Applications',
          text: 'Application status changes will be shown here.',
          to: 'Applications',
        },
        {
          icon: MessageSquare,
          title: 'Messages',
          text: 'Recruiter messages and replies will be collected here.',
          to: 'Messages',
        },
      ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-orange-100 bg-gradient-to-br from-[#FFF7F0] via-white to-[#FFE9D9] p-8 shadow-2xl shadow-orange-100/60">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F56618]/10" />
        <div className="absolute -bottom-28 left-16 h-56 w-56 rounded-full bg-yellow-200/30" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#F56618] shadow-lg shadow-orange-100/60">
              <Bell size={16} /> Notification Center
            </div>
            <h2 className="text-3xl font-black text-gray-950">All caught up for now</h2>
            <p className="mt-3 max-w-2xl text-gray-500">
              Your important {isEmployer ? 'hiring' : 'career'} updates will appear here in one clean place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(isEmployer ? 'Applications' : 'Jobs')}
            className="rounded-2xl bg-[#F56618] px-6 py-4 font-black text-white shadow-xl shadow-orange-200 transition-transform hover:-translate-y-0.5"
          >
            {isEmployer ? 'Review Applications' : 'Find Jobs'}
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-gray-100 bg-white p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-black transition-colors',
                filter === item ? 'bg-[#F56618] text-white shadow-lg shadow-orange-100' : 'bg-orange-50 text-[#F56618] hover:bg-orange-100',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {notificationCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => onNavigate(card.to)}
                className="group rounded-3xl border border-orange-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/70"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F56618] transition-colors group-hover:bg-[#F56618] group-hover:text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-black text-gray-950">{card.title}</h3>
                <p className="mb-5 text-sm leading-6 text-gray-500">{card.text}</p>
                <span className="inline-flex items-center gap-2 text-sm font-black text-[#F56618]">
                  Open {card.to} <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-[#F56618]" size={30} />
          <h3 className="text-xl font-black text-gray-950">No new {filter.toLowerCase()} notifications</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
            We will notify you here when there are updates that need your attention.
          </p>
        </div>
      </section>
    </div>
  );
};

const getTopicCards = (role: Role, page: string) => {
  const description = topicDescriptions[role][page] ?? 'Choose an action below to continue.';
  const shared: Record<string, TopicCard[]> = {
    Settings: [
      { icon: Bell, title: 'Notifications', text: 'Manage email and app alerts.', to: 'Dashboard' },
      { icon: Settings, title: 'Security', text: 'Review login and privacy settings.', to: 'Help' },
      { icon: Save, title: 'Save Changes', text: 'Return once settings are updated.', to: 'Dashboard' },
    ],
    Help: [
      { icon: HelpCircle, title: 'Support Center', text: 'Browse answers and platform guides.', to: 'Dashboard' },
      { icon: MessageSquare, title: 'Contact Support', text: 'Start a support conversation.', to: role === 'candidate' ? 'Messages' : 'Applications' },
      { icon: ClipboardList, title: 'Documentation', text: 'Read detailed help articles.', to: 'Dashboard' },
    ],
  };

  const roleCards: Record<Role, Record<string, TopicCard[]>> = {
    candidate: {
      Profile: [
        { icon: User, title: 'Personal Details', text: 'Add your name, location, and contact information.', to: 'Profile' },
        { icon: ClipboardList, title: 'Resume and Skills', text: 'Highlight experience, tools, and career goals.', to: 'Jobs' },
        { icon: CheckCircle2, title: 'Profile Completion', text: 'Improve matching by completing all sections.', to: 'Applications' },
      ],
      Jobs: [
        { icon: Search, title: 'Search Jobs', text: 'Find remote, flexible, full-time, and contract roles.', to: 'Jobs' },
        { icon: Bookmark, title: 'Save Jobs', text: 'Shortlist opportunities before applying.', to: 'Saved Jobs' },
        { icon: Send, title: 'Apply Fast', text: 'Send your profile to verified employers.', to: 'Applications' },
      ],
      Applications: [
        { icon: ClipboardList, title: 'Application Tracker', text: 'See submitted, reviewed, and shortlisted roles.', to: 'Applications' },
        { icon: Calendar, title: 'Next Interview', text: 'Prepare for the next hiring conversation.', to: 'Interviews' },
        { icon: MessageSquare, title: 'Recruiter Messages', text: 'Follow up with companies directly.', to: 'Messages' },
      ],
      'Saved Jobs': [
        { icon: Bookmark, title: 'Saved Roles', text: 'Return to roles you bookmarked earlier.', to: 'Jobs' },
        { icon: Search, title: 'Similar Jobs', text: 'Find more opportunities like your saved roles.', to: 'Discover' },
        { icon: Send, title: 'Apply Now', text: 'Move a saved job into your applications.', to: 'Applications' },
      ],
      Discover: [
        { icon: Compass, title: 'Recommended Paths', text: 'Explore job paths and skill tracks.', to: 'Jobs' },
        { icon: Building2, title: 'Companies', text: 'Discover verified employers hiring now.', to: 'Jobs' },
        { icon: Zap, title: 'Fast Gigs', text: 'Find flexible earning options.', to: 'On-Demand Gigs' },
      ],
      'On-Demand Gigs': [
        { icon: Zap, title: 'Quick Projects', text: 'Short projects matched to your skill set.', to: 'Applications' },
        { icon: Briefcase, title: 'Contract Work', text: 'Browse contract and freelance listings.', to: 'Jobs' },
        { icon: MessageSquare, title: 'Gig Messages', text: 'Talk to clients and recruiters.', to: 'Messages' },
      ],
      Messages: [
        { icon: MessageSquare, title: 'Recruiter Inbox', text: 'Open candidate conversations.', to: 'Messages' },
        { icon: Calendar, title: 'Interview Updates', text: 'Check schedule changes and reminders.', to: 'Interviews' },
        { icon: Briefcase, title: 'Job Follow Ups', text: 'Follow up on active roles.', to: 'Applications' },
      ],
      Interviews: [
        { icon: Video, title: 'Join Interview', text: 'Open your upcoming interview room.', to: 'Interviews' },
        { icon: ClipboardList, title: 'Preparation Notes', text: 'Review role and company information.', to: 'Applications' },
        { icon: MessageSquare, title: 'Message Recruiter', text: 'Ask questions before the interview.', to: 'Messages' },
      ],
      'WorkYaar Pro': [
        { icon: Crown, title: 'Priority Matching', text: 'Get boosted recommendations.', to: 'Jobs' },
        { icon: ClipboardList, title: 'Resume Review', text: 'Improve your profile quality.', to: 'Profile' },
        { icon: CheckCircle2, title: 'Upgrade Benefits', text: 'See how Pro improves your search.', to: 'Dashboard' },
      ],
    },
    employer: {
      'Company Profile': [
        { icon: Building2, title: 'Company Details', text: 'Update logo, story, benefits, and culture.', to: 'Company Profile' },
        { icon: User, title: 'Hiring Team', text: 'Add team members and permissions.', to: 'Applications' },
        { icon: Briefcase, title: 'Open Roles', text: 'Connect profile updates to active jobs.', to: 'Manage Jobs' },
      ],
      'Post Job': [
        { icon: Plus, title: 'Create Job', text: 'Add role details and screening questions.', to: 'Post Job' },
        { icon: CheckCircle2, title: 'Verify Listing', text: 'Keep roles trusted for candidates.', to: 'Manage Jobs' },
        { icon: Send, title: 'Publish Role', text: 'Send the role live to candidates.', to: 'Manage Jobs' },
      ],
      'Manage Jobs': [
        { icon: Briefcase, title: 'Active Jobs', text: 'Edit, pause, or boost open listings.', to: 'Manage Jobs' },
        { icon: ClipboardList, title: 'Job Performance', text: 'Review views, saves, and applications.', to: 'Applications' },
        { icon: Plus, title: 'Post Another', text: 'Create a new opportunity.', to: 'Post Job' },
      ],
      Applications: [
        { icon: User, title: 'Candidate Review', text: 'Review resumes and skill matches.', to: 'Applications' },
        { icon: CheckCircle2, title: 'Shortlist', text: 'Move top profiles forward.', to: 'Interviews' },
        { icon: MessageSquare, title: 'Message Candidate', text: 'Contact applicants quickly.', to: 'Applications' },
      ],
      Interviews: [
        { icon: Calendar, title: 'Schedule', text: 'Book candidate meetings.', to: 'Interviews' },
        { icon: Video, title: 'Start Meeting', text: 'Open the interview room.', to: 'Interviews' },
        { icon: ClipboardList, title: 'Interview Notes', text: 'Capture hiring feedback.', to: 'Applications' },
      ],
    },
    admin: {
      Users: [
        { icon: User, title: 'User Directory', text: 'Review candidates, employers, and admins.', to: 'Users' },
        { icon: CheckCircle2, title: 'Verification', text: 'Approve trusted platform accounts.', to: 'Companies' },
        { icon: MessageSquare, title: 'Support', text: 'Handle user requests.', to: 'Help' },
      ],
      Jobs: [
        { icon: Briefcase, title: 'Job Moderation', text: 'Review and approve job listings.', to: 'Jobs' },
        { icon: CheckCircle2, title: 'Verified Jobs', text: 'Keep trusted roles visible.', to: 'Companies' },
        { icon: Search, title: 'Search Listings', text: 'Find and audit platform jobs.', to: 'Jobs' },
      ],
      Companies: [
        { icon: Building2, title: 'Employer Accounts', text: 'Review company details and status.', to: 'Companies' },
        { icon: ClipboardList, title: 'Company Jobs', text: 'Audit roles from each employer.', to: 'Jobs' },
        { icon: CheckCircle2, title: 'Approval Queue', text: 'Verify new companies.', to: 'Users' },
      ],
    },
  };

  return {
    description,
    cards: roleCards[role][page] ?? shared[page] ?? [
      { icon: LayoutDashboard, title: page, text: 'Open the related dashboard tools for this section.', to: 'Dashboard' },
      { icon: HelpCircle, title: 'Need Help?', text: 'Get support for this area.', to: 'Help' },
      { icon: Settings, title: 'Settings', text: 'Adjust preferences for this section.', to: 'Settings' },
    ],
  };
};

const Panel = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <section className="rounded-[40px] border border-gray-100 bg-white p-8">
    <div className="mb-8 flex items-center justify-between gap-4">
      <h3 className="text-xl font-black">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const ProgressGauge = ({ label, percent = 0 }: { label: string; percent?: number }) => (
  <>
    <div className="relative mx-auto h-24 w-48 overflow-hidden">
      <div className="absolute left-0 top-0 h-48 w-48 rounded-full border-[16px] border-gray-100" />
      <div className="absolute left-0 top-0 h-48 w-48 rounded-full border-[16px] border-[#F56618]" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${percent}%, 0 ${percent}%)` }} />
      <div className="absolute bottom-0 left-0 w-full text-center">
        <span className="text-3xl font-black">{percent}%</span>
        <p className="text-[10px] font-bold text-gray-400">{label}</p>
      </div>
    </div>
    <div className="mt-8 flex justify-center gap-4">
      <LegendItem color="bg-[#F56618]" label="Done" />
      <LegendItem color="bg-orange-200" label="In Progress" />
      <LegendItem color="bg-gray-100" label="Remaining" />
    </div>
  </>
);

const MiniButton = ({ label, onClick, icon: Icon }: any) => (
  <button type="button" onClick={onClick} className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100">
    {Icon && <Icon size={14} />}
    {label}
  </button>
);

const EmptyState = ({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel?: string; onAction?: () => void }) => (
  <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 p-8 text-center">
    <h4 className="mb-2 text-lg font-black text-gray-900">{title}</h4>
    <p className="mx-auto max-w-xl text-sm leading-6 text-gray-500">{text}</p>
    {actionLabel && onAction && (
      <button type="button" onClick={onAction} className="mt-6 rounded-xl bg-[#F56618] px-5 py-3 text-sm font-black text-white">
        {actionLabel}
      </button>
    )}
  </div>
);

type LiveProfile = {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  resumeUrl: string;
  portfolioUrl: string;
  skills: string[];
  experience: Record<string, string>;
  education: any[];
};

const CandidateProfilePage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [tab, setTab] = useState('Profile Details');
  const [profile, setProfile] = useState<LiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Local form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  const tabs = ['Profile Details', 'Resume / CV', 'Social Profiles'];

  const refreshCompletion = (profileData?: LiveProfile | null) => {
    if (profileData?.completionPercent !== undefined) {
      setCompletionPercent(profileData.completionPercent);
      return;
    }
    fetch('/api/v1/profile/completion')
      .then((r) => r.json())
      .then((d) => d.success && setCompletionPercent(d.completionPercent))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/v1/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then((data) => {
        const p = data.profile;
        setProfile(p);
        setName(p.name || '');
        setBio(p.bio || '');
        setSkillsInput(Array.isArray(p.skills) ? p.skills.join(', ') : '');
        setResumeUrl(p.resumeUrl || '');
        setPortfolioUrl(p.portfolioUrl || '');
        setCompletionPercent(p.completionPercent || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/v1/profile/resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setResumeUrl(data.resumeUrl);
      setProfile(data.profile);
      refreshCompletion(data.profile);
    } catch (err: any) {
      alert(err.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const fetchSkillSuggestions = (query: string) => {
    const lastToken = query.split(',').pop()?.trim() || '';
    if (lastToken.length < 1) {
      setSkillSuggestions([]);
      return;
    }
    fetch(`/api/v1/skills/suggest?q=${encodeURIComponent(lastToken)}`)
      .then((r) => r.json())
      .then((d) => setSkillSuggestions(d.suggestions || []))
      .catch(() => setSkillSuggestions([]));
  };

  const addSuggestedSkill = (skill: string) => {
    const parts = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) parts.pop();
    parts.push(skill);
    setSkillsInput(parts.join(', ') + ', ');
    setSkillSuggestions([]);
  };

  const handleSave = () => {
    setSaving(true);
    setSaveStatus('idle');

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    fetch('/api/v1/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        bio,
        resumeUrl: resumeUrl.startsWith('blob:') ? undefined : resumeUrl,
        portfolioUrl,
        skills: skillsArray,
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
          setCompletionPercent(data.profile.completionPercent || 0);
          setSaveStatus('success');
        } else {
          setSaveStatus('error');
        }
        setSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      })
      .catch(() => {
        setSaveStatus('error');
        setSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
        <p className="text-sm font-bold text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-5 border-b border-gray-200">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn('px-6 py-4 text-sm font-black transition-colors', tab === item ? 'rounded-t-xl bg-[#F56618] text-white' : 'text-gray-600 hover:text-[#F56618]')}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[32px] border border-gray-100 bg-white p-8">
          <h2 className="mb-7 text-2xl font-black">{tab}</h2>

          {tab === 'Profile Details' && (
            <div>
              <div className="mb-5 flex items-center gap-5">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#3B1976]">
                  {profile?.name ? (
                    <span className="text-3xl font-black">{profile.name.slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <User size={46} fill="currentColor" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-2 block text-lg font-black">Profile Photo</label>
                  <input type="file" className="w-full rounded-xl border border-dashed border-[#F56618] p-3 text-gray-500" />
                  <p className="mt-2 text-sm text-gray-500">JPG / PNG - Max 2MB</p>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  className="dashboard-input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="dashboard-input bg-gray-50 text-gray-400 cursor-not-allowed"
                  placeholder="Email"
                  value={profile?.email || ''}
                  readOnly
                />
                <textarea
                  className="dashboard-input min-h-28 resize-y"
                  placeholder="Professional Summary / Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          )}

          {tab === 'Resume / CV' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-bold text-gray-700">Resume / CV File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  disabled={uploadingResume}
                  className="w-full rounded-xl border border-dashed border-[#F56618] p-3 text-gray-500"
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    if (file) handleResumeUpload(file);
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {uploadingResume ? 'Uploading resume...' : 'PDF, DOC, DOCX up to 5MB — saved to your profile'}
                </p>
                {resumeUrl && !resumeUrl.startsWith('blob:') && (
                  <a
                    href={resolveResumeUrl(resumeUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#F56618] hover:underline"
                  >
                    View Uploaded Resume <ArrowRight size={14} />
                  </a>
                )}
              </div>
              <div>
                <label className="mb-2 block font-bold text-gray-700">Skills</label>
                <input
                  className="dashboard-input"
                  placeholder="React, Node.js, TypeScript (comma-separated)"
                  value={skillsInput}
                  onChange={(e) => {
                    setSkillsInput(e.target.value);
                    fetchSkillSuggestions(e.target.value);
                  }}
                />
                {skillSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillSuggestions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSuggestedSkill(skill)}
                        className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-[#F56618] hover:bg-orange-50"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                )}
                {skillsInput && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skillsInput.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                      <span key={skill} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F56618]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'Social Profiles' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-bold text-gray-700">Portfolio / Website URL</label>
                <input
                  className="dashboard-input"
                  placeholder="https://yourportfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block font-bold text-gray-700">LinkedIn URL</label>
                <input className="dashboard-input" placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div>
                <label className="mb-2 block font-bold text-gray-700">GitHub URL</label>
                <input className="dashboard-input" placeholder="https://github.com/yourusername" />
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#F56618] px-6 py-3 font-black text-white disabled:opacity-60 transition-transform hover:-translate-y-0.5"
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('Jobs')}
              className="rounded-xl border border-gray-200 px-6 py-3 font-black text-gray-700"
            >
              Find Jobs
            </button>
            {saveStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                <CheckCircle2 size={16} /> Saved successfully!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm font-bold text-red-500">Save failed. Try again.</span>
            )}
          </div>
        </section>

        <section className="h-fit rounded-[32px] border border-gray-100 bg-white p-8">
          <h2 className="mb-5 text-2xl font-black">Preview</h2>
          <ProgressGauge label="Profile Complete" percent={completionPercent} />
          <div className="mt-6 flex h-28 w-28 items-center justify-center rounded-full bg-orange-50 text-[#3B1976]">
            {name ? (
              <span className="text-3xl font-black">{name.slice(0, 2).toUpperCase()}</span>
            ) : (
              <User size={46} fill="currentColor" />
            )}
          </div>
          <h3 className="mt-5 text-xl font-black">{name || 'Your Name'}</h3>
          <p className="mt-2 text-sm text-gray-400">{profile?.email || 'your@email.com'}</p>
          {bio && <p className="mt-3 text-sm leading-6 text-gray-600">{bio}</p>}
          {skillsInput && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skillsInput.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                <span key={skill} className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-[#F56618]">
                  {skill}
                </span>
              ))}
            </div>
          )}
          {resumeUrl && !resumeUrl.startsWith('blob:') && (
            <a
              href={resolveResumeUrl(resumeUrl)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#F56618] px-4 py-2 text-xs font-black text-white"
            >
              View Resume <ArrowRight size={12} />
            </a>
          )}
        </section>
      </div>
    </div>
  );
};

const AvatarPreview = () => (
  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#3B1976]">
    <User size={46} fill="currentColor" />
  </div>
);

type LiveJob = {
  id: number;
  title: string;
  locationType: string;
  jobType: string;
  location: string;
  salaryRange: string;
  company: { name: string; logo: string };
};

const CandidateJobsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [jobMatches, setJobMatches] = useState<Record<number, { matchPercent: number; isTopMatch: boolean }>>({});
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileResumeUrl, setProfileResumeUrl] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/jobs').then((res) => {
        if (!res.ok) throw new Error('Failed to load jobs');
        return res.json();
      }),
      fetch('/api/v1/applications/mine').then((res) => {
        if (!res.ok) throw new Error('Failed to load applications');
        return res.json();
      }),
      fetch('/api/v1/saved-jobs/ids').then((res) => {
        if (!res.ok) throw new Error('Failed to load saved jobs');
        return res.json();
      }),
      fetch('/api/v1/candidate/job-matches').then((res) => res.ok ? res.json() : { matches: [] }),
      fetch('/api/v1/profile').then((res) => res.ok ? res.json() : { profile: {} }),
    ])
      .then(([jobsData, appsData, savedData, matchesData, profileData]) => {
        setJobs(jobsData.jobs || []);
        const appIds = new Set<number>((appsData.applications || []).map((app: any) => app.jobId));
        setAppliedJobIds(appIds);
        const svdIds = new Set<number>((savedData.savedJobIds || []).map(Number));
        setSavedJobIds(svdIds);
        const matchMap: Record<number, { matchPercent: number; isTopMatch: boolean }> = {};
        (matchesData.matches || []).forEach((m: any) => {
          matchMap[m.jobId] = { matchPercent: m.matchPercent, isTopMatch: m.isTopMatch };
        });
        setJobMatches(matchMap);
        setProfileResumeUrl(profileData.profile?.resumeUrl || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const [applyingToJobId, setApplyingToJobId] = useState<number | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

  const confirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingToJobId) return;

    let finalResumeUrl = profileResumeUrl;

    try {
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        const uploadRes = await fetch('/api/v1/profile/resume', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          finalResumeUrl = uploadData.resumeUrl;
          setProfileResumeUrl(finalResumeUrl);
        }
      }

      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: applyingToJobId, resumeUrl: finalResumeUrl || undefined, coverLetter })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedJobIds((prev) => { const next = new Set(prev); next.add(applyingToJobId); return next; });
        setApplyingToJobId(null);
        setResumeUrl('');
        setResumeFile(null);
        setCoverLetter('');
      } else {
        alert(data.message || 'Application failed');
      }
    } catch (err) {
      console.error('Error applying:', err);
      alert('Failed to submit application');
    }
  };

  const handleSaveToggle = (jobId: number, isSaved: boolean) => {
    if (isSaved) {
      fetch(`/api/v1/saved-jobs/${jobId}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSavedJobIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
          }
        })
        .catch((err) => console.error('Error unsaving:', err));
    } else {
      fetch('/api/v1/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSavedJobIds((prev) => { const next = new Set(prev); next.add(jobId); return next; });
          }
        })
        .catch((err) => console.error('Error saving:', err));
    }
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading jobs from database...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[32px] border border-red-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-lg font-black text-red-500">Failed to load jobs</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 rounded-xl bg-[#F56618] px-6 py-3 text-sm font-black text-white">Retry</button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Jobs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {jobs.length} verified {jobs.length === 1 ? 'job' : 'jobs'} — sorted by AI match to your profile skills.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('Saved Jobs')} className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-black text-gray-700">
            <Bookmark size={16} /> Saved Jobs {savedJobIds.size > 0 && <span className="rounded-full bg-[#F56618] px-1.5 py-0.5 text-[10px] font-black text-white">{savedJobIds.size}</span>}
          </button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Refresh</button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Briefcase className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No jobs available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...jobs]
            .sort((a, b) => (jobMatches[b.id]?.matchPercent || 0) - (jobMatches[a.id]?.matchPercent || 0))
            .map((job) => {
            const isSaved = savedJobIds.has(job.id);
            const isApplied = appliedJobIds.has(job.id);
            const match = jobMatches[job.id];
            return (
              <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-xs font-black text-[#F56618]">
                    {job.company.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.company.name}</p>
                    {match && (
                      <p className="mt-1 text-xs font-bold text-purple-700">
                        {match.matchPercent}% profile match {match.isTopMatch ? '· Top match' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 capitalize">{job.locationType}</span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F56618] capitalize">{job.jobType.replace('-', ' ')}</span>
                  <span className="text-xs text-gray-400">{job.location}</span>
                  <span className="text-xs font-bold text-gray-700">{job.salaryRange}</span>
                  <button
                    type="button"
                    onClick={() => handleSaveToggle(job.id, isSaved)}
                    title={isSaved ? 'Remove bookmark' : 'Save job'}
                    className={cn('flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition-all hover:-translate-y-0.5', isSaved ? 'border-[#F56618] bg-orange-50 text-[#F56618]' : 'border-gray-200 bg-white text-gray-500 hover:border-[#F56618] hover:text-[#F56618]')}
                  >
                    <Bookmark size={13} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  {isApplied ? (
                    <button type="button" disabled className="flex items-center gap-1.5 rounded-xl bg-gray-200 px-4 py-2 text-xs font-black text-gray-500 cursor-not-allowed">
                      <CheckCircle2 size={14} className="text-gray-500" /> Applied
                    </button>
                  ) : (
                    <button type="button" onClick={() => setApplyingToJobId(job.id)} className="rounded-xl bg-[#F56618] px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {applyingToJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Apply for Job</h3>
              <button type="button" onClick={() => setApplyingToJobId(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={confirmApply} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Upload Resume (PDF/Doc)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2.5 file:text-sm file:font-black file:text-[#F56618] hover:file:bg-orange-100"
                  onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                />
                <p className="mt-1.5 text-xs text-gray-400">If left blank, we will use the default resume saved on your profile.</p>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Cover Letter / Note to Employer</span>
                <textarea
                  className="dashboard-input min-h-32 resize-y"
                  placeholder="Why are you a good fit for this role?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                />
              </label>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 rounded-xl bg-[#F56618] py-4 font-black text-white transition-transform hover:-translate-y-0.5">
                  Submit Application
                </button>
                <button type="button" onClick={() => setApplyingToJobId(null)} className="flex-1 rounded-xl border border-gray-200 bg-white py-4 font-black text-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

type LiveApplication = {
  id: number;
  jobId: number;
  status: string;
  appliedAt: string;
  job: {
    title: string;
    jobType: string;
    locationType: string;
    location: string;
    company: { name: string; logo: string };
  };
};

const CandidateApplicationsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [tab, setTab] = useState('All');
  const [applications, setApplications] = useState<LiveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<Record<number, any>>({});
  const [scoringAppId, setScoringAppId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/v1/applications/mine')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load applications');
        return res.json();
      })
      .then((data) => {
        setApplications(data.applications || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAtsScore = async (appId: number, jobId: number) => {
    if (aiScores[appId]) return;
    setScoringAppId(appId);
    try {
      const token = localStorage.getItem('workyaar.auth.token');
      const res = await fetch('/api/v1/ai/ats-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: appId, jobId: jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to score');
      
      setAiScores(prev => ({ ...prev, [appId]: data.ats }));
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      setScoringAppId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    if (tab === 'All') return applications;
    return applications.filter((app) => app.status.toLowerCase() === tab.toLowerCase());
  }, [applications, tab]);

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading your applications...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[32px] border border-red-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-lg font-black text-red-500">Failed to load applications</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 rounded-xl bg-[#F56618] px-6 py-3 text-sm font-black text-white">Retry</button>
        </div>
      </section>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-green-50 text-green-700';
      case 'rejected': return 'bg-red-50 text-red-700';
      case 'interviewing': return 'bg-blue-50 text-blue-700';
      case 'applied':
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Applications</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Track submitted applications, interview requests, and recruiter responses.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('Jobs')} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Find Jobs</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {['All', 'Applied', 'Shortlisted', 'Interviewing', 'Rejected'].map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={cn('rounded-xl px-7 py-3 font-black transition-colors', tab === item ? 'bg-[#F56618] text-white shadow-lg shadow-orange-100' : 'bg-orange-50 text-[#F56618]')}>
            {item}
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No {tab === 'All' ? '' : tab.toLowerCase()} applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div key={app.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-xs font-black text-[#F56618]">
                    {app.job.company.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900">{app.job.title}</p>
                    <p className="text-sm text-gray-500">{app.job.company.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 capitalize">{app.job.locationType}</span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F56618] capitalize">{app.job.jobType.replace('-', ' ')}</span>
                  <span className="text-xs text-gray-400">{app.job.location}</span>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', getStatusStyle(app.status))}>{app.status}</span>
                  <span className="text-xs text-gray-400">Applied: {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <button 
                    type="button" 
                    onClick={() => handleAtsScore(app.id, app.jobId)} 
                    disabled={scoringAppId === app.id}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-black text-purple-700 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Sparkles size={13} fill="currentColor" /> {scoringAppId === app.id ? 'Scoring...' : 'My Match Score'}
                  </button>
                </div>
              </div>

              {aiScores[app.id] && (() => {
                const { strengths, weaknesses } = getAtsLists(aiScores[app.id]);
                return (
                <div className="mt-2 rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                    <h4 className="text-sm font-black text-purple-900 flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> AI ATS Insight</h4>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">Match Score: {aiScores[app.id].score}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{aiScores[app.id].summary}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Strengths</h5>
                      <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
                        {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Missing/Gaps</h5>
                      <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                        {weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

type SavedJob = {
  savedId: number;
  savedAt: string;
  job: {
    id: number;
    title: string;
    jobType: string;
    locationType: string;
    location: string;
    salaryRange: string;
    company: { name: string; logo: string };
  };
};

const CandidateSavedJobsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedJobs = () => {
    fetch('/api/v1/saved-jobs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load saved jobs');
        return res.json();
      })
      .then((data) => {
        setSavedJobs(data.savedJobs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { fetchSavedJobs(); }, []);

  const handleUnsave = (jobId: number) => {
    fetch(`/api/v1/saved-jobs/${jobId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => { if (data.success) fetchSavedJobs(); })
      .catch((err) => console.error('Error unsaving:', err));
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading saved jobs...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[32px] border border-red-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-lg font-black text-red-500">Failed to load saved jobs</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 rounded-xl bg-[#F56618] px-6 py-3 text-sm font-black text-white">Retry</button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Saved Jobs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {savedJobs.length > 0
              ? `${savedJobs.length} ${savedJobs.length === 1 ? 'job' : 'jobs'} bookmarked — apply before they close.`
              : 'Jobs you save will stay here until you apply or remove them.'}
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('Jobs')} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Browse Jobs</button>
      </div>

      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bookmark className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No saved jobs yet. Browse jobs and click Save to bookmark them.</p>
          <button type="button" onClick={() => onNavigate('Jobs')} className="mt-2 rounded-xl bg-[#F56618] px-6 py-3 text-sm font-black text-white">Find Jobs</button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map(({ savedId, savedAt, job }) => (
            <div key={savedId} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 text-xs font-black text-[#F56618]">
                  {job.company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.company.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">Saved on {new Date(savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 capitalize">{job.locationType}</span>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F56618] capitalize">{job.jobType.replace('-', ' ')}</span>
                <span className="text-xs text-gray-400">{job.location}</span>
                <span className="text-xs font-bold text-gray-700">{job.salaryRange}</span>
                <button
                  type="button"
                  onClick={() => handleUnsave(job.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 transition-all hover:border-red-300 hover:text-red-500 hover:-translate-y-0.5"
                >
                  <Bookmark size={13} fill="currentColor" /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('Jobs')}
                  className="rounded-xl bg-[#F56618] px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const CandidateDiscoverPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => (
  <CandidateListPage
    title="Discover"
    description="Recommended companies, career paths, and job collections will appear here."
    columns={["Recommendation", "Category", "Match", "Action"]}
    empty="No recommendations yet. Complete your profile to improve discovery."
    primaryLabel="Complete Profile"
    onPrimary={() => onNavigate('Profile')}
  />
);

const CandidateGigsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => (
  <CandidateListPage
    title="On-Demand Gigs"
    description="Flexible gigs and short projects will appear here when available."
    columns={["Gig", "Skill", "Budget", "Action"]}
    empty="No on-demand gigs available yet."
    primaryLabel="Explore Jobs"
    onPrimary={() => onNavigate('Jobs')}
  />
);

const CandidateMessagesPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => (
  <MessagesInbox role="candidate" onNavigate={onNavigate} />
);

type MessageThread = {
  applicationId: number;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string;
  jobTitle: string;
  candidateName: string;
  employerName: string;
};

type ChatMessage = {
  id: number;
  senderId: number;
  body: string;
  createdAt: string;
  senderName: string;
  senderRole: string;
};

const MessagesInbox = ({ role, onNavigate }: { role: 'candidate' | 'employer'; onNavigate: NavigateHandler }) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeAppId, setActiveAppId] = useState<number | null>(sharedMessageApplicationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const user = getAuthUser();

  const loadInbox = () => {
    fetch('/api/v1/messages/inbox')
      .then((r) => r.json())
      .then((d) => {
        setThreads(d.threads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadThread = (appId: number) => {
    setActiveAppId(appId);
    sharedMessageApplicationId = appId;
    fetch(`/api/v1/messages/thread/${appId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMessages(d.messages || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadInbox();
    if (sharedMessageApplicationId) loadThread(sharedMessageApplicationId);
  }, []);

  useEffect(() => {
    if (!activeAppId) return;
    const interval = setInterval(() => loadThread(activeAppId), 5000);
    return () => clearInterval(interval);
  }, [activeAppId]);

  const handleSend = async () => {
    if (!activeAppId || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: activeAppId, body: newMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewMessage('');
        loadThread(activeAppId);
        loadInbox();
      } else {
        alert(data.message || 'Failed to send');
      }
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find((t) => t.applicationId === activeAppId);

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Messages</h2>
          <p className="mt-1 text-sm text-gray-500">
            {role === 'employer' ? 'Chat with candidates about their applications.' : 'Messages from employers about your applications.'}
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('Applications')} className="rounded-xl border border-gray-200 px-5 py-3 font-black text-gray-700">
          View Applications
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-3 max-h-[480px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading inbox...</p>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No conversations yet. Message a candidate from Applications.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.applicationId}
                type="button"
                onClick={() => loadThread(t.applicationId)}
                className={cn(
                  'w-full rounded-xl p-4 text-left transition-colors',
                  activeAppId === t.applicationId ? 'bg-white shadow-md border border-orange-100' : 'hover:bg-white'
                )}
              >
                <p className="text-sm font-black text-gray-900">
                  {role === 'employer' ? t.candidateName : t.employerName}
                  {t.unreadCount > 0 && <span className="ml-2 rounded-full bg-[#F56618] px-2 py-0.5 text-[10px] text-white">{t.unreadCount}</span>}
                </p>
                <p className="text-xs text-[#F56618]">{t.jobTitle}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-1">{t.lastMessage}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-[400px] flex-col rounded-2xl border border-gray-100 bg-gray-50">
          {!activeAppId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a conversation</div>
          ) : (
            <>
              <div className="border-b border-gray-100 bg-white px-5 py-4">
                <p className="font-black text-gray-900">
                  {role === 'employer' ? activeThread?.candidateName : activeThread?.employerName}
                </p>
                <p className="text-xs text-gray-500">Re: {activeThread?.jobTitle}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm', isMine ? 'bg-[#F56618] text-white' : 'bg-white border border-gray-100 text-gray-800')}>
                          <p className="text-[10px] font-bold opacity-70 mb-1">{m.senderName}</p>
                          <p>{m.body}</p>
                          <p className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2 border-t border-gray-100 bg-white p-4">
                <input
                  className="dashboard-input flex-1"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <button type="button" onClick={handleSend} disabled={sending || !newMessage.trim()} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white disabled:opacity-50">
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

type LiveInterview = {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: string;
  notes: string;
  job: {
    title: string;
    location: string;
    company: { name: string; logo: string };
  };
  recruiter: { name: string; avatar: string };
};

const CandidateInterviewsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [tab, setTab] = useState('All');
  const [interviews, setInterviews] = useState<LiveInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/interviews/mine')
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data.interviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredInterviews = useMemo(() => {
    if (tab === 'All') return interviews;
    if (tab === 'Upcoming') return interviews.filter((i) => i.status === 'scheduled' || i.status === 'rescheduled');
    return interviews.filter((i) => i.status.toLowerCase() === tab.toLowerCase());
  }, [interviews, tab]);

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'scheduled': return 'bg-blue-50 text-blue-700';
      case 'completed': return 'bg-green-50 text-green-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'rescheduled': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading interviews...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Interviews</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Interview schedules and meeting links.</p>
        </div>
        <button type="button" onClick={() => onNavigate('Jobs')} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Find Jobs</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={cn('rounded-xl px-7 py-3 font-black transition-colors', tab === item ? 'bg-[#F56618] text-white' : 'bg-orange-50 text-[#F56618]')}>
            {item}
          </button>
        ))}
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Calendar className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No {tab === 'All' ? '' : tab.toLowerCase()} interviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((iv) => (
            <div key={iv.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3B1976] text-white text-xs font-black">
                  {iv.job.company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">{iv.job.title}</p>
                  <p className="text-sm text-gray-500">{iv.job.company.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">with {iv.recruiter.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-gray-700">
                  {new Date(iv.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(iv.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {iv.durationMinutes}min
                </span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', getStatusStyle(iv.status))}>{iv.status}</span>
                {iv.meetingLink && iv.status === 'scheduled' && (
                  <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-[#3B1976] px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                    <Video size={13} /> Join
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const CandidateListPage = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  columns,
  empty,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  description: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  columns: string[];
  empty: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) => (
  <section className="rounded-[32px] border border-gray-100 bg-white p-8">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
      <div>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
      </div>
      <div className="flex gap-3">
        {secondaryLabel && onSecondary && <button type="button" onClick={onSecondary} className="rounded-xl border border-gray-200 px-5 py-3 font-black text-gray-700">{secondaryLabel}</button>}
        <button type="button" onClick={onPrimary} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">{primaryLabel}</button>
      </div>
    </div>
    {tabs && activeTab && onTabChange && (
      <div className="mb-6 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => onTabChange(tab)} className={cn('rounded-xl px-7 py-3 font-black', activeTab === tab ? 'bg-[#F56618] text-white' : 'bg-orange-50 text-[#F56618]')}>
            {tab}
          </button>
        ))}
      </div>
    )}
    <DataTable columns={columns} empty={empty} />
  </section>
);

const WorkYaarProPage = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const refreshSubscription = () =>
    fetch('/api/v1/payments/subscription')
      .then((r) => r.json())
      .then((d) => d.success && setSubscription(d.subscription));

  const refreshHistory = () =>
    fetch('/api/v1/payments/history')
      .then((r) => r.json())
      .then((d) => d.success && setRecentPayments(d.payments || []));

  useEffect(() => {
    refreshSubscription();
    refreshHistory();
  }, []);

  const pollOrderStatus = async (orderId: string, token: string, attempts = 8) => {
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(`/api/v1/payments/status/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.status === 'paid') {
        await refreshSubscription();
        await refreshHistory();
        return true;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return false;
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoadingPlan(planType);
      setPaymentStep('creating');
      setPaymentMessage('Creating payment order...');

      const authUser = getAuthUser();
      const token = localStorage.getItem('workyaar.auth.token');
      if (!authUser || !token) throw new Error('Please log in again.');

      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planType === 'monthly' ? 'pro_monthly' : 'pro_yearly' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create order');

      const plan = planType === 'monthly' ? 'pro_monthly' : 'pro_yearly';
      const orderId = data.order.orderId;

      if (data.order?.mock) {
        setPaymentStep('verifying');
        setPaymentMessage('Verifying mock payment...');
        const verifyRes = await fetch('/api/v1/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            razorpayOrderId: orderId,
            razorpayPaymentId: 'mock_payment',
            razorpaySignature: 'mock_sig',
            plan,
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          setPaymentStep('success');
          setPaymentMessage(verifyData.message || 'Pro activated!');
          await pollOrderStatus(orderId, token);
        } else {
          setPaymentStep('failed');
          setPaymentMessage(verifyData.message || 'Verification failed');
        }
        setLoadingPlan(null);
        return;
      }

      setPaymentStep('checkout');
      setPaymentMessage('Opening Razorpay checkout...');
      const isScriptLoaded = await loadRazorpay();
      if (!isScriptLoaded) throw new Error('Failed to load Razorpay SDK');

      const options = {
        key: data.order.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'WorkYaar',
        description: `WorkYaar Pro ${planType} Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setPaymentStep('verifying');
            setPaymentMessage('Verifying payment with server...');
            const verifyRes = await fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                plan,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setPaymentStep('success');
              setPaymentMessage(verifyData.message || 'Payment successful!');
              await pollOrderStatus(response.razorpay_order_id, token);
            } else {
              setPaymentStep('failed');
              setPaymentMessage(verifyData.message || 'Verification failed');
            }
          } catch {
            setPaymentStep('failed');
            setPaymentMessage('Error verifying payment.');
          }
        },
        prefill: { name: authUser.name, email: authUser.email },
        theme: { color: '#F56618' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPaymentStep('failed');
        setPaymentMessage(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setPaymentStep('failed');
      setPaymentMessage(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const isPro = subscription?.isPro || (subscription?.plan && subscription.plan !== 'free');

  return (
    <section className="rounded-[32px] border border-[#FFD84A] bg-gradient-to-br from-[#FFF9D7] via-white to-[#FFF1A8] p-8 shadow-2xl shadow-yellow-200/60">
      <div className="mb-6 flex items-center gap-4">
        <Crown className="text-[#F6C400] drop-shadow-sm" size={30} fill="currentColor" />
        <h2 className="text-3xl font-black">WorkYaar Pro</h2>
        {isPro && (
          <span className="rounded-full bg-green-100 px-4 py-1 text-xs font-black text-green-700">
            Active — {subscription?.plan?.replace('_', ' ')}
          </span>
        )}
      </div>

      {isPro && subscription?.expiresAt && (
        <p className="mb-4 text-sm text-gray-600">
          Your plan expires on {new Date(subscription.expiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </p>
      )}

      {paymentStep !== 'idle' && (
        <div className={cn('mb-6 rounded-2xl border px-5 py-4', paymentStep === 'success' ? 'border-green-200 bg-green-50' : paymentStep === 'failed' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50')}>
          <p className="text-sm font-black text-gray-800">
            {paymentStep === 'creating' && '① Creating order'}
            {paymentStep === 'checkout' && '② Awaiting payment'}
            {paymentStep === 'verifying' && '③ Verifying payment'}
            {paymentStep === 'success' && '✓ Payment complete'}
            {paymentStep === 'failed' && '✗ Payment issue'}
          </p>
          <p className="mt-1 text-sm text-gray-600">{paymentMessage}</p>
        </div>
      )}

      <p className="mb-8 max-w-2xl text-gray-500">Unlock premium features — priority applications, profile boosts, and AI scoring.</p>
      <div className="grid gap-7 lg:grid-cols-2">
        <ProPlanCard
          title="Monthly Subscription"
          price="₹499"
          period="/month"
          features={['Priority job applications', 'Profile boost for 30 days', 'See who viewed your profile', 'AI ATS Resume Scoring']}
          button={loadingPlan === 'monthly' ? 'Processing...' : isPro ? 'Extend Monthly' : 'Subscribe Monthly'}
          onClick={() => handleSubscribe('monthly')}
        />
        <ProPlanCard
          title="Yearly Subscription"
          price="₹3999"
          period="/year"
          features={['Everything in Monthly', 'Save over 30% annually', 'Unlimited applications', 'Featured to top recruiters']}
          button={loadingPlan === 'yearly' ? 'Processing...' : isPro ? 'Extend Yearly' : 'Subscribe Yearly'}
          highlight
          onClick={() => handleSubscribe('yearly')}
        />
      </div>

      {recentPayments.length > 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-200 bg-white/80 p-5">
          <h3 className="mb-3 text-sm font-black text-gray-800">Payment History</h3>
          <div className="space-y-2">
            {recentPayments.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex justify-between text-xs text-gray-600">
                <span>{p.orderId?.slice(0, 24)}...</span>
                <span className={cn('font-bold capitalize', p.status === 'paid' ? 'text-green-600' : p.status === 'failed' ? 'text-red-600' : 'text-gray-500')}>{p.status}</span>
                <span>₹{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const ProPlanCard = ({ title, price, period, features, button, highlight = false, onClick }: any) => (
  <div className={cn('relative rounded-3xl border bg-white p-8 shadow-xl shadow-yellow-200/50', highlight ? 'border-[#FFD84A] bg-[#FFF8CC]' : 'border-[#FFE68A]')}>
    {highlight && <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#F6C400] to-[#FFB000] px-4 py-1 text-xs font-black text-white shadow-lg shadow-yellow-300/50">Best Value</span>}
    <p className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-[#C98200]">{title}</p>
    <div className="mb-8 flex items-end gap-1">
      <span className="text-5xl font-black text-[#9A6A00]">{price}</span>
      <span className="font-bold text-gray-500">{period}</span>
    </div>
    <div className="mb-10 space-y-4">
      {features.map((feature: string) => (
        <div key={feature} className="flex items-center gap-3 text-gray-600">
          <CheckCircle2 size={18} className="text-[#F6C400]" />
          <span>{feature}</span>
        </div>
      ))}
    </div>
    <button type="button" onClick={onClick} className={cn('w-full rounded-xl px-6 py-4 font-black text-white shadow-lg transition-transform hover:-translate-y-0.5', highlight ? 'bg-gradient-to-r from-[#FFB000] to-[#FFD84A] shadow-yellow-300/50' : 'bg-[#F56618] shadow-orange-200')}>
      {button}
    </button>
  </div>
);

const CompanyProfilePage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  
  // Extra Details State
  const [employerType, setEmployerType] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [hiringStatus, setHiringStatus] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const isGstValid = !gstNumber.trim() || GSTIN_REGEX.test(gstNumber.trim());

  useEffect(() => {
    fetch('/api/v1/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.company) {
          const c = data.company;
          setCompany(c);
          setName(c.name || '');
          setDescription(c.description || '');
          setLogoUrl(c.logoUrl || '');
          setWebsite(c.website || '');
          setIndustry(c.industry || '');
          setLocation(c.location || '');
          setEmployeeCount(c.employeeCount || '');
          
          if (c.extraDetails) {
            setEmployerType(c.extraDetails.employerType || '');
            setFoundedYear(c.extraDetails.foundedYear || '');
            setHiringStatus(c.extraDetails.hiringStatus || '');
            setGstNumber(c.extraDetails.gstNumber || '');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    const errors = validateCompanyForm({ name, website, logoUrl, employeeCount, foundedYear, employerType, hiringStatus, gstNumber });
    setFieldErrors(errors);
    setApiError('');
    if (Object.keys(errors).length > 0) {
      setSaveStatus('error');
      return;
    }

    setSaving(true);
    setSaveStatus('idle');

    const payload = {
      name,
      description,
      logoUrl,
      website,
      industry,
      location,
      employeeCount,
      extraDetails: {
        employerType,
        foundedYear,
        hiringStatus,
        gstNumber: gstNumber.trim().toUpperCase(),
      },
    };

    fetch('/api/v1/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
          setApiError(data.message || data.details?.join(', ') || 'Validation failed');
        }
      })
      .catch(() => setSaveStatus('error'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading company profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-12 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Company Profile</h2>
          <p className="mt-2 text-sm text-gray-500">Update your company branding and details.</p>
        </div>
        {saveStatus === 'success' && <span className="flex items-center gap-1.5 text-sm font-bold text-green-600"><CheckCircle2 size={16} /> Saved!</span>}
        {saveStatus === 'error' && <span className="text-sm font-bold text-red-500">{apiError || 'Failed to save. Check highlighted fields.'}</span>}
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        <label className="block">
          <span className="mb-3 block font-bold">Company Name <span className="text-red-500">*</span></span>
          <input className={cn('dashboard-input', fieldErrors.name && 'border-red-300')} value={name} onChange={e => setName(e.target.value)} placeholder="Company Name" />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">Employer Type</span>
          <select className="dashboard-input" value={employerType} onChange={e => setEmployerType(e.target.value)}>
            <option value="">Select Type</option>
            <option value="Direct Employer">Direct Employer</option>
            <option value="Agency">Recruitment Agency</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">Industry</span>
          <input className="dashboard-input" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Information Technology" />
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">Company Size</span>
          <select className="dashboard-input" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)}>
            <option value="">Select Size</option>
            <option value="1-10">1-10 Employees</option>
            <option value="11-50">11-50 Employees</option>
            <option value="51-200">51-200 Employees</option>
            <option value="201-500">201-500 Employees</option>
            <option value="500+">500+ Employees</option>
          </select>
        </label>
      </div>

      <div className="my-5 inline-flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2 text-sm font-black text-[#F56618]">
        <CheckCircle2 size={16} /> Verified Company
      </div>

      <SectionTitle>About Company</SectionTitle>
      <label className="block">
        <span className="mb-3 block font-bold">Description</span>
        <textarea className="dashboard-input min-h-32 resize-y" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell candidates about your company..." />
      </label>
      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <label className="block">
          <span className="mb-3 block font-bold">Founded Year <span className="text-xs font-normal text-gray-400">(optional)</span></span>
          <input type="number" className={cn('dashboard-input', fieldErrors.foundedYear && 'border-red-300')} value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="YYYY" />
          {fieldErrors.foundedYear && <p className="mt-1 text-xs text-red-500">{fieldErrors.foundedYear}</p>}
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">Hiring Status</span>
          <select className="dashboard-input" value={hiringStatus} onChange={e => setHiringStatus(e.target.value)}>
            <option value="">Select</option>
            <option value="Active">Active Hiring</option>
            <option value="Paused">Hiring Paused</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">GST Number <span className="text-xs font-normal text-gray-400">(optional)</span></span>
          <input
            className={cn('dashboard-input', (!isGstValid || fieldErrors.gstNumber) && 'border-red-300')}
            value={gstNumber}
            onChange={e => setGstNumber(e.target.value.toUpperCase())}
            placeholder="29ABCDE1234F1Z5"
            maxLength={15}
          />
          {(!isGstValid || fieldErrors.gstNumber) && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.gstNumber || 'Invalid GSTIN format — 15 characters required'}</p>
          )}
          {isGstValid && gstNumber.trim() && <p className="mt-1 text-xs text-green-600">Valid GSTIN format</p>}
        </label>
      </div>

      <SectionTitle>Branding & Presence</SectionTitle>
      <div className="grid gap-7 lg:grid-cols-2">
        <label className="block">
          <span className="mb-3 block font-bold">Logo URL <span className="text-xs font-normal text-gray-400">(optional)</span></span>
          <input className={cn('dashboard-input', fieldErrors.logoUrl && 'border-red-300')} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
          {fieldErrors.logoUrl && <p className="mt-1 text-xs text-red-500">{fieldErrors.logoUrl}</p>}
          {logoUrl && !fieldErrors.logoUrl && <img src={logoUrl} alt="Logo Preview" className="mt-4 h-16 w-16 rounded-xl object-contain border border-gray-100 shadow-sm" />}
        </label>
        <label className="block">
          <span className="mb-3 block font-bold">Website <span className="text-xs font-normal text-gray-400">(optional)</span></span>
          <input className={cn('dashboard-input', fieldErrors.website && 'border-red-300')} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
          {fieldErrors.website && <p className="mt-1 text-xs text-red-500">{fieldErrors.website}</p>}
        </label>
      </div>

      <SectionTitle>Location</SectionTitle>
      <label className="block">
        <span className="mb-3 block font-bold">Primary Location</span>
        <input className="dashboard-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Hyderabad, India" />
      </label>

      <button 
        type="button" 
        onClick={handleSave} 
        disabled={saving}
        className="mt-10 flex items-center gap-2 rounded-xl bg-[#F56618] px-7 py-3 font-black text-white disabled:opacity-60 transition-transform hover:-translate-y-0.5"
      >
        {saving ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
        ) : (
          'Save Company Profile'
        )}
      </button>
    </section>
  );
};

// Shared state for editing a job
let sharedEditingJob: any = null;

const PostJobPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const isEditing = !!sharedEditingJob;

  const [title, setTitle] = useState(sharedEditingJob?.title || '');
  const [location, setLocation] = useState(sharedEditingJob?.location || '');
  const [locationType, setLocationType] = useState(sharedEditingJob?.locationType || 'remote');
  const [jobType, setJobType] = useState(sharedEditingJob?.jobType || 'full-time');
  const [requirements, setRequirements] = useState(
    Array.isArray(sharedEditingJob?.requirements) ? sharedEditingJob.requirements.join(', ') : ''
  );
  const [salaryMin, setSalaryMin] = useState(sharedEditingJob?.rawSalaryMin || '');
  const [salaryMax, setSalaryMax] = useState(sharedEditingJob?.rawSalaryMax || '');
  const [description, setDescription] = useState(sharedEditingJob?.description || '');
  const [status, setStatus] = useState(sharedEditingJob?.status || 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      requirements,
      locationType,
      jobType,
      location,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      status
    };

    const url = isEditing ? `/api/v1/jobs/${sharedEditingJob.id}` : '/api/v1/jobs';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to save job');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          sharedEditingJob = null;
          onNavigate('Manage Jobs');
        } else {
          setError(data.message || 'An error occurred');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  };

  const handleCancel = () => {
    sharedEditingJob = null;
    onNavigate('Manage Jobs');
  };

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <h2 className="mb-7 text-2xl font-black">{isEditing ? 'Edit Job' : 'Post New Job'}</h2>
      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-gray-700">Job Title *</span>
          <input className="dashboard-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" required />
        </label>
        
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">Location Type</span>
            <select className="dashboard-input" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">Job Type</span>
            <select className="dashboard-input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="gig">Gig / Freelance</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-gray-700">Location (City, Country)</span>
          <input className="dashboard-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hyderabad, India" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-gray-700">Requirements / Skills (comma separated)</span>
          <input className="dashboard-input" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g. React, TypeScript, Node.js" />
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">Min Salary (Annual INR)</span>
            <input type="number" className="dashboard-input" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="e.g. 800000" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">Max Salary (Annual INR)</span>
            <input type="number" className="dashboard-input" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="e.g. 1500000" />
          </label>
        </div>

        {isEditing && (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">Job Status</span>
            <select className="dashboard-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active (Visible to candidates)</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed / Filled</option>
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-gray-700">Job Description *</span>
          <textarea className="dashboard-input min-h-40 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and benefits..." required />
        </label>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="rounded-xl bg-[#F56618] px-8 py-4 font-black text-white disabled:opacity-50">
            {saving ? 'Saving...' : isEditing ? 'Update Job' : 'Post Job'}
          </button>
          <button type="button" onClick={handleCancel} className="rounded-xl border border-gray-200 bg-white px-8 py-4 font-black text-gray-700">
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};

const ManageJobsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = () => {
    fetch('/api/v1/employer/jobs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load employer jobs');
        return res.json();
      })
      .then((data) => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusToggle = (jobId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    fetch(`/api/v1/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) fetchJobs();
      })
      .catch((err) => console.error('Error toggling job status:', err));
  };

  const handleDelete = (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job permanently?')) return;
    fetch(`/api/v1/jobs/${jobId}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) fetchJobs();
      })
      .catch((err) => console.error('Error deleting job:', err));
  };

  const handleEdit = (job: any) => {
    sharedEditingJob = job;
    onNavigate('Post Job');
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading your jobs...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Manage Jobs</h2>
          <p className="mt-2 text-sm text-gray-500">Track, edit, or close your active job listings.</p>
        </div>
        <button type="button" onClick={() => { sharedEditingJob = null; onNavigate('Post Job'); }} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Post Job</button>
      </div>

      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500">{error}</div>}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Briefcase className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No jobs posted yet. Use 'Post Job' to add one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-black text-gray-900">{job.title}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                  <span>·</span>
                  <span className="capitalize">{job.locationType}</span>
                  <span>·</span>
                  <span>{job.location}</span>
                  <span>·</span>
                  <span className="font-bold text-gray-700">{job.salaryRange}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', job.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700')}>
                  {job.status}
                </span>
                
                <button type="button" onClick={() => handleEdit(job)} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-black text-gray-700 transition-transform hover:-translate-y-0.5">
                  Edit
                </button>
                <button type="button" onClick={() => handleStatusToggle(job.id, job.status)} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-black text-gray-700 transition-transform hover:-translate-y-0.5">
                  {job.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <button type="button" onClick={() => handleDelete(job.id)} className="rounded-xl bg-red-50 px-3.5 py-2 text-xs font-black text-red-600 transition-transform hover:-translate-y-0.5">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

type EmployerApplication = {
  id: number;
  jobId: number;
  status: string;
  appliedAt: string;
  coverLetter: string;
  candidate: {
    id: number;
    name: string;
    email: string;
    avatar: string;
    resumeUrl: string;
  };
  job: {
    title: string;
    jobType: string;
    locationType: string;
    location: string;
    company: { name: string; logo: string };
  };
};

const EmployerApplicationsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [tab, setTab] = useState('All');
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [employerJobs, setEmployerJobs] = useState<{ id: number; title: string }[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [topCandidates, setTopCandidates] = useState<any[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<Record<number, any>>({});
  const [scoringAppId, setScoringAppId] = useState<number | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{
    appId: number;
    candidateName: string;
    jobTitle: string;
  } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('45');
  const [scheduleLink, setScheduleLink] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const fetchApplications = () => {
    fetch('/api/v1/employer/applications')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load applications');
        return res.json();
      })
      .then((data) => {
        setApplications(data.applications || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const loadTopCandidates = (jobId: number) => {
    setLoadingTop(true);
    fetch(`/api/v1/employer/recommendations/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        setTopCandidates(data.recommendations || []);
        setLoadingTop(false);
      })
      .catch(() => {
        setTopCandidates([]);
        setLoadingTop(false);
      });
  };

  useEffect(() => {
    fetchApplications();
    fetch('/api/v1/employer/jobs')
      .then((res) => res.json())
      .then((data) => {
        const jobs = data.jobs || [];
        setEmployerJobs(jobs.map((j: any) => ({ id: j.id, title: j.title })));
        if (jobs.length > 0) {
          setSelectedJobId(jobs[0].id);
          loadTopCandidates(jobs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleAtsScore = async (appId: number, jobId: number) => {
    if (aiScores[appId]) return;
    setScoringAppId(appId);
    try {
      const token = localStorage.getItem('workyaar.auth.token');
      const res = await fetch('/api/v1/ai/ats-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: appId, jobId: jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to score');
      
      setAiScores(prev => ({ ...prev, [appId]: data.ats }));
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      setScoringAppId(null);
    }
  };

  const handleUpdateStatus = (appId: number, status: string) => {
    fetch(`/api/v1/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchApplications();
        }
      })
      .catch((err) => console.error('Error updating status:', err));
  };

  const openScheduleModal = (app: EmployerApplication) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduleDate(local);
    setScheduleDuration('45');
    setScheduleLink('');
    setScheduleNotes('Initial discussion');
    setScheduleModal({ appId: app.id, candidateName: app.candidate.name, jobTitle: app.job.title });
  };

  const handleMessageCandidate = (appId: number) => {
    sharedMessageApplicationId = appId;
    onNavigate('Messages');
  };

  const submitScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModal || !scheduleDate) return;
    setScheduling(true);
    try {
      const res = await fetch('/api/v1/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: scheduleModal.appId,
          scheduledAt: new Date(scheduleDate).toISOString(),
          durationMinutes: Number(scheduleDuration),
          meetingLink: scheduleLink.trim() || undefined,
          notes: scheduleNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.details?.join(', ') || 'Failed to schedule');
      handleUpdateStatus(scheduleModal.appId, 'interviewing');
      setScheduleModal(null);
    } catch (err: any) {
      alert(err.message || 'Could not schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (tab === 'All') return applications;
    if (tab === 'Pending') return applications.filter((app) => app.status === 'applied');
    if (tab === 'Interviews') return applications.filter((app) => app.status === 'interviewing');
    return applications.filter((app) => app.status.toLowerCase() === tab.toLowerCase());
  }, [applications, tab]);

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading incoming applications...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[32px] border border-red-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-lg font-black text-red-500">Failed to load applications</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 rounded-xl bg-[#F56618] px-6 py-3 text-sm font-black text-white">Retry</button>
        </div>
      </section>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-green-50 text-green-700';
      case 'rejected': return 'bg-red-50 text-red-700';
      case 'interviewing': return 'bg-blue-50 text-blue-700';
      case 'applied':
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Applications</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review candidate details, shortlist profiles, and coordinate interviews.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('Interviews')} className="rounded-xl border border-gray-200 px-5 py-3 font-black text-gray-700">Interviews</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {['All', 'Pending', 'Shortlisted', 'Interviews', 'Rejected'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn('rounded-xl px-7 py-3 font-black transition-colors', tab === item ? 'bg-[#F56618] text-white shadow-lg shadow-orange-100' : 'bg-orange-50 text-[#F56618]')}
          >
            {item}
          </button>
        ))}
      </div>

      <Panel title="Top Candidates for Job">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            className="dashboard-input max-w-md"
            value={selectedJobId}
            onChange={(e) => {
              const jobId = Number(e.target.value);
              setSelectedJobId(jobId);
              if (jobId) loadTopCandidates(jobId);
            }}
          >
            {employerJobs.length === 0 && <option value="">No jobs posted yet</option>}
            {employerJobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">Ranked by skill match — Top 1% at 90%+ match</span>
        </div>
        {loadingTop ? (
          <p className="text-sm text-gray-400">Loading top candidates...</p>
        ) : topCandidates.length === 0 ? (
          <p className="text-sm text-gray-400">No applicants for this job yet.</p>
        ) : (
          <div className="space-y-3">
            {topCandidates.slice(0, 5).map((candidate) => (
              <div key={candidate.applicationId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-gray-900">
                    #{candidate.rank} {candidate.candidateName}
                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700">{candidate.rankLabel}</span>
                  </p>
                  <p className="text-xs text-gray-500">{candidate.reason}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">{candidate.matchPercent}% match</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="mb-6" />

      {filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <User className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No {tab === 'All' ? '' : tab.toLowerCase()} applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div key={app.id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3B1976] text-white text-sm font-black">
                    {app.candidate.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-gray-900">{app.candidate.name}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', getStatusStyle(app.status))}>{app.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{app.candidate.email}</p>
                    <p className="mt-1.5 text-sm font-bold text-[#F56618]">Applying for: {app.job.title}</p>
                    {app.coverLetter && (
                      <p className="mt-2 text-sm italic text-gray-500 max-w-xl line-clamp-2">"{app.coverLetter}"</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  {app.candidate.resumeUrl && (
                    <a href={resolveResumeUrl(app.candidate.resumeUrl)} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 transition-transform hover:-translate-y-0.5">
                      View Resume
                    </a>
                  )}
                  <button type="button" onClick={() => handleMessageCandidate(app.id)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700">
                    <MessageSquare size={13} /> Message
                  </button>
                  {app.status === 'applied' && (
                    <>
                      <button type="button" onClick={() => handleUpdateStatus(app.id, 'shortlisted')} className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                        Shortlist
                      </button>
                      <button type="button" onClick={() => handleUpdateStatus(app.id, 'rejected')} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                        Reject
                      </button>
                    </>
                  )}
                  {(app.status === 'shortlisted' || app.status === 'interviewing') && (
                    <>
                      <button type="button" onClick={() => openScheduleModal(app)} className="rounded-xl bg-[#3B1976] px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                        {app.status === 'interviewing' ? 'Schedule Another Interview' : 'Schedule Interview'}
                      </button>
                      <button type="button" onClick={() => handleUpdateStatus(app.id, 'rejected')} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                        Reject
                      </button>
                    </>
                  )}
                  <button 
                    type="button" 
                    onClick={() => handleAtsScore(app.id, app.jobId)} 
                    disabled={scoringAppId === app.id}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-black text-purple-700 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Sparkles size={13} fill="currentColor" /> {scoringAppId === app.id ? 'Scoring...' : 'AI Score'}
                  </button>
                </div>
              </div>

              {aiScores[app.id] && (() => {
                const { strengths, weaknesses } = getAtsLists(aiScores[app.id]);
                return (
                <div className="mt-2 rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                    <h4 className="text-sm font-black text-purple-900 flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> AI ATS Insight</h4>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">Match Score: {aiScores[app.id].score}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{aiScores[app.id].summary}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Strengths</h5>
                      <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
                        {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Weaknesses / Gaps</h5>
                      <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                        {weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Schedule Interview</h3>
                <p className="text-sm text-gray-500">{scheduleModal.candidateName} — {scheduleModal.jobTitle}</p>
              </div>
              <button type="button" onClick={() => setScheduleModal(null)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">✕</button>
            </div>
            <form onSubmit={submitScheduleInterview} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Date & Time *</span>
                <input type="datetime-local" className="dashboard-input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Duration (minutes)</span>
                <select className="dashboard-input" value={scheduleDuration} onChange={(e) => setScheduleDuration(e.target.value)}>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Meeting Link <span className="font-normal text-gray-400">(optional)</span></span>
                <input type="url" className="dashboard-input" value={scheduleLink} onChange={(e) => setScheduleLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-700">Notes <span className="font-normal text-gray-400">(optional)</span></span>
                <textarea className="dashboard-input min-h-24 resize-y" value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="Interview agenda or instructions..." />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={scheduling} className="flex-1 rounded-xl bg-[#3B1976] py-4 font-black text-white disabled:opacity-50">
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
                <button type="button" onClick={() => setScheduleModal(null)} className="flex-1 rounded-xl border border-gray-200 py-4 font-black text-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

type EmployerInterview = {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: string;
  notes: string;
  job: { title: string };
  candidate: { name: string; email: string; avatar: string };
};

const EmployerInterviewsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [filter, setFilter] = useState('All');
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviews = () => {
    fetch('/api/v1/employer/interviews')
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data.interviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchInterviews(); }, []);

  const handleUpdateStatus = (id: number, status: string) => {
    fetch(`/api/v1/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then((data) => { if (data.success) fetchInterviews(); })
      .catch((err) => console.error('Error updating interview:', err));
  };

  const filteredInterviews = useMemo(() => {
    if (filter === 'All') return interviews;
    if (filter === 'Upcoming') return interviews.filter((i) => i.status === 'scheduled' || i.status === 'rescheduled');
    return interviews.filter((i) => i.status.toLowerCase() === filter.toLowerCase());
  }, [interviews, filter]);

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'scheduled': return 'bg-blue-50 text-blue-700';
      case 'completed': return 'bg-green-50 text-green-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'rescheduled': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <section className="rounded-[32px] border border-gray-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Loading interviews...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black">Interviews</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Manage scheduled interviews with candidates.</p>
        </div>
        <button type="button" onClick={() => onNavigate('Applications')} className="rounded-xl bg-[#F56618] px-5 py-3 font-black text-white">Schedule Interview</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={cn('rounded-xl px-7 py-3 font-black transition-colors', filter === item ? 'bg-[#F56618] text-white' : 'bg-orange-50 text-[#F56618]')}>
            {item}
          </button>
        ))}
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Calendar className="text-gray-200" size={48} />
          <p className="text-sm font-bold text-gray-400">No {filter === 'All' ? '' : filter.toLowerCase()} interviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((iv) => (
            <div key={iv.id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3B1976] text-white text-sm font-black">
                  {iv.candidate.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">{iv.candidate.name}</p>
                  <p className="text-xs text-gray-400">{iv.candidate.email}</p>
                  <p className="mt-1 text-sm font-bold text-[#F56618]">For: {iv.job.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-gray-700">
                  {new Date(iv.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(iv.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {iv.durationMinutes}min
                </span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', getStatusStyle(iv.status))}>{iv.status}</span>
                {iv.status === 'scheduled' && (
                  <>
                    <button type="button" onClick={() => handleUpdateStatus(iv.id, 'completed')} className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                      Mark Complete
                    </button>
                    <button type="button" onClick={() => handleUpdateStatus(iv.id, 'cancelled')} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition-transform hover:-translate-y-0.5">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const SectionTitle = ({ children }: { children: ReactNode }) => <h3 className="mb-7 mt-9 text-xl font-black text-[#F56618]">{children}</h3>;

const TextField = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <label className="block">
    <span className="mb-3 block font-bold">{label}</span>
    <input className="dashboard-input" placeholder={placeholder} />
  </label>
);

const SelectField = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <label className="block">
    <span className="mb-3 block font-bold">{label}</span>
    <select className="dashboard-input text-gray-500">
      <option>{placeholder}</option>
    </select>
  </label>
);

const TextAreaField = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <label className="block">
    <span className="mb-3 block font-bold">{label}</span>
    <textarea className="dashboard-input min-h-36 resize-y" placeholder={placeholder} />
  </label>
);

const DataTable = ({ columns, empty }: { columns: string[]; empty: string }) => (
  <div className="overflow-x-auto rounded-none">
    <div className="min-w-[720px]">
      <div className="grid bg-[#F56618] text-white" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <div key={column} className="px-5 py-5 font-black">{column}</div>
        ))}
      </div>
      <div className="border-b border-gray-100 py-9 text-center text-lg text-gray-400">{empty}</div>
    </div>
  </div>
);

const LegendItem = ({ color, label }: any) => (
  <div className="flex items-center gap-2">
    <div className={cn('h-2 w-2 rounded-full', color)} />
    <span className="text-[10px] font-bold text-gray-400">{label}</span>
  </div>
);

const AdminUsersPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError(data.message || 'Error fetching users');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center"><div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" /></div>;

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <h2 className="mb-6 text-2xl font-black">All Platform Users</h2>
      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={cn('rounded-full px-2 py-1 text-xs font-bold', u.role === 'employer' ? 'bg-blue-50 text-blue-700' : u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700')}>{u.role}</span>
                </td>
                <td className="px-4 py-3">{u.provider}</td>
                <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="py-10 text-center text-gray-400">No users found</div>}
      </div>
    </section>
  );
};

const AdminJobsPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJobs(data.jobs || []);
        } else {
          setError(data.message || 'Error fetching jobs');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center"><div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" /></div>;

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <h2 className="mb-6 text-2xl font-black">All Platform Jobs</h2>
      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Employer Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posted</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                <td className="px-4 py-3">{j.id}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{j.title}</td>
                <td className="px-4 py-3">{j.companyName || 'N/A'}</td>
                <td className="px-4 py-3">{j.employerEmail}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={cn('rounded-full px-2 py-1 text-xs font-bold', j.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700')}>{j.status}</span>
                </td>
                <td className="px-4 py-3">{new Date(j.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && <div className="py-10 text-center text-gray-400">No jobs found</div>}
      </div>
    </section>
  );
};

const AdminCompaniesPage = ({ onNavigate }: { onNavigate: NavigateHandler }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/companies')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCompanies(data.companies || []);
        } else {
          setError(data.message || 'Error fetching companies');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center"><div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-[#F56618] border-t-transparent" /></div>;

  return (
    <section className="rounded-[32px] border border-gray-100 bg-white p-8">
      <h2 className="mb-6 text-2xl font-black">All Companies</h2>
      {error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Employer Name</th>
              <th className="px-4 py-3">Employer Email</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                <td className="px-4 py-3">{c.id}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                <td className="px-4 py-3">{c.industry || 'N/A'}</td>
                <td className="px-4 py-3">{c.employerName}</td>
                <td className="px-4 py-3">{c.employerEmail}</td>
                <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && <div className="py-10 text-center text-gray-400">No companies found</div>}
      </div>
    </section>
  );
};