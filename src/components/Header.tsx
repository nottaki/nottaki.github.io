import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import { Icon } from "@iconify/react"
import gsap from "gsap"
import { useRef, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router"

const LINKS = [
    { href: '/', label: 'Home', icon: 'boxicons:home-alt-2' },
    { href: '/discography', label: 'Discography', icon: 'boxicons:list-music' },
    { href: '/commissions', label: 'Commissions', icon: 'vadivam:users-collaboration' },
]

const Header = () => {
    const logoRef = useRef<HTMLHeadingElement | null>(null)
    const tl = useRef<GSAPTimeline | null>(null)

    const location = useLocation()


    useGSAP(() => {
        const el = logoRef.current
        if (!el) return

        tl.current = gsap.timeline({ paused: true })

        if (location.pathname === "/discography") {
            gsap.to("#logo-not", {
                scrambleText: "Disco",
            })
            gsap.to("#logo-taki", {
                text: "graphy"
            })
        } else if (location.pathname === "/commissions") {
            gsap.to("#logo-not", {
                scrambleText: "Commis"
            })
            gsap.to("#logo-taki", {
                text: "sions"
            })
        } else {
            gsap.to("#logo-not", {
                scrambleText: "not"
            })
            gsap.to("#logo-taki", {
                text: "Taki"
            })
        }

        tl.current
            .to("#logo-not", {
                x: -5,
                ease: "elastic"
            })
            .to("#logo-taki", {
                x: 5,
                ease: "elastic"
            }, "<")
            .to("#logo-not", {
                duration: 1,
                text: "definitely not"
            })
            .to("#logo-taki", {
                text: {
                    value: "Taki !",
                    type: "diff"
                },
                x: 0,
                ease: "elastic"
            })

        const handleMouseEnter = () => tl.current?.play()
        const handleMouseLeave = () => tl.current?.reverse()

        el.addEventListener("mouseenter", handleMouseEnter)
        el.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            el.removeEventListener("mouseenter", handleMouseEnter)
            el.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, { scope: logoRef, dependencies: [location.pathname] })

    return (
        <header className="z-9 px-8 py-4 flex justify-between items-center">
            <h1
                ref={logoRef}
                className="text-sm xs:text-xl font-bold tracking-wide cursor-default inline-flex items-center"
            >
                <p id="logo-not">not</p>
                <p id="logo-taki">Taki</p>
            </h1>

            <nav className="flex gap-6 xs:gap-8">
                {LINKS.map((link) => (
                    <Link
                        key={link.href}
                        to={link.href}
                        icon={link.icon}
                        className="inline-flex items-center justify-center"
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </header>
    )
}

interface LinkProps {
    children: ReactNode
    className?: string
    icon: string
    to: string
}

const Link = ({ children, className, icon, to }: LinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => isActive
                ? cn("after:bottom-full bg-primary text-primary-foreground transition-all duration-600 px-1.5", className)
                : cn("relative after:content-[''] after:absolute after:w-0 after:opacity-0 after:h-px after:bg-primary after:left-0 after:bottom-0 hover:text-foreground/80 hover:after:w-full hover:after:opacity-100 after:transition-all after:duration-300 after:ease-out active:after:bottom-full active:bg-primary active:text-primary-foreground transition-all duration-500 px-1.5", className)
            }
        >
            <Icon icon={icon} inline className="my-1 sm:hidden" />
            <span className="hidden sm:contents">{children}</span>
        </NavLink>
    )
}

export default Header
