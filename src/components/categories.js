import { BiBlock } from "react-icons/bi";
import { GiWoodBeam } from "react-icons/gi";
import { LuTentTree } from "react-icons/lu";
import { GrCloudComputer } from "react-icons/gr";

export default function Categories( { categories } ) {

    return (
        <div className="categories">
            {
                categories.map( c => {
                    let Icon;
                    switch( c ) {
                        case 'wood':
                            Icon = GiWoodBeam
                            break;
                        case 'camping':
                            Icon = LuTentTree
                            break;
                        case 'cloud tech':
                            Icon = GrCloudComputer
                            break;
                        default:
                            Icon = BiBlock
                            break;
                    }
                    return (
                        <div className="category-tag">
                            <span className="category-icon"><Icon /></span>
                            <span className="category-label">{ c }</span>
                        </div>
                    )
                })
            }
        </div>
    )

}