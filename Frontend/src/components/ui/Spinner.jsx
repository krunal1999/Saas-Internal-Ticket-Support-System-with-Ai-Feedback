export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]',
    xl: 'w-16 h-16 border-4',
  };
  return (
    <div
      className={`
        ${sizes[size]} 
        rounded-full 
        border-brand-500/20 border-t-brand-400
        animate-spin
        ${className}
      `}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-slate-500 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
