import React from "react";

export function OrbitingCircles({
    className = "",
    children,
    reverse = false,
    duration = 20,
    delay = 10,
    radius = 50,
    path = true,
    iconSize = 30,
    speed = 1,
}) {
    const count = React.Children.count(children);
    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes orbit {
          0% {
            transform: rotate(calc(var(--angle) * 1deg)) translateY(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg));
          }
          100% {
            transform: rotate(calc(var(--angle) * 1deg + 360deg)) translateY(calc(var(--radius) * 1px)) rotate(calc((var(--angle) * -1deg) - 360deg));
          }
        }
        .animate-orbit {
          animation: orbit calc(var(--duration) * 1s) linear infinite;
        }
        .animate-orbit-reverse {
          animation: orbit calc(var(--duration) * 1s) linear infinite reverse;
        }
      `}} />
            {path && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                >
                    <circle
                        className="stroke-white/10 stroke-1"
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="none"
                    />
                </svg>
            )}

            {React.Children.map(children, (child, index) => {
                const angle = (360 / count) * index;
                return (
                    <div
                        style={{
                            "--duration": duration / speed,
                            "--radius": radius,
                            "--angle": angle,
                            width: iconSize,
                            height: iconSize,
                        }}
                        className={`absolute flex transform-gpu items-center justify-center rounded-full border border-white/10 bg-[#151515] p-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${reverse ? "animate-orbit-reverse" : "animate-orbit"
                            } ${className}`}
                    >
                        {child}
                    </div>
                );
            })}
        </>
    );
}
