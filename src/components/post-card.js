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
                    <h3 >{ title }</h3>
                    <p >{ excerpt }</p>
                    <div className="post-date" >{ date }</div>
                </div>
            </div>
        </div>
    )
}