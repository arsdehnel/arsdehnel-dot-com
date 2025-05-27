import { BiBlock } from "react-icons/bi";
import { GiWoodBeam } from "react-icons/gi";
import { GrCloudComputer } from "react-icons/gr";
import { LuBookOpenText, LuCodeXml, LuTentTree } from "react-icons/lu";

const iconMap = {
    'book': LuBookOpenText,
    'camping': LuTentTree,
    'cloud tech': GrCloudComputer,
    'development': LuCodeXml,
    'wood': GiWoodBeam,
}

export default function Categories( { categories } ) {

    return (
        <div className="categories">
            {
                categories.map( c => {
                    const Icon = iconMap[ c ] || BiBlock;
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