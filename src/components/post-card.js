import { useRouter } from 'next/router'

export default function PostCard( { slug, title, date, excerpt, coverImage, coverImageAltText } ) {

    const router = useRouter()

    return (
        <div className="post-card" onClick={ e => router.push( slug ) }>
            <div>
                <div className="post-content">
                    <img
                        src={ coverImage }
                        alt={ coverImageAltText }
                    />
                    <h3 className="no-underline">{ title }</h3>
                    <p className="no-underline">{ excerpt }</p>
                    <h4 className="no-underline">{ date }</h4>
                </div>
            </div>
        </div>
    )
}