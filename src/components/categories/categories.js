import Link from "next/link";
import iconMap from "./icon-map";

export default function Categories( { categories, selectedCategories = [] } ) {

    return (
        <div className="categories">
            {
                categories.map( c => {
                    if( !iconMap[ c ] ) {
                        return <div key={ c } style={ { background: 'red', padding: 20 }}>🚨 No category found for { c }</div>
                    }
                    const Icon = iconMap[ c ];
                    const linkCategories = selectedCategories.includes( c ) ? selectedCategories.filter( sc => sc !== c ) : [ ...selectedCategories, c ];
                    return (
                        <Link key={ c } href={ `/posts?categories=${ linkCategories.join( ',' ) }` } className={ selectedCategories.includes( c ) ? "category-active" : "" }>
                            <div className="category-tag">
                                <span className="category-icon"><Icon /></span>
                                <span className="category-label">{ c }</span>
                            </div>
                        </Link>
                    )
                })
            }
        </div>
    )

}