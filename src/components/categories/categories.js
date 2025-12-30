import iconMap from "./icon-map";

export default function Categories( { categories } ) {

    return (
        <div className="categories">
            {
                categories.map( c => {
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