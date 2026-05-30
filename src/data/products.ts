
import p1 from '@/assets/products/p1-space-wolves.jpg';
import p2 from '@/assets/products/p2-heavy-intercessors.jpg';
import p3 from '@/assets/products/p3-triarch-stalker.jpg';
import p4 from '@/assets/products/p4-custodian-wardens.jpg';
import p5 from '@/assets/products/p5-freeguild-fusiliers.jpg';
import p6 from '@/assets/products/p6-lord-celestant.jpg';
import p7 from '@/assets/products/p7-kroxigor.jpg';
import p8 from '@/assets/products/p8-wight-king.jpg';
import p9 from '@/assets/products/p9-veteran-guardsmen.jpg';
import p10 from '@/assets/products/p10-gallowfall.jpg';
import p11 from '@/assets/products/p11-hand-archon.jpg';
import p12 from '@/assets/products/p12-kommandos.jpg';

export type Category = 'warhammer40k' | 'ageofsigmar' | 'killteam';

export interface Product {
  id: number;
  name: string;
  nameEn: string;
  price: number;
  category: Category;
  imageUrl: string;
  description: string[];
  descriptionEn: string[];
  material: string;
  type: string;
  stock: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: '(GW) SPACE WOLVES HOUNDS OF MORKAI',
    nameEn: '(GW) SPACE WOLVES HOUNDS OF MORKAI',
    price: 1527,
    category: 'warhammer40k',
    imageUrl: p1,
    description: [
      'กลุ่ม Space Wolves ที่ดุดันและน่าเกรงขาม',
      'ประกอบด้วยมินิเจอร์คุณภาพสูง 10 ตัว',
      'ประเภท: Elite Infantry สำหรับ Warhammer 40,000',
      'เหมาะสำหรับผู้เล่น Space Wolves',
    ],
    descriptionEn: [
      'Ferocious Space Wolves elite unit',
      'Contains 10 high-quality miniatures',
      'Type: Elite Infantry for Warhammer 40,000',
      'Perfect for Space Wolves players',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 5,
  },
  {
    id: 2,
    name: '(GW) SPACE MARINES HEAVY INTERCESSORS',
    nameEn: '(GW) SPACE MARINES HEAVY INTERCESSORS',
    price: 2450,
    category: 'warhammer40k',
    imageUrl: p2,
    description: [
      'ในตระกูล Warhammer Space Marine',
      'ระยะเลือก: ปรับปรุงคุณภาพมินิเจอร์ได้หลายรูปแบบ',
      'ประเภท: Tactical, Assault, Devastator, Terminator และอื่นๆ',
      'เหมาะสำหรับ Warhammer 40,000 และการสร้างสรรค์',
    ],
    descriptionEn: [
      'From the Warhammer Space Marine line',
      'Contains 5 heavily armored marines',
      'Type: Troops for Warhammer 40,000',
      'Best for beginners and veterans alike',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 3,
  },
  {
    id: 3,
    name: '(GW) NECRONS: TRIARCH STALKER',
    nameEn: '(GW) NECRONS: TRIARCH STALKER',
    price: 2300,
    category: 'warhammer40k',
    imageUrl: p3,
    description: [
      'หุ่นยนต์ขนาดยักษ์ของ Necrons',
      'มีอาวุธหลายรูปแบบให้เลือกสร้าง',
      'ประเภท: Heavy Support สำหรับ Necrons',
      'เหมาะสำหรับผู้เล่น Necrons ทุกระดับ',
    ],
    descriptionEn: [
      'Giant Necron war machine',
      'Multiple weapon options to build',
      'Type: Heavy Support for Necrons',
      'Suitable for all Necron players',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 8,
  },
  {
    id: 4,
    name: '(BSF) ADEPTUS CUSTODES: CUSTODIAN WARDENS',
    nameEn: '(BSF) ADEPTUS CUSTODES: CUSTODIAN WARDENS',
    price: 2300,
    category: 'warhammer40k',
    imageUrl: p4,
    description: [
      'นักรบชั้นยอดของจักรพรรดิ',
      'ชุดประกอบ 5 ตัว พร้อมอาวุธหลากหลาย',
      'ประเภท: Elite Infantry สำหรับ Adeptus Custodes',
      'เหมาะสำหรับกองทัพ Custodes',
    ],
    descriptionEn: [
      'Elite warriors of the Emperor',
      '5-model kit with multiple weapon options',
      'Type: Elite Infantry for Adeptus Custodes',
      'Perfect for Custodes armies',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 6,
  },
  {
    id: 5,
    name: '(GW) CITIES OF SIGMAR: FREEGUILD FUSILIERS',
    nameEn: '(GW) CITIES OF SIGMAR: FREEGUILD FUSILIERS',
    price: 2150,
    category: 'ageofsigmar',
    imageUrl: p5,
    description: [
      'ทหารปืนไฟแห่ง Cities of Sigmar',
      'ชุดประกอบ 10 ตัว พร้อมอุปกรณ์ครบ',
      'ประเภท: Troops สำหรับ Age of Sigmar',
    ],
    descriptionEn: [
      'Gunpowder troops of Cities of Sigmar',
      '10-model kit with full accessories',
      'Type: Troops for Age of Sigmar',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 4,
  },
  {
    id: 6,
    name: '(GW) S/ETERNALS: LORD CELESTANT ON STARDRAKE',
    nameEn: '(GW) S/ETERNALS: LORD CELESTANT ON STARDRAKE',
    price: 6300,
    category: 'ageofsigmar',
    imageUrl: p6,
    description: [
      'โมเดลขนาดใหญ่อลังการ Lord Celestant บนมังกร Stardrake',
      'ชุดประกอบขนาดใหญ่ รายละเอียดสวยงามมาก',
      'ประเภท: Monster Hero สำหรับ Stormcast Eternals',
    ],
    descriptionEn: [
      'Massive model of Lord Celestant on Stardrake dragon',
      'Large assembly kit with incredible detail',
      'Type: Monster Hero for Stormcast Eternals',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 2,
  },
  {
    id: 7,
    name: '(GW) SERAPHON: KROXIGOR',
    nameEn: '(GW) SERAPHON: KROXIGOR',
    price: 2300,
    category: 'ageofsigmar',
    imageUrl: p7,
    description: [
      'สัตว์ประหลาดขนาดใหญ่แห่ง Seraphon',
      'ชุดประกอบ 3 ตัว ดูน่าเกรงขาม',
      'ประเภท: Battleline สำหรับ Seraphon',
    ],
    descriptionEn: [
      'Large monsters of the Seraphon',
      '3-model kit, imposing appearance',
      'Type: Battleline for Seraphon',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 7,
  },
  {
    id: 8,
    name: '(GW) DEATHRATTLE WIGHT KING',
    nameEn: '(GW) DEATHRATTLE WIGHT KING',
    price: 750,
    category: 'ageofsigmar',
    imageUrl: p8,
    description: [
      'ผู้นำแห่งกองทัพผี Deathrattle',
      'โมเดลเดี่ยว รายละเอียดสวยงาม',
      'ประเภท: Hero สำหรับ Legions of Nagash',
    ],
    descriptionEn: [
      'Leader of the Deathrattle undead army',
      'Single model with fine details',
      'Type: Hero for Legions of Nagash',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'มินิเจอร์สำหรับวาดสี',
    stock: 10,
  },
  {
    id: 9,
    name: '(GW) KILL TEAM: VETERAN GUARDSMEN',
    nameEn: '(GW) KILL TEAM: VETERAN GUARDSMEN',
    price: 2300,
    category: 'killteam',
    imageUrl: p9,
    description: [
      'ทหารผ่านศึกแห่งกองทัพ Astra Militarum',
      'ชุดประกอบ Kill Team พร้อมอุปกรณ์ครบ',
      'ประเภท: Kill Team สำหรับ Astra Militarum',
    ],
    descriptionEn: [
      'Battle-hardened veterans of the Astra Militarum',
      'Complete Kill Team kit',
      'Type: Kill Team for Astra Militarum',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'Kill Team มินิเจอร์สำหรับวาดสี',
    stock: 5,
  },
  {
    id: 10,
    name: '(GW) KILL TEAM: GALLOWFALL',
    nameEn: '(GW) KILL TEAM: GALLOWFALL',
    price: 6050,
    category: 'killteam',
    imageUrl: p10,
    description: [
      'ชุดเกม Kill Team สมบูรณ์แบบพร้อม 2 กองทัพ',
      'รวม terrain และ accessories ครบชุด',
      'ประเภท: Starter Set สำหรับ Kill Team',
    ],
    descriptionEn: [
      'Complete Kill Team box with 2 armies',
      'Includes terrain and full accessories',
      'Type: Starter Set for Kill Team',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'Kill Team ชุดสตาร์ทเตอร์',
    stock: 3,
  },
  {
    id: 11,
    name: '(GW) KILL TEAM: HAND OF THE ARCHON',
    nameEn: '(GW) KILL TEAM: HAND OF THE ARCHON',
    price: 1950,
    category: 'killteam',
    imageUrl: p11,
    description: [
      'กองทัพ Drukhari สำหรับ Kill Team',
      'มินิเจอร์ดุดัน รายละเอียดสวยงาม',
      'ประเภท: Kill Team สำหรับ Drukhari',
    ],
    descriptionEn: [
      'Drukhari warband for Kill Team',
      'Fierce miniatures with great detail',
      'Type: Kill Team for Drukhari',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'Kill Team มินิเจอร์สำหรับวาดสี',
    stock: 6,
  },
  {
    id: 12,
    name: '(GW) KILL TEAM: KOMMANDOS',
    nameEn: '(GW) KILL TEAM: KOMMANDOS',
    price: 2450,
    category: 'killteam',
    imageUrl: p12,
    description: [
      'หน่วย Ork Kommandos สำหรับ Kill Team',
      'มินิเจอร์สุดฮา ดุดัน พร้อมอาวุธหนัก',
      'ประเภท: Kill Team สำหรับ Orks',
    ],
    descriptionEn: [
      'Ork Kommandos unit for Kill Team',
      'Characterful, fierce models with heavy weapons',
      'Type: Kill Team for Orks',
    ],
    material: 'พลาสติกคุณภาพสูง (Citadel Plastic)',
    type: 'Kill Team มินิเจอร์สำหรับวาดสี',
    stock: 4,
  },
];

export const categoryLabels: Record<Category, { th: string; en: string }> = {
  warhammer40k: { th: 'Warhammer 40,000', en: 'Warhammer 40,000' },
  ageofsigmar: { th: 'Age of Sigmar', en: 'Age of Sigmar' },
  killteam: { th: 'Kill Team', en: 'Kill Team' },
};
