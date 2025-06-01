import Link from 'next/link'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    return (
        <div className="post-card">
            <h3><Link href={ slug }>{ title }</Link></h3>
            <div className="post-content">
                {
                    coverImage &&
                    <img
                        src={ coverImage }
                        width={ 500 }
                        height={ 500 }
                        alt={ coverImageAltText }
                    />
                }
                <div>Date: { date }</div>
                <p>{ excerpt }</p>
            </div>
        </div>
    )
}