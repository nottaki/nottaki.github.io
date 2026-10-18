import Meta from '@/components/Meta'

const NotFoundPage = () => {
    return (
        <>
            <Meta />

            <div>
                <h1>404 - Page Not Found</h1>
                <p>It looks like the page you are looking for doesn't exist.</p>
                <p>Maybe it was moved, or maybe it never existed at all!</p>
            </div>
        </>
    )
}

export default NotFoundPage
