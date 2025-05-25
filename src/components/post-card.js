import Link from 'next/link'

export default function PostCard( { slug, title, date, excerpt } ) {
    return (
        <div>
            <h3><Link href={ slug }>{ title }</Link></h3>
            <div>Date: { date }</div>
            <p>{ excerpt }</p>
        </div>
    )
}