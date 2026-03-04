/**
 * ValueWatsLoader — Reusable branded loading component
 * Uses the animated chat-bubble SVG from /public/valuewats-animated-loader.svg
 */
export default function ValueWatsLoader({ size = 64, text, className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <img
                src="/valuewats-animated-loader.svg"
                alt="Loading..."
                width={size}
                height={size}
                className="drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            />
            {text && (
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}
