interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-soft-pink px-3 py-1 text-xs font-semibold text-chocolate ${className}`}
    >
      {children}
    </span>
  );
}
