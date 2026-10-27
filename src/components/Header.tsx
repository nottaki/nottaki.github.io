import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import { Icon, type IconifyIcon } from "@iconify/react"
import gsap from "gsap"
import { useRef, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router"

const LINKS = [
    {
        href: '/',
        label: 'Home',
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"currentColor\" d=\"M12.71 2.29a.996.996 0 0 0-1.41 0l-8.01 8A1 1 0 0 0 3 11v9c0 1.1.9 2 2 2h4c.55 0 1-.45 1-1v-6h4v6c0 .55.45 1 1 1h4c1.1 0 2-.9 2-2v-9c0-.27-.11-.52-.29-.71zM16 20v-5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5H5v-8.59l7-7l7 7V20z\"/>"
        }
    },
    {
        href: '/discography',
        label: 'Discography',
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"currentColor\" d=\"M3 11h12v2H3zm0-5h12v2H3zm0 10h9v2H3zm14-9v8.05a2.5 2.5 0 1 0-.5 4.95a2.5 2.5 0 0 0 2.5-2.5V8h2V6h-3c-.55 0-1 .45-1 1\"/>"
        }
    },
    {
        href: '/commissions',
        label: 'Commissions',
        icon: {
            "width": 24,
            "height": 24,
            "body": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 13.5c-.285-4.667-8.715-4.667-9 0M22 22c-.285-4.667-8.715-4.667-9 0m1.619-19.132a9.5 9.5 0 0 1 5.067 3.548M9.381 21.132a9.5 9.5 0 0 1-5.067-3.548M4 4.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 0 0-5 0M15 13a2.5 2.5 0 1 0 5 0a2.5 2.5 0 0 0-5 0\"/>"
        }
    },
    {
        href: '/contact',
        label: 'Contact',
        icon: {
            "width": 36,
            "height": 36,
            "body": "<path fill=\"currentColor\" d=\"M8 19v-8H5a3 3 0 0 0-3 3v18a1 1 0 0 0 .56.89a1 1 0 0 0 1-.1L8.71 29h13.44A2.77 2.77 0 0 0 25 26.13V25H14a6 6 0 0 1-6-6\" class=\"clr-i-solid clr-i-solid-path-1\"/><path fill=\"currentColor\" d=\"M31 4H14a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h13.55l4.78 3.71a1 1 0 0 0 1 .11a1 1 0 0 0 .57-.9V7A3 3 0 0 0 31 4\" class=\"clr-i-solid clr-i-solid-path-2\"/><path fill=\"none\" d=\"M0 0h36v36H0z\"/>"
        }
    },
]

const Header = () => {
    const logoRef = useRef<HTMLHeadingElement | null>(null)
    const tl = useRef<GSAPTimeline | null>(null)

    const location = useLocation()


    useGSAP(() => {
        const el = logoRef.current
        if (!el) return

        tl.current = gsap.timeline({ paused: true })
        const validPage = LINKS.find(l => l.href === location.pathname)

        if (location.pathname === "/" || !validPage) {
            gsap.to("#logo-not", {
                scrambleText: "not"
            })
            gsap.to("#logo-taki", {
                text: "Taki"
            })
        } else {
            const title = validPage.label
            gsap.to("#logo-not", {
                scrambleText: title.substring(0, Math.floor(title.length / 2)),
            })
            gsap.to("#logo-taki", {
                text: title.substring(Math.floor(title.length / 2)),
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

            <nav className="flex gap-3 xs:gap-6">
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
    icon: IconifyIcon
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
