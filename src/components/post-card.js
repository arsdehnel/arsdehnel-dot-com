import Link from 'next/link'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    return (
        <Link href={ slug }>
            <div className="post-card">
        
            <div className="post-content">
                {
                    coverImage &&
                    <img
                        src={ coverImage }
                        // width={ 500 }
                        // height={ 500 }
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