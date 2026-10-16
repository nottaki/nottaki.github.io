import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const ScrollHint = () => {
    const [hidden, setHidden] = useState(false)
    const [hasScroll, setHasScroll] = useState(false)

    useEffect(() => {
        const checkScrollable = () => {
            setHasScroll(document.documentElement.scrollHeight > window.innerHeight + 8)
        }
        const onScroll = () => setHidden(window.scrollY > 60)

        checkScrollable()
        onScroll()

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", checkScrollable)
        const observer = new ResizeObserver(checkScrollable)
        observer.observe(document.body)

        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", checkScrollable)
            observer.disconnect()
        }
    }, [])

    const visible = hasScroll && !hidden

    return (
        <div
            className={cn(
                "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-90 flex flex-col items-center gap-1.5 transition-all duration-500",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
            aria-hidden="true"
        >
            <div className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-stone-400/70 p-1.5">
                <div
                    className="scroll-hint-anim h-1.5 w-1 rounded-full bg-stone-400/80"
                    style={{ animation: "scroll-hint-wheel 1.6s ease-in-out infinite" }}
                />
            </div>
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="scroll-hint-anim text-stone-400/80"
                style={{ animation: "scroll-hint-bob 1.6s ease-in-out infinite" }}
                aria-hidden="true"
            >
                <path d="M6 9l6 6 6-6" />
            </svg>
            <style>{`
        @keyframes scroll-hint-wheel {
          0% { transform: translateY(0); opacity: 1; }
          70% { transform: translateY(10px); opacity: 0; }
          71% { transform: translateY(0); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scroll-hint-bob {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(3px); opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-hint-anim { animation: none !important; }
        }
      `}</style>
        </div>
    )
}

export default ScrollHint
