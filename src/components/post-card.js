import Link from 'next/link'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    return (
        <div className="post-card">
            <Link href={ slug } className="post-header">
                {
                    coverImage &&
                    <img
                        src={ coverImage }
                        width={ 48 }
                        height={ 48 }
                        alt={ coverImageAltText }
                    />
                }
                <div className="post-title">
                    <h3>                    
                        { title }
                    </h3>
                    <div className="post-date">Date: { date }</div>
                </div>
            </Link>
            <div className="post-content">
                
                
                <p>{ excerpt }</p>
            </div>
        </div>
    )
}