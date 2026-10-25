import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react"
import type { ReactNode } from "react"
import { NavLink } from "react-router"

const LINKS = [
    { href: '/', label: 'Home', icon: 'boxicons:home-alt-2' },
    { href: '/discography', label: 'Discography', icon: 'boxicons:list-music' },
    { href: '/commissions', label: 'Commissions', icon: 'vadivam:users-collaboration' },
]

const Header = () => {
    return (
        <header className="z-9 px-8 py-4 flex justify-between items-center">
            <div
                id="kind-of-logo-yu-know"
                className="text-xl font-bold tracking-wide cursor-default"
            >
                <span>not</span>
                <span>Taki</span>
            </div>

            <nav className="flex gap-8">
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
