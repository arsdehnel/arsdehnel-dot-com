import Link from 'next/link'
import dayjs from 'dayjs'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    return (
        <div className="post-card">
            <h3><Link href={ slug }>{ title }</Link></h3>
            <div className="post-content">
                <div className="post-date">{ dayjs( date ).format( 'MMMM D, YYYY' ) }</div>
                <p>{ excerpt }</p>
                {
                    coverImage &&
                    <img
                        src={ coverImage }
                        alt={ coverImageAltText }
                    />
                }
            </div>
        </div>
    )
}