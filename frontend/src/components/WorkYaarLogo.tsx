import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type WorkYaarLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  workClassName?: string;
  yaarClassName?: string;
  showText?: boolean;
  onDark?: boolean;
};

const WorkYaarLogo = ({
  className,
  imageClassName,
  textClassName,
  workClassName,
  yaarClassName,
  showText = true,
  onDark = false,
}: WorkYaarLogoProps) => (
  <Link to="/" className={cn('flex items-center gap-3', className)} aria-label="WorkYaar home">
    <img
      src="/assets/site-logo.jpeg"
      alt="WorkYaar logo"
      className={cn('h-12 w-12 shrink-0 object-contain', imageClassName)}
    />
    {showText && (
      <span className={cn('text-2xl font-black tracking-tight', onDark ? 'text-white' : 'text-[#111827]', textClassName)}>
        <span className={workClassName}>Work</span><span className={cn('text-[#F56618]', yaarClassName)}>Yaar</span>
      </span>
    )}
  </Link>
);

export default WorkYaarLogo;
