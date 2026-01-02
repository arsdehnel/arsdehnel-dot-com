import iconMap from "./icon-map";

export default function Categories( { categories } ) {

    return (
        <div className="categories">
            {
                categories.map( c => {
                    if( !iconMap[ c ] ) {
                        return <div key={ c } style={ { background: 'red', padding: 20 }}>🚨 No category found for { c }</div>
                    }
                    const Icon = iconMap[ c ];
                    return (
                        <a key={ c } href={ `/posts?categories=${ c }` }>
                            <div className="category-tag">
                                <span className="category-icon"><Icon /></span>
                                <span className="category-label">{ c }</span>
                            </div>
                        </a>
                    )
                })
            }
        </div>
    )

}