declare global {
  interface Window {
    hidePreloader?: () => void
  }
}

import { Footer, Header } from "@/components"
import ScrollHint from "@/components/ScrollHint"
import { lenis } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { Outlet } from "react-router"

const App = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollTopArrow = useRef<HTMLDivElement>(null)

  // Tell the index.html preloader that React is ready!
  useEffect(() => {
    if (window.hidePreloader) {
      window.hidePreloader()
    }
  }, [])

  const scorllToTop = () => {
    scrollTopArrow.current?.classList.add("-translate-y-full")
    lenis.scrollTo(0, { duration: 1.2, lock: true })
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(document.documentElement.scrollTop >= 150)

      if (document.documentElement.scrollTop === 0) {
        scrollTopArrow.current?.classList.remove("-translate-y-full")
      }
    }

    handleScroll()

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <Header />

      <main className="flex-1 flex flex-col items-center">
        <Outlet />

        <div className={cn(
          "fixed right-0 bottom-0 xs:-translate-x-1/6 -translate-y-4/5 md:-translate-y-1/2 [writing-mode:vertical-lr] flex items-center gap-2 group transition-all duration-700 ease-in-out",
          isScrolled ? "opacity-100 visible" : "opacity-0 invisible"
        )}>
          <div
            ref={scrollTopArrow}
            className="h-[5vh] md:h-[10vh] w-0.5 bg-primary/20 group-hover:bg-primary relative transition-all duration-600 ease-in-out"
          >
            <div className="h-2 w-0.5 top-0 -translate-y-1 bg-inherit absolute origin-top rotate-45"></div>
            <div className="h-2 w-0.5 top-0 -translate-y-1 bg-inherit absolute origin-top -rotate-45"></div>
          </div>
          <button
            className="text-sm md:text-base px-2 py-1.5 md:px-4 md:py-2 rounded-md hover:bg-secondary/60 hover:backdrop-blur border-transparent hover:border-border border active:bg-transparent active:border-transparent active:translate-y-2 transition-all duration-300 ease-in-out text-foreground/60 hover:text-foreground active:text-foreground"
            onClick={scorllToTop}
          >
            Scroll to Top
          </button>
        </div>

      </main>

      <ScrollHint />
      <Footer />
    </>
  )
}

export default App
