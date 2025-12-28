import Link from 'next/link'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    return (
        <Link href={ slug } className="post-card">
            <div >
        
            <div className="post-content">
                {
                    coverImage &&
                    <img
                        src={ coverImage }
                        alt={ coverImageAltText }
                    />
                }
                <h3 className="no-underline">{ title }</h3>
                <p className="no-underline">{ excerpt }</p>
                <h5 className="no-underline">{ date }</h5>
            </div>
        
        </div>
        
        </Link>
    )
}