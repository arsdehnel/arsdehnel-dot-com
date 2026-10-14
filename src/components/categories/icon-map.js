import { FaPodcast } from 'react-icons/fa6';
import { GiWoodBeam } from 'react-icons/gi';
import { GrCloudComputer, GrUserWorker } from 'react-icons/gr';
import { IoAtSharp } from 'react-icons/io5';
import { LuBookOpenText, LuCodeXml, LuTentTree } from 'react-icons/lu';
import { MdChildCare } from 'react-icons/md';
import RwsdkIcon from '../icons/rwsdk.js';
import categoryKeys from './category-keys.js';

const icons = {
	'at-protocol': IoAtSharp,
	book: LuBookOpenText,
	camping: LuTentTree,
	career: GrUserWorker,
	'cloud tech': GrCloudComputer,
	development: LuCodeXml,
	podcast: FaPodcast,
	redwoodsdk: RwsdkIcon,
	'self-care': MdChildCare,
	wood: GiWoodBeam,
};

export default Object.fromEntries(categoryKeys.map((k) => [k, icons[k]]));
