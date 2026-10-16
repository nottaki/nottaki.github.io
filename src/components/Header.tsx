import type { ReactNode } from "react"
import { NavLink } from "react-router"

const LINKS = [
    { href: '/', label: 'Home' },
    { href: '/discography', label: 'Discography' },
    { href: '/commissions', label: 'Commissions' },
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
                    <Link key={link.href} to={link.href}>{link.label}</Link>
                ))}
            </nav>
        </header>
    )
}

interface LinkProps {
    to: string
    children: ReactNode
}

const Link = ({ to, children }: LinkProps) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => isActive
                ? "after:bottom-full bg-primary text-primary-foreground transition-all duration-600 px-1.5"
                : "relative after:content-[''] after:absolute after:w-0 after:opacity-0 after:h-px after:bg-primary after:left-0 after:bottom-0 hover:text-foreground/80 hover:after:w-full hover:after:opacity-100 after:transition-all after:duration-300 after:ease-out active:after:bottom-full active:bg-primary active:text-primary-foreground transition-all duration-500 px-1.5"
            }
        >
            {children}
        </NavLink>
    )
}

export default Header
