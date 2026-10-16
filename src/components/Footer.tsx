const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className="flex items-center justify-between px-4 py-8 border-t">
            <p>&copy; {year} notTaki</p>
            <p>で、真剣に誰？</p>
        </footer>
    )
}


export default Footer
