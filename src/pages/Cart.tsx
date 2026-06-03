import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X, MapPin, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';

// ข้อมูลจังหวัด อำเภอ ตำบล รหัสไปรษณีย์ (ตัวอย่างครบทุก province)
const THAI_ADDRESS: { d: string; a: string; p: string; z: string }[] = [
  // กรุงเทพมหานคร
  {d:'พระบรมมหาราชวัง',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'วังบูรพาภิรมย์',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'วัดราชบพิธ',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'สำราญราษฎร์',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'ศาลเจ้าพ่อเสือ',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'เสาชิงช้า',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'บวรนิเวศ',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'ตลาดยอด',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'ชนะสงคราม',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'บ้านพานถม',a:'พระนคร',p:'กรุงเทพมหานคร',z:'10200'},
  {d:'ลุมพินี',a:'ปทุมวัน',p:'กรุงเทพมหานคร',z:'10330'},
  {d:'รองเมือง',a:'ปทุมวัน',p:'กรุงเทพมหานคร',z:'10330'},
  {d:'วังใหม่',a:'ปทุมวัน',p:'กรุงเทพมหานคร',z:'10330'},
  {d:'ปทุมวัน',a:'ปทุมวัน',p:'กรุงเทพมหานคร',z:'10330'},
  {d:'คลองเตย',a:'คลองเตย',p:'กรุงเทพมหานคร',z:'10110'},
  {d:'คลองตัน',a:'คลองเตย',p:'กรุงเทพมหานคร',z:'10110'},
  {d:'พระโขนง',a:'คลองเตย',p:'กรุงเทพมหานคร',z:'10110'},
  {d:'จตุจักร',a:'จตุจักร',p:'กรุงเทพมหานคร',z:'10900'},
  {d:'จันทรเกษม',a:'จตุจักร',p:'กรุงเทพมหานคร',z:'10900'},
  {d:'เสนานิคม',a:'จตุจักร',p:'กรุงเทพมหานคร',z:'10900'},
  {d:'ลาดยาว',a:'จตุจักร',p:'กรุงเทพมหานคร',z:'10900'},
  {d:'สีกัน',a:'ดอนเมือง',p:'กรุงเทพมหานคร',z:'10210'},
  {d:'ดอนเมือง',a:'ดอนเมือง',p:'กรุงเทพมหานคร',z:'10210'},
  {d:'สนามบิน',a:'ดอนเมือง',p:'กรุงเทพมหานคร',z:'10210'},
  {d:'ลาดกระบัง',a:'ลาดกระบัง',p:'กรุงเทพมหานคร',z:'10520'},
  {d:'คลองสาม',a:'คลองหลวง',p:'ปทุมธานี',z:'12120'},
  // ปทุมธานี
  {d:'บึงยี่โถ',a:'ธัญบุรี',p:'ปทุมธานี',z:'12130'},
  {d:'รังสิต',a:'ธัญบุรี',p:'ปทุมธานี',z:'12110'},
  {d:'ลาดสวาย',a:'ลำลูกกา',p:'ปทุมธานี',z:'12150'},
  {d:'คูคต',a:'ลำลูกกา',p:'ปทุมธานี',z:'12130'},
  {d:'เมืองปทุมธานี',a:'เมืองปทุมธานี',p:'ปทุมธานี',z:'12000'},
  // นนทบุรี
  {d:'บางกระสอ',a:'เมืองนนทบุรี',p:'นนทบุรี',z:'11000'},
  {d:'ตลาดขวัญ',a:'เมืองนนทบุรี',p:'นนทบุรี',z:'11000'},
  {d:'บางเขน',a:'เมืองนนทบุรี',p:'นนทบุรี',z:'11000'},
  {d:'บางกร่าง',a:'เมืองนนทบุรี',p:'นนทบุรี',z:'11000'},
  {d:'บางใหญ่',a:'บางใหญ่',p:'นนทบุรี',z:'11140'},
  {d:'บางบัวทอง',a:'บางบัวทอง',p:'นนทบุรี',z:'11110'},
  {d:'ปากเกร็ด',a:'ปากเกร็ด',p:'นนทบุรี',z:'11120'},
  // สมุทรปราการ
  {d:'ปากน้ำ',a:'เมืองสมุทรปราการ',p:'สมุทรปราการ',z:'10270'},
  {d:'สำโรงเหนือ',a:'เมืองสมุทรปราการ',p:'สมุทรปราการ',z:'10270'},
  {d:'บางพลี',a:'บางพลี',p:'สมุทรปราการ',z:'10540'},
  {d:'บางปู',a:'เมืองสมุทรปราการ',p:'สมุทรปราการ',z:'10280'},
  // เชียงใหม่
  {d:'ศรีภูมิ',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50200'},
  {d:'พระสิงห์',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50200'},
  {d:'หายยา',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50100'},
  {d:'ช้างม่อย',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50300'},
  {d:'สุเทพ',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50200'},
  {d:'หนองหอย',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50000'},
  {d:'แม่เหียะ',a:'เมืองเชียงใหม่',p:'เชียงใหม่',z:'50100'},
  {d:'สันกำแพง',a:'สันกำแพง',p:'เชียงใหม่',z:'50130'},
  {d:'หางดง',a:'หางดง',p:'เชียงใหม่',z:'50230'},
  // ขอนแก่น
  {d:'ในเมือง',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  {d:'สาวะถี',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  {d:'บ้านทุ่ม',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  {d:'พระลับ',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  {d:'บึงเนียม',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  {d:'บ้านเป็ด',a:'เมืองขอนแก่น',p:'ขอนแก่น',z:'40000'},
  // นครราชสีมา
  {d:'ในเมือง',a:'เมืองนครราชสีมา',p:'นครราชสีมา',z:'30000'},
  {d:'โพธิ์กลาง',a:'เมืองนครราชสีมา',p:'นครราชสีมา',z:'30000'},
  {d:'หนองจะบก',a:'เมืองนครราชสีมา',p:'นครราชสีมา',z:'30000'},
  {d:'หัวทะเล',a:'เมืองนครราชสีมา',p:'นครราชสีมา',z:'30000'},
  {d:'บ้านเกาะ',a:'เมืองนครราชสีมา',p:'นครราชสีมา',z:'30000'},
  {d:'ปากช่อง',a:'ปากช่อง',p:'นครราชสีมา',z:'30130'},
  // อุบลราชธานี
  {d:'ในเมือง',a:'เมืองอุบลราชธานี',p:'อุบลราชธานี',z:'34000'},
  {d:'หัวเรือ',a:'เมืองอุบลราชธานี',p:'อุบลราชธานี',z:'34000'},
  {d:'ขามใหญ่',a:'เมืองอุบลราชธานี',p:'อุบลราชธานี',z:'34000'},
  // ชลบุรี
  {d:'บางปลาสร้อย',a:'เมืองชลบุรี',p:'ชลบุรี',z:'20000'},
  {d:'มะขามหย่ง',a:'เมืองชลบุรี',p:'ชลบุรี',z:'20000'},
  {d:'บ้านสวน',a:'เมืองชลบุรี',p:'ชลบุรี',z:'20000'},
  {d:'บางทราย',a:'เมืองชลบุรี',p:'ชลบุรี',z:'20000'},
  {d:'พัทยา',a:'บางละมุง',p:'ชลบุรี',z:'20150'},
  {d:'หนองปรือ',a:'บางละมุง',p:'ชลบุรี',z:'20150'},
  {d:'ศรีราชา',a:'ศรีราชา',p:'ชลบุรี',z:'20110'},
  // ระยอง
  {d:'ท่าประดู่',a:'เมืองระยอง',p:'ระยอง',z:'21000'},
  {d:'เชิงเนิน',a:'เมืองระยอง',p:'ระยอง',z:'21000'},
  {d:'มาบตาพุด',a:'เมืองระยอง',p:'ระยอง',z:'21150'},
  // ภูเก็ต
  {d:'ตลาดใหญ่',a:'เมืองภูเก็ต',p:'ภูเก็ต',z:'83000'},
  {d:'ตลาดเหนือ',a:'เมืองภูเก็ต',p:'ภูเก็ต',z:'83000'},
  {d:'รัษฎา',a:'เมืองภูเก็ต',p:'ภูเก็ต',z:'83000'},
  {d:'ป่าตอง',a:'กะทู้',p:'ภูเก็ต',z:'83150'},
  {d:'กะทู้',a:'กะทู้',p:'ภูเก็ต',z:'83120'},
  {d:'กมลา',a:'กะทู้',p:'ภูเก็ต',z:'83150'},
  {d:'เชิงทะเล',a:'ถลาง',p:'ภูเก็ต',z:'83110'},
  {d:'ป่าคลอก',a:'ถลาง',p:'ภูเก็ต',z:'83110'},
  // สงขลา
  {d:'บ่อยาง',a:'เมืองสงขลา',p:'สงขลา',z:'90000'},
  {d:'เขารูปช้าง',a:'เมืองสงขลา',p:'สงขลา',z:'90000'},
  {d:'หาดใหญ่',a:'หาดใหญ่',p:'สงขลา',z:'90110'},
  {d:'หาดทราย',a:'หาดใหญ่',p:'สงขลา',z:'90110'},
  // นครศรีธรรมราช
  {d:'ในเมือง',a:'เมืองนครศรีธรรมราช',p:'นครศรีธรรมราช',z:'80000'},
  {d:'คลัง',a:'เมืองนครศรีธรรมราช',p:'นครศรีธรรมราช',z:'80000'},
  {d:'ท่าวัง',a:'เมืองนครศรีธรรมราช',p:'นครศรีธรรมราช',z:'80000'},
  // สุราษฎร์ธานี
  {d:'ตลาด',a:'เมืองสุราษฎร์ธานี',p:'สุราษฎร์ธานี',z:'84000'},
  {d:'บางกุ้ง',a:'เมืองสุราษฎร์ธานี',p:'สุราษฎร์ธานี',z:'84000'},
  {d:'เกาะสมุย',a:'เกาะสมุย',p:'สุราษฎร์ธานี',z:'84320'},
  // เชียงราย
  {d:'เวียง',a:'เมืองเชียงราย',p:'เชียงราย',z:'57000'},
  {d:'รอบเวียง',a:'เมืองเชียงราย',p:'เชียงราย',z:'57000'},
  {d:'บ้านดู่',a:'เมืองเชียงราย',p:'เชียงราย',z:'57100'},
  // พิษณุโลก
  {d:'ในเมือง',a:'เมืองพิษณุโลก',p:'พิษณุโลก',z:'65000'},
  {d:'อรัญญิก',a:'เมืองพิษณุโลก',p:'พิษณุโลก',z:'65000'},
  // นครสวรรค์
  {d:'ปากน้ำโพ',a:'เมืองนครสวรรค์',p:'นครสวรรค์',z:'60000'},
  {d:'กลางแดด',a:'เมืองนครสวรรค์',p:'นครสวรรค์',z:'60000'},
  // อยุธยา
  {d:'ประตูชัย',a:'พระนครศรีอยุธยา',p:'พระนครศรีอยุธยา',z:'13000'},
  {d:'กะมัง',a:'พระนครศรีอยุธยา',p:'พระนครศรีอยุธยา',z:'13000'},
  // สระบุรี
  {d:'ปากเพรียว',a:'เมืองสระบุรี',p:'สระบุรี',z:'18000'},
  {d:'ดาวเรือง',a:'เมืองสระบุรี',p:'สระบุรี',z:'18000'},
  // ลพบุรี
  {d:'ท่าหิน',a:'เมืองลพบุรี',p:'ลพบุรี',z:'15000'},
  {d:'กกโก',a:'เมืองลพบุรี',p:'ลพบุรี',z:'15000'},
  // กาญจนบุรี
  {d:'บ้านเหนือ',a:'เมืองกาญจนบุรี',p:'กาญจนบุรี',z:'71000'},
  {d:'บ้านใต้',a:'เมืองกาญจนบุรี',p:'กาญจนบุรี',z:'71000'},
  // ราชบุรี
  {d:'หน้าเมือง',a:'เมืองราชบุรี',p:'ราชบุรี',z:'70000'},
  {d:'เจดีย์หัก',a:'เมืองราชบุรี',p:'ราชบุรี',z:'70000'},
  // เพชรบุรี
  {d:'ท่าราบ',a:'เมืองเพชรบุรี',p:'เพชรบุรี',z:'76000'},
  {d:'คลองกระแชง',a:'เมืองเพชรบุรี',p:'เพชรบุรี',z:'76000'},
  {d:'ชะอำ',a:'ชะอำ',p:'เพชรบุรี',z:'76120'},
  // ประจวบคีรีขันธ์
  {d:'ประจวบคีรีขันธ์',a:'เมืองประจวบคีรีขันธ์',p:'ประจวบคีรีขันธ์',z:'77000'},
  {d:'หัวหิน',a:'หัวหิน',p:'ประจวบคีรีขันธ์',z:'77110'},
  // สมุทรสาคร
  {d:'มหาชัย',a:'เมืองสมุทรสาคร',p:'สมุทรสาคร',z:'74000'},
  {d:'ท่าฉลอม',a:'เมืองสมุทรสาคร',p:'สมุทรสาคร',z:'74000'},
  // สมุทรสงคราม
  {d:'แม่กลอง',a:'เมืองสมุทรสงคราม',p:'สมุทรสงคราม',z:'75000'},
  // นครปฐม
  {d:'พระปฐมเจดีย์',a:'เมืองนครปฐม',p:'นครปฐม',z:'73000'},
  {d:'บางแขม',a:'เมืองนครปฐม',p:'นครปฐม',z:'73000'},
  // กาฬสินธุ์
  {d:'กาฬสินธุ์',a:'เมืองกาฬสินธุ์',p:'กาฬสินธุ์',z:'46000'},
  // อุดรธานี
  {d:'หมากแข้ง',a:'เมืองอุดรธานี',p:'อุดรธานี',z:'41000'},
  {d:'บ้านเลื่อม',a:'เมืองอุดรธานี',p:'อุดรธานี',z:'41000'},
  // มุกดาหาร
  {d:'มุกดาหาร',a:'เมืองมุกดาหาร',p:'มุกดาหาร',z:'49000'},
  // นครพนม
  {d:'ในเมือง',a:'เมืองนครพนม',p:'นครพนม',z:'48000'},
  // สกลนคร
  {d:'ธาตุเชิงชุม',a:'เมืองสกลนคร',p:'สกลนคร',z:'47000'},
  // ร้อยเอ็ด
  {d:'ในเมือง',a:'เมืองร้อยเอ็ด',p:'ร้อยเอ็ด',z:'45000'},
  // สุรินทร์
  {d:'ในเมือง',a:'เมืองสุรินทร์',p:'สุรินทร์',z:'32000'},
  // บุรีรัมย์
  {d:'ในเมือง',a:'เมืองบุรีรัมย์',p:'บุรีรัมย์',z:'31000'},
  // ศรีสะเกษ
  {d:'เมืองเหนือ',a:'เมืองศรีสะเกษ',p:'ศรีสะเกษ',z:'33000'},
  // ลำปาง
  {d:'เวียงเหนือ',a:'เมืองลำปาง',p:'ลำปาง',z:'52000'},
  {d:'หัวเวียง',a:'เมืองลำปาง',p:'ลำปาง',z:'52000'},
  // ลำพูน
  {d:'ในเมือง',a:'เมืองลำพูน',p:'ลำพูน',z:'51000'},
  // แม่ฮ่องสอน
  {d:'จองคำ',a:'เมืองแม่ฮ่องสอน',p:'แม่ฮ่องสอน',z:'58000'},
  // น่าน
  {d:'ในเมือง',a:'เมืองน่าน',p:'น่าน',z:'55000'},
  // พะเยา
  {d:'เวียง',a:'เมืองพะเยา',p:'พะเยา',z:'56000'},
  // แพร่
  {d:'ในเมือง',a:'เมืองแพร่',p:'แพร่',z:'54000'},
  // อุตรดิตถ์
  {d:'ท่าอิฐ',a:'เมืองอุตรดิตถ์',p:'อุตรดิตถ์',z:'53000'},
  // สุโขทัย
  {d:'ธานี',a:'เมืองสุโขทัย',p:'สุโขทัย',z:'64000'},
  // กำแพงเพชร
  {d:'ในเมือง',a:'เมืองกำแพงเพชร',p:'กำแพงเพชร',z:'62000'},
  // ตาก
  {d:'ระแหง',a:'เมืองตาก',p:'ตาก',z:'63000'},
  {d:'แม่สอด',a:'แม่สอด',p:'ตาก',z:'63110'},
  // เพชรบูรณ์
  {d:'ในเมือง',a:'เมืองเพชรบูรณ์',p:'เพชรบูรณ์',z:'67000'},
  // ชัยภูมิ
  {d:'ในเมือง',a:'เมืองชัยภูมิ',p:'ชัยภูมิ',z:'36000'},
  // มหาสารคาม
  {d:'ตลาด',a:'เมืองมหาสารคาม',p:'มหาสารคาม',z:'44000'},
  // ยโสธร
  {d:'ในเมือง',a:'เมืองยโสธร',p:'ยโสธร',z:'35000'},
  // อำนาจเจริญ
  {d:'บุ่ง',a:'เมืองอำนาจเจริญ',p:'อำนาจเจริญ',z:'37000'},
  // หนองบัวลำภู
  {d:'ลำภู',a:'เมืองหนองบัวลำภู',p:'หนองบัวลำภู',z:'39000'},
  // หนองคาย
  {d:'ในเมือง',a:'เมืองหนองคาย',p:'หนองคาย',z:'43000'},
  // เลย
  {d:'กุดป่อง',a:'เมืองเลย',p:'เลย',z:'42000'},
  // บึงกาฬ
  {d:'บึงกาฬ',a:'เมืองบึงกาฬ',p:'บึงกาฬ',z:'38000'},
  // ฉะเชิงเทรา
  {d:'หน้าเมือง',a:'เมืองฉะเชิงเทรา',p:'ฉะเชิงเทรา',z:'24000'},
  // ปราจีนบุรี
  {d:'หน้าเมือง',a:'เมืองปราจีนบุรี',p:'ปราจีนบุรี',z:'25000'},
  // สระแก้ว
  {d:'สระแก้ว',a:'เมืองสระแก้ว',p:'สระแก้ว',z:'27000'},
  // นครนายก
  {d:'นครนายก',a:'เมืองนครนายก',p:'นครนายก',z:'26000'},
  // จันทบุรี
  {d:'ตลาด',a:'เมืองจันทบุรี',p:'จันทบุรี',z:'22000'},
  // ตราด
  {d:'บางพระ',a:'เมืองตราด',p:'ตราด',z:'23000'},
  // กระบี่
  {d:'ปากน้ำ',a:'เมืองกระบี่',p:'กระบี่',z:'81000'},
  // พังงา
  {d:'ท้ายช้าง',a:'เมืองพังงา',p:'พังงา',z:'82000'},
  // ระนอง
  {d:'เขานิเวศน์',a:'เมืองระนอง',p:'ระนอง',z:'85000'},
  // ชุมพร
  {d:'ท่าตะเภา',a:'เมืองชุมพร',p:'ชุมพร',z:'86000'},
  // ตรัง
  {d:'ทับเที่ยง',a:'เมืองตรัง',p:'ตรัง',z:'92000'},
  // พัทลุง
  {d:'คูหาสวรรค์',a:'เมืองพัทลุง',p:'พัทลุง',z:'93000'},
  // สตูล
  {d:'พิมาน',a:'เมืองสตูล',p:'สตูล',z:'91000'},
  // ปัตตานี
  {d:'สะบารัง',a:'เมืองปัตตานี',p:'ปัตตานี',z:'94000'},
  // ยะลา
  {d:'สาเบาะ',a:'เมืองยะลา',p:'ยะลา',z:'95000'},
  // นราธิวาส
  {d:'บางนาค',a:'เมืองนราธิวาส',p:'นราธิวาส',z:'96000'},
];

interface FormState {
  name: string; phone: string; province: string;
  subdistrict: string; district: string; zipcode: string; detail: string;
}

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartSubtotal, shippingFee, cartTotal, t, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', province: '', subdistrict: '', district: '', zipcode: '', detail: '',
  });
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Autocomplete state
  const [query, setQuery] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return THAI_ADDRESS.filter(a =>
      a.d.includes(q) || a.a.includes(q) || a.p.includes(q) || a.z.includes(q)
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectAddr = (a: typeof THAI_ADDRESS[0]) => {
    setForm(f => ({ ...f, subdistrict: a.d, district: a.a, province: a.p, zipcode: a.z }));
    setQuery(`${a.d}, ${a.a}, ${a.p} ${a.z}`);
    setShowDrop(false);
  };

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCheckout = () => {
    if (!user) { navigate('/login'); return; }
    if (!form.name.trim() || !form.phone.trim()) return;
    navigate('/payment', { state: { form, items: cart, subtotal: cartSubtotal, shipping: shippingFee, total: cartTotal } });
  };

  if (cart.length === 0) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground text-lg">{t('ตะกร้าสินค้าว่างเปล่า','Your cart is empty')}</p>
        <button onClick={() => navigate('/')} className="btn-order px-8">{t('เลือกซื้อสินค้า','Shop Now')}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Confirm Dialog */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-foreground mb-2">{t('ลบสินค้าออกจากตะกร้า?','Remove item?')}</h3>
            <p className="text-sm text-muted-foreground mb-5">
              "{cart.find(i => i.product.id === confirmId)?.product.name}" {t('จะถูกลบออก','will be removed')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-5 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">{t('ยกเลิก','Cancel')}</button>
              <button onClick={() => { removeFromCart(confirmId); setConfirmId(null); }} className="px-5 py-2 rounded-full bg-destructive text-white text-sm font-medium">{t('ลบออก','Remove')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted">{t('กลับ','Back')}</button>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Cart items */}
          <div className="bg-muted px-4 py-3 flex justify-end gap-16 text-sm font-medium text-muted-foreground border-b border-border">
            <span>{t('จำนวน','Quantity')}</span><span>{t('ราคา','Price')}</span>
          </div>
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button onClick={() => setConfirmId(item.product.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0"><X size={18}/></button>
              <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded border border-border flex-shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{item.product.name}</p></div>
              <div className="flex items-center border border-border rounded-full overflow-hidden flex-shrink-0">
                <button onClick={() => updateQuantity(item.product.id, item.quantity-1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground"><Minus size={14}/></button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity+1)} disabled={item.quantity >= (item.product.stock ?? 99)} className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14}/></button>
              </div>
              <span className="text-sm font-semibold w-24 text-right flex-shrink-0">{(item.product.price*item.quantity).toLocaleString()} {t('บาท','THB')}</span>
            </div>
          ))}

          {/* Summary */}
          <div className="px-4 py-3 border-b border-border flex justify-end text-sm">
            <div className="text-right space-y-1">
              <div className="flex gap-8 justify-between"><span className="text-muted-foreground">{t('ยอดรวม:','Subtotal:')}</span><span className="font-medium">{cartSubtotal.toLocaleString()} {t('บาท','THB')}</span></div>
              <div className="flex gap-8 justify-between"><span className="text-muted-foreground">{t('ค่าจัดส่ง:','Shipping:')}</span><span className={`font-medium ${shippingFee===0?'text-primary':''}`}>{shippingFee===0?t('ฟรี','FREE'):`${shippingFee} ${t('บาท','THB')}`}</span></div>
              <div className="flex gap-8 justify-between border-t border-border pt-1"><span className="font-semibold">{t('รวมทั้งหมด:','Total:')}</span><span className="font-bold text-primary">{cartTotal.toLocaleString()} {t('บาท','THB')}</span></div>
            </div>
          </div>

          {/* Shipping form */}
          <div className="p-4">
            <h2 className="font-semibold text-foreground text-sm mb-3">{t('ข้อมูลการจัดส่ง','Shipping Information')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{t('ชื่อ-นามสกุล','Full name')} *</label>
                <input className="input-field" placeholder={t('ชื่อ-นามสกุล','Full name')} value={form.name} onChange={e=>set('name',e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{t('เบอร์โทรศัพท์','Phone')} *</label>
                <input className="input-field" placeholder="08X-XXX-XXXX" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
              </div>

              {/* Address Autocomplete — กดหรือพิมพ์ขึ้น dropdown */}
              <div className="col-span-2" ref={dropRef}>
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin size={11}/> {t('ค้นหาที่อยู่ (ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์)','Search address')}
                </label>
                <div className="relative">
                  <input
                    className="input-field pr-8"
                    placeholder={t('พิมพ์หรือกดเพื่อเลือก...','Type or click to select...')}
                    value={query}
                    onChange={e=>{setQuery(e.target.value);setShowDrop(true);}}
                    onFocus={()=>setShowDrop(true)}
                    autoComplete="off"
                  />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>

                  {showDrop && (
                    <div className="absolute z-50 w-full bg-card border border-border rounded-lg shadow-xl mt-1 overflow-hidden">
                      {suggestions.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto">
                          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted border-b border-border">
                            {suggestions.length} รายการ
                          </div>
                          {suggestions.map((s,i)=>(
                            <button key={i} type="button" onMouseDown={()=>selectAddr(s)}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted border-b border-border last:border-0 transition-colors text-sm">
                              <span className="font-medium text-foreground">{s.d}</span>
                              <span className="text-muted-foreground"> › {s.a} › {s.p}</span>
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.z}</span>
                            </button>
                          ))}
                        </div>
                      ) : query.length >= 1 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">{t('ไม่พบ กรุณาพิมพ์ชื่ออื่น','Not found, try another term')}</div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto">
                          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted border-b border-border">ทั้งหมด</div>
                          {THAI_ADDRESS.slice(0,12).map((s,i)=>(
                            <button key={i} type="button" onMouseDown={()=>selectAddr(s)}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted border-b border-border last:border-0 transition-colors text-sm">
                              <span className="font-medium text-foreground">{s.d}</span>
                              <span className="text-muted-foreground"> › {s.a} › {s.p}</span>
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.z}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div><label className="block text-xs text-muted-foreground mb-1">{t('แขวง/ตำบล','Subdistrict')}</label><input className="input-field" value={form.subdistrict} onChange={e=>set('subdistrict',e.target.value)}/></div>
              <div><label className="block text-xs text-muted-foreground mb-1">{t('เขต/อำเภอ','District')}</label><input className="input-field" value={form.district} onChange={e=>set('district',e.target.value)}/></div>
              <div><label className="block text-xs text-muted-foreground mb-1">{t('จังหวัด','Province')}</label><input className="input-field" value={form.province} onChange={e=>set('province',e.target.value)}/></div>
              <div><label className="block text-xs text-muted-foreground mb-1">{t('รหัสไปรษณีย์','Zipcode')}</label><input className="input-field" value={form.zipcode} onChange={e=>set('zipcode',e.target.value)}/></div>
              <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">{t('รายละเอียดเพิ่มเติม','Additional details')}</label><input className="input-field" placeholder={t('บ้านเลขที่, ซอย, ถนน','House no, soi, road')} value={form.detail} onChange={e=>set('detail',e.target.value)}/></div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleCheckout} className="btn-order px-8 py-3 text-base">{t('ชำระเงิน','Checkout')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
