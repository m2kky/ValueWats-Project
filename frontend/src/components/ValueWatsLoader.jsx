/**
 * ValueWatsLoader - reusable branded loading component.
 * Uses the animated brand icon from /public/icon-blue-animated.svg.
 */
export default function ValueWatsLoader({ size = 64, text, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <img
        src="/icon-blue-animated.svg"
        alt="Value chat loading"
        width={size}
        height={size}
        className="drop-shadow-[0_0_20px_rgba(34,42,198,0.35)]"
      />
      {text && (
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}


