/**
 * Areas — the second level under a city.
 *
 * Until 17.11.2026 "area" was a free-text line. In Phuket alone that produced
 * 56 spellings across 101 profiles ("khatu", "chaloong,phuket", a full address
 * with postcode), and Google Translate turned ฉลอง (Chalong) into "celebrate".
 * Nobody could filter on it. These lists are what people click instead; the
 * free-text line stays as "Other" for whatever is missing.
 *
 * The lists are the names people actually typed (counted from the profiles),
 * not the administrative tree: nobody looking for a nanny says "Mueang Phuket",
 * they say Chalong or Rawai. A city without a list simply shows the text line.
 *
 * Row format: [slug, English, Thai, ...other spellings seen in the data].
 * Slugs are stored (CSV in `area_slugs`), so never rename one — add a new row.
 *
 * Pure data + pure functions, no imports: the mobile app copies this file.
 */

const RAW = {
  bangkok: [
    ['sukhumvit', 'Sukhumvit', 'สุขุมวิท', 'sukhumvit area', 'sukhumvit road', 'sukumvit', 'sukhumvite', 'sukhmvit', 'sukuhmvit', 'sukhumwit', 'sukuvit', 'sulhumvit', 'sukhumvit soi'],
    ['nana', 'Nana', 'นานา'],
    ['asok', 'Asok', 'อโศก', 'asoke', 'ashok'],
    ['phrom_phong', 'Phrom Phong', 'พร้อมพงษ์', 'prompong', 'phrom pong'],
    ['thonglor', 'Thonglor', 'ทองหล่อ', 'thong lor', 'thong lo', 'thonglo'],
    ['ekkamai', 'Ekkamai', 'เอกมัย', 'ekamai'],
    ['phra_khanong', 'Phra Khanong', 'พระโขนง', 'phrakanong', 'prakanong', 'phrakhanong'],
    ['on_nut', 'On Nut', 'อ่อนนุช', 'onnut', 'onut', 'on-nut'],
    ['udom_suk', 'Udom Suk', 'อุดมสุข', 'udomsuk'],
    ['bang_na', 'Bang Na', 'บางนา', 'bangna', 'bang na area'],
    ['bearing', 'Bearing', 'แบริ่ง', 'bering', 'bearing road'],
    ['khlong_toei', 'Khlong Toei', 'คลองเตย', 'klong toey', 'khlong toey', 'klongtoey', 'klong toei'],
    ['watthana', 'Watthana', 'วัฒนา', 'wattana'],
    ['silom', 'Silom', 'สีลม'],
    ['sathorn', 'Sathorn', 'สาทร', 'sathon', 'sathron', 'chong nonsi'],
    ['bang_rak', 'Bang Rak', 'บางรัก', 'bangrak'],
    ['siam', 'Siam / Pathum Wan', 'สยาม / ปทุมวัน', 'siam', 'pathum wan', 'pathumwan', 'chidlom', 'chitlom', 'pathuwan', 'lumphini', 'lumpini', 'witthayu', 'wireless road', 'central world', 'ploenchit', 'phloen chit'],
    ['ratchathewi', 'Ratchathewi', 'ราชเทวี', 'ratchatewi', 'pratunam', 'ratchathevi', 'ratchaprarop', 'rangnam', 'phathunam', 'pratu nam'],
    ['phaya_thai', 'Phaya Thai', 'พญาไท', 'phayathai', 'saphan kwai', 'saphan khwai'],
    ['ari', 'Ari', 'อารีย์', 'aree'],
    ['chatuchak', 'Chatuchak', 'จตุจักร', 'jatujak', 'chatuchalk'],
    ['lat_phrao', 'Lat Phrao', 'ลาดพร้าว', 'ladprao', 'lad prao', 'latphrao', 'lad phrao'],
    ['ratchada', 'Ratchada', 'รัชดา', 'ratchadaphisek', 'ratchadapisek', 'รัชดาภิเษก'],
    ['huai_khwang', 'Huai Khwang', 'ห้วยขวาง', 'huay kwang', 'huaykwang', 'huai kwang', 'huikhwamg', 'huay khwang'],
    ['din_daeng', 'Din Daeng', 'ดินแดง', 'dindaeng'],
    ['rama_9', 'Rama 9', 'พระราม 9', 'rama9', 'rama ix', 'พระราม9'],
    ['ramkhamhaeng', 'Ramkhamhaeng', 'รามคำแหง', 'ramkhamheang', 'ramkamhaeng', 'hua mak', 'rhamkhamhaeng', 'ramkhamhang'],
    ['bang_kapi', 'Bang Kapi', 'บางกะปิ', 'bangkapi'],
    ['wang_thonglang', 'Wang Thonglang', 'วังทองหลาง'],
    ['bueng_kum', 'Bueng Kum / Nawamin', 'บึงกุ่ม / นวมินทร์', 'bueng kum', 'nawamin', 'บึงกุ่ม', 'นวมินทร์'],
    ['ram_inthra', 'Ram Inthra', 'รามอินทรา', 'ramintra', 'ram intra', 'raminthra'],
    ['khan_na_yao', 'Khan Na Yao', 'คันนายาว'],
    ['saphan_sung', 'Saphan Sung', 'สะพานสูง'],
    ['min_buri', 'Min Buri', 'มีนบุรี', 'minburi'],
    ['khlong_sam_wa', 'Khlong Sam Wa', 'คลองสามวา'],
    ['nong_chok', 'Nong Chok', 'หนองจอก'],
    ['lat_krabang', 'Lat Krabang', 'ลาดกระบัง', 'latkrabang', 'ladkrabang', 'lad krabang', 'latkrang'],
    ['prawet', 'Prawet', 'ประเวศ'],
    ['suan_luang', 'Suan Luang / Phatthanakan', 'สวนหลวง / พัฒนาการ', 'suan luang', 'pattanakarn', 'phatthanakan', 'สวนหลวง', 'พัฒนาการ', 'saung luang'],
    ['srinakarin', 'Srinakarin', 'ศรีนครินทร์', 'sri nakarin', 'srinagarindra', 'srinakarin road'],
    ['bang_khen', 'Bang Khen', 'บางเขน', 'bangkhen', 'bangkaen'],
    ['lak_si', 'Lak Si / Chaeng Watthana', 'หลักสี่ / แจ้งวัฒนะ', 'lak si', 'laksi', 'chaeng watthana', 'chaengwattana', 'changwattana', 'หลักสี่', 'แจ้งวัฒนะ'],
    ['don_mueang', 'Don Mueang', 'ดอนเมือง', 'don muang', 'donmuang', 'don mueng', 'donmeung', 'don meaung'],
    ['sai_mai', 'Sai Mai', 'สายไหม'],
    ['bang_sue', 'Bang Sue', 'บางซื่อ', 'bangsue', 'bangsu'],
    ['dusit', 'Dusit', 'ดุสิต'],
    ['phra_nakhon', 'Old Town (Phra Nakhon)', 'พระนคร', 'phra nakhon', 'old town', 'rattanakosin', 'pranakron', 'phranakhon', 'grand palace', 'khao san', 'khaosan', 'khan san'],
    ['yaowarat', 'Yaowarat (Chinatown)', 'เยาวราช', 'yaowarat', 'chinatown', 'samphanthawong'],
    ['charoen_krung', 'Charoen Krung', 'เจริญกรุง', 'charoenkrung', 'chareonkrung', 'chareon krung'],
    ['bang_kho_laem', 'Bang Kho Laem', 'บางคอแหลม'],
    ['yan_nawa', 'Yan Nawa', 'ยานนาวา', 'yannawa', 'yanawa', 'nonsi'],
    ['rama_3', 'Rama 3', 'พระราม 3', 'rama3', 'rama iii', 'พระราม3'],
    ['rama_4', 'Rama 4', 'พระราม 4', 'rama4', 'rama iv', 'พระราม4'],
    ['rama_2', 'Rama 2', 'พระราม 2', 'rama2', 'rama ii', 'พระราม2'],
    ['thonburi', 'Thonburi', 'ธนบุรี', 'thonburi side', 'thon buri'],
    ['khlong_san', 'Khlong San', 'คลองสาน', 'klongsan', 'klong san', 'clongsan', 'charoen nakhon', 'icon siam', 'iconsiam'],
    ['bangkok_noi', 'Bangkok Noi', 'บางกอกน้อย', 'bangkoknoi'],
    ['bangkok_yai', 'Bangkok Yai', 'บางกอกใหญ่', 'bangkokyai', 'tha phra', 'thapra', 'itsaraphap', 'issaraphap', 'itsaraphab'],
    ['bang_phlat', 'Bang Phlat', 'บางพลัด', 'bangphlat', 'bangphat', 'bangphad'],
    ['pinklao', 'Pinklao', 'ปิ่นเกล้า', 'pin klao'],
    ['charansanitwong', 'Charansanitwong', 'จรัญสนิทวงศ์', 'charunsanitwong', 'charan sanitwong', 'charunsaniwong'],
    ['taling_chan', 'Taling Chan', 'ตลิ่งชัน', 'talingchan'],
    ['thawi_watthana', 'Thawi Watthana', 'ทวีวัฒนา'],
    ['phasi_charoen', 'Phasi Charoen', 'ภาษีเจริญ', 'bang wa', 'phasi chareon', 'pasi charoen'],
    ['bang_khae', 'Bang Khae', 'บางแค', 'bangkae', 'bangkhae'],
    ['nong_khaem', 'Nong Khaem', 'หนองแขม'],
    ['bang_bon', 'Bang Bon', 'บางบอน'],
    ['bang_khun_thian', 'Bang Khun Thian', 'บางขุนเทียน'],
    ['chom_thong', 'Chom Thong', 'จอมทอง'],
    ['rat_burana', 'Rat Burana / Suksawat', 'ราษฎร์บูรณะ / สุขสวัสดิ์', 'rat burana', 'ratburana', 'suksawat', 'ราษฎร์บูรณะ', 'สุขสวัสดิ์'],
    ['thung_khru', 'Thung Khru / Pracha Uthit', 'ทุ่งครุ / ประชาอุทิศ', 'thung khru', 'pracha uthit', 'ทุ่งครุ', 'ประชาอุทิศ'],
  ],

  phuket: [
    ['phuket_town', 'Phuket Town', 'ตัวเมืองภูเก็ต', 'phuket city', 'phuket old town', 'old town', 'talad yai', 'talat yai', 'city', 'เมืองภูเก็ต', 'ตลาดใหญ่'],
    ['ratsada', 'Ratsada', 'รัษฎา', 'rassada'],
    ['wichit', 'Wichit', 'วิชิต', 'vichit'],
    ['koh_kaew', 'Koh Kaew', 'เกาะแก้ว', 'ko kaeo', 'ko kaew', 'koh keaw', 'koh kaeo', 'boat lagoon'],
    ['cape_panwa', 'Cape Panwa', 'แหลมพันวา', 'panwa', 'ao makham'],
    ['chalong', 'Chalong', 'ฉลอง', 'chaloong'],
    ['rawai', 'Rawai', 'ราไวย์'],
    ['nai_harn', 'Nai Harn', 'ในหาน', 'naiharn', 'nai han', 'naiharh'],
    ['kata', 'Kata', 'กะตะ'],
    ['karon', 'Karon', 'กะรน'],
    ['patong', 'Patong', 'ป่าตอง'],
    ['kathu', 'Kathu', 'กะทู้', 'khatu', 'กระทู้'],
    ['kamala', 'Kamala', 'กมลา'],
    ['surin_beach', 'Surin Beach', 'หาดสุรินทร์', 'surin'],
    ['bang_tao', 'Bang Tao', 'บางเทา', 'bangtao', 'bang tao beach', 'laguna'],
    ['cherng_talay', 'Cherng Talay', 'เชิงทะเล', 'cherngtalay', 'choeng thale', 'chroengtalay', 'cherngtalee'],
    ['layan', 'Layan', 'ลายัน'],
    ['thalang', 'Thalang', 'ถลาง', 'talang'],
    ['pa_sak', 'Pasak', 'ป่าสัก', 'pasak'],
    ['bang_jo', 'Bang Jo', 'บางโจ', 'bangjo'],
    ['si_sunthon', 'Si Sunthon / Manik', 'ศรีสุนทร / มานิค', 'si sunthon', 'srisoonthorn', 'manik', 'ศรีสุนทร', 'มานิค'],
    ['pa_khlok', 'Pa Khlok', 'ป่าคลอก', 'paklok', 'pa klok'],
    ['sakhu', 'Sakhu', 'สาคู'],
    ['nai_thon', 'Nai Thon', 'ในทอน', 'naithon'],
    ['nai_yang', 'Nai Yang', 'ในยาง', 'naiyang'],
    ['mai_khao', 'Mai Khao', 'ไม้ขาว', 'maikhao'],
  ],

  chiang_mai: [
    ['old_city', 'Old City', 'เมืองเก่า', 'old town', 'in the city', 'city', 'ในเมือง'],
    ['nimman', 'Nimman', 'นิมมาน', 'nimmanhaemin', 'niman', 'nimaan', 'นิมมานเหมินท์'],
    ['chang_phueak', 'Chang Phueak', 'ช้างเผือก', 'changpuek', 'chang puek', 'jed yod', 'jedyod'],
    ['santitham', 'Santitham', 'สันติธรรม'],
    ['suthep', 'Suthep', 'สุเทพ', 'huay kaew'],
    ['chang_khlan', 'Chang Khlan', 'ช้างคลาน', 'chang klan', 'night bazaar', 'chiang klan'],
    ['wat_ket', 'Wat Ket', 'วัดเกต', 'wat gate'],
    ['fa_ham', 'Fa Ham', 'ฟ้าฮ่าม'],
    ['haiya', 'Haiya', 'หายยา', 'hay ya', 'hai ya'],
    ['nong_hoi', 'Nong Hoi', 'หนองหอย'],
    ['pa_daet', 'Pa Daet', 'ป่าแดด', 'pa daed'],
    ['mae_hia', 'Mae Hia', 'แม่เหียะ'],
    ['nong_pa_khrang', 'Nong Pa Khrang', 'หนองป่าครั่ง', 'nong pakrang'],
    ['hang_dong', 'Hang Dong', 'หางดง', 'hangdong'],
    ['san_sai', 'San Sai', 'สันทราย', 'sansai'],
    ['san_kamphaeng', 'San Kamphaeng', 'สันกำแพง', 'sankampaeng'],
    ['doi_saket', 'Doi Saket', 'ดอยสะเก็ด', 'doisaket', 'doi sacket'],
    ['mae_rim', 'Mae Rim', 'แม่ริม', 'maerim'],
    ['saraphi', 'Saraphi', 'สารภี', 'sarapee', 'sarapi'],
    ['san_pa_tong', 'San Pa Tong', 'สันป่าตอง'],
    ['mae_taeng', 'Mae Taeng', 'แม่แตง'],
    ['mae_on', 'Mae On', 'แม่ออน'],
  ],

  pattaya: [
    ['north_pattaya', 'North Pattaya', 'พัทยาเหนือ'],
    ['central_pattaya', 'Central Pattaya', 'พัทยากลาง', 'pattaya klang', 'pattaya central'],
    ['south_pattaya', 'South Pattaya', 'พัทยาใต้', 'pattaya south'],
    ['pratumnak', 'Pratumnak', 'พระตำหนัก', 'pratamnak', 'phra tamnak'],
    ['jomtien', 'Jomtien', 'จอมเทียน', 'chom thian', 'jomthien'],
    ['na_jomtien', 'Na Jomtien', 'นาจอมเทียน', 'na chom thian', 'najomtien'],
    ['naklua', 'Naklua / Wong Amat', 'นาเกลือ / วงศ์อมาตย์', 'naklua', 'na kluea', 'wong amat', 'wongamat', 'นาเกลือ'],
    ['east_pattaya', 'East Pattaya (Nong Prue)', 'พัทยาตะวันออก (หนองปรือ)', 'east pattaya', 'nong prue', 'nongprue', 'mabprachan', 'mab prachan', 'หนองปรือ'],
    ['huai_yai', 'Huai Yai', 'ห้วยใหญ่', 'huay yai', 'huayai'],
    ['nong_pla_lai', 'Nong Pla Lai', 'หนองปลาไหล'],
    ['bang_lamung', 'Bang Lamung', 'บางละมุง', 'banglamung'],
    ['bang_saray', 'Bang Saray', 'บางเสร่', 'bang sare', 'bangsaray'],
    ['sattahip', 'Sattahip', 'สัตหีบ'],
  ],

  hua_hin: [
    ['hua_hin_centre', 'Hua Hin town centre', 'ใจกลางเมืองหัวหิน', 'center of hua hin', 'hua hin center', 'hua hin centre', 'town centre', 'market village', 'blueport'],
    ['khao_takiab', 'Khao Takiab', 'เขาตะเกียบ', 'takiab', 'khao takiap'],
    ['nong_kae', 'Nong Kae', 'หนองแก'],
    ['hin_lek_fai', 'Hin Lek Fai', 'หินเหล็กไฟ'],
    ['thap_tai', 'Thap Tai', 'ทับใต้', 'thap thai', 'tub tai'],
    ['bo_fai', 'Bo Fai', 'บ่อฝ้าย'],
    ['khao_tao', 'Khao Tao', 'เขาเต่า'],
    ['cha_am', 'Cha-am', 'ชะอำ', 'cha am'],
    ['pranburi', 'Pranburi', 'ปราณบุรี', 'pran buri', 'pak nam pran', 'paknampran'],
    ['sam_roi_yot', 'Sam Roi Yot', 'สามร้อยยอด', 'samroiyot', 'samrayod'],
  ],

  prachuap_khiri_khan: [
    ['hua_hin', 'Hua Hin', 'หัวหิน', 'huahin'],
    ['pranburi', 'Pranburi', 'ปราณบุรี', 'pran buri'],
    ['sam_roi_yot', 'Sam Roi Yot', 'สามร้อยยอด', 'samroiyot'],
    ['kui_buri', 'Kui Buri', 'กุยบุรี'],
    ['prachuap_town', 'Prachuap town', 'เมืองประจวบคีรีขันธ์', 'mueang prachuap', 'prachuap city'],
    ['thap_sakae', 'Thap Sakae', 'ทับสะแก'],
    ['bang_saphan', 'Bang Saphan', 'บางสะพาน'],
    ['bang_saphan_noi', 'Bang Saphan Noi', 'บางสะพานน้อย'],
  ],

  koh_samui: [
    ['chaweng', 'Chaweng', 'เฉวง', 'chawheng', 'chawang'],
    ['bophut', 'Bophut', 'บ่อผุด', 'bo phut', 'boput', 'fisherman village'],
    ['mae_nam', 'Mae Nam', 'แม่น้ำ', 'maenam'],
    ['bang_rak', 'Bang Rak (Big Buddha)', 'บางรัก', 'bang rak', 'big buddha'],
    ['choeng_mon', 'Choeng Mon', 'เชิงมน', 'cheng mon', 'choengmon'],
    ['lamai', 'Lamai', 'ละไม'],
    ['bang_po', 'Bang Po', 'บางปอ', 'bangpo'],
    ['nathon', 'Nathon', 'หน้าทอน', 'na thon'],
    ['lipa_noi', 'Lipa Noi', 'ลิปะน้อย'],
    ['taling_ngam', 'Taling Ngam', 'ตลิ่งงาม'],
    ['hua_thanon', 'Hua Thanon', 'หัวถนน'],
    ['bang_kao', 'Bang Kao', 'บางเก่า'],
  ],

  surat_thani: [
    ['surat_thani_town', 'Surat Thani town', 'เมืองสุราษฎร์ธานี', 'surat thani city', 'mueang surat thani'],
    ['koh_samui', 'Koh Samui', 'เกาะสมุย', 'samui', 'ko samui'],
    ['koh_phangan', 'Koh Phangan', 'เกาะพะงัน', 'ko pha-ngan', 'koh pha-ngan', 'phangan'],
    ['koh_tao', 'Koh Tao', 'เกาะเต่า', 'ko tao'],
    ['don_sak', 'Don Sak', 'ดอนสัก'],
  ],

  koh_phangan: [
    ['thong_sala', 'Thong Sala', 'ท้องศาลา', 'thongsala', 'toung sale', 'tong sala'],
    ['ban_tai', 'Ban Tai', 'บ้านใต้', 'baan tai'],
    ['haad_rin', 'Haad Rin', 'หาดริ้น', 'hat rin', 'had rin'],
    ['srithanu', 'Srithanu', 'ศรีธนู', 'sri thanu'],
    ['hin_kong', 'Hin Kong', 'หินกอง'],
    ['haad_yao', 'Haad Yao', 'หาดยาว', 'hat yao'],
    ['chaloklum', 'Chaloklum', 'โฉลกหลำ', 'chalok lam'],
    ['thong_nai_pan', 'Thong Nai Pan', 'ธงนายพัน'],
    ['maduea_wan', 'Maduea Wan', 'มะเดื่อหวาน'],
  ],

  nonthaburi: [
    ['nonthaburi_town', 'Nonthaburi town', 'เมืองนนทบุรี', 'nonthaburi city', 'mueang nonthaburi'],
    ['pak_kret', 'Pak Kret', 'ปากเกร็ด', 'pakkret', 'pakkred', 'pakret'],
    ['muang_thong_thani', 'Muang Thong Thani', 'เมืองทองธานี'],
    ['bang_kruai', 'Bang Kruai', 'บางกรวย', 'bangkruai'],
    ['bang_yai', 'Bang Yai', 'บางใหญ่', 'bangyai'],
    ['bang_bua_thong', 'Bang Bua Thong', 'บางบัวทอง', 'bangbuathong'],
    ['sai_noi', 'Sai Noi', 'ไทรน้อย'],
    ['rattanathibet', 'Rattanathibet', 'รัตนาธิเบศร์'],
    ['ratchaphruek', 'Ratchaphruek', 'ราชพฤกษ์'],
  ],

  samut_prakan: [
    ['samut_prakan_town', 'Samut Prakan town (Pak Nam)', 'เมืองสมุทรปราการ (ปากน้ำ)', 'samut prakan city', 'mueang samut prakan', 'pak nam', 'paknam'],
    ['samrong', 'Samrong', 'สำโรง'],
    ['bearing', 'Bearing / Lasalle', 'แบริ่ง / ลาซาล', 'bearing', 'lasalle'],
    ['bang_na', 'Bang Na–Trat (Mega Bangna)', 'บางนา-ตราด (เมกาบางนา)', 'bang na', 'bangna', 'mega bangna', 'bang kaeo'],
    ['srinakarin', 'Srinakarin', 'ศรีนครินทร์', 'sri nakarin', 'sri nakarin road'],
    ['thepharak', 'Thepharak', 'เทพารักษ์', 'theparak'],
    ['bang_phli', 'Bang Phli', 'บางพลี', 'bangplee', 'bang plee'],
    ['bang_pu', 'Bang Pu', 'บางปู', 'bangpoo'],
    ['bang_sao_thong', 'Bang Sao Thong', 'บางเสาธง'],
    ['bang_bo', 'Bang Bo', 'บางบ่อ'],
    ['phra_pradaeng', 'Phra Pradaeng', 'พระประแดง'],
    ['phra_samut_chedi', 'Phra Samut Chedi', 'พระสมุทรเจดีย์'],
    ['suvarnabhumi', 'Suvarnabhumi (airport area)', 'สุวรรณภูมิ', 'suvarnabhumi', 'airport'],
  ],

  chonburi: [
    ['chonburi_town', 'Chonburi town', 'เมืองชลบุรี', 'chonburi city', 'mueang chonburi'],
    ['bang_saen', 'Bang Saen', 'บางแสน', 'bangsaen'],
    ['si_racha', 'Si Racha', 'ศรีราชา', 'sriracha', 'sri racha'],
    ['laem_chabang', 'Laem Chabang', 'แหลมฉบัง'],
    ['bo_win', 'Bo Win', 'บ่อวิน', 'bowin'],
    ['pattaya', 'Pattaya', 'พัทยา'],
    ['bang_lamung', 'Bang Lamung', 'บางละมุง', 'banglamung'],
    ['sattahip', 'Sattahip', 'สัตหีบ'],
    ['ban_bueng', 'Ban Bueng', 'บ้านบึง', 'banbueng'],
    ['phan_thong', 'Phan Thong', 'พานทอง'],
    ['phanat_nikhom', 'Phanat Nikhom', 'พนัสนิคม'],
  ],

  krabi: [
    ['krabi_town', 'Krabi Town', 'ตัวเมืองกระบี่', 'krabi city', 'เมืองกระบี่'],
    ['ao_nang', 'Ao Nang', 'อ่าวนาง', 'aonang'],
    ['krabi_noi', 'Krabi Noi', 'กระบี่น้อย'],
    ['klong_muang', 'Klong Muang', 'คลองม่วง', 'khlong muang'],
    ['ao_nam_mao', 'Ao Nam Mao', 'อ่าวน้ำเมา'],
    ['nuea_khlong', 'Nuea Khlong', 'เหนือคลอง'],
    ['khao_phanom', 'Khao Phanom', 'เขาพนม'],
    ['ao_luek', 'Ao Luek', 'อ่าวลึก'],
    ['khlong_thom', 'Khlong Thom', 'คลองท่อม'],
    ['koh_lanta', 'Koh Lanta', 'เกาะลันตา', 'ko lanta'],
    ['koh_phi_phi', 'Koh Phi Phi', 'เกาะพีพี', 'phi phi'],
  ],

  koh_lanta: [
    ['saladan', 'Saladan', 'ศาลาด่าน', 'sala dan'],
    ['klong_dao', 'Klong Dao', 'คลองดาว'],
    ['long_beach', 'Long Beach (Phra Ae)', 'พระแอะ', 'long beach', 'phra ae', 'pra ae'],
    ['klong_khong', 'Klong Khong', 'คลองโขง'],
    ['klong_nin', 'Klong Nin', 'คลองนิน'],
    ['kantiang', 'Kantiang', 'กันเตียง'],
    ['lanta_old_town', 'Lanta Old Town', 'เมืองเก่าลันตา', 'old town'],
  ],

  pathum_thani: [
    ['pathum_thani_town', 'Pathum Thani town', 'เมืองปทุมธานี', 'pathum thani city', 'mueang pathum thani'],
    ['rangsit', 'Rangsit', 'รังสิต'],
    ['thanyaburi', 'Thanyaburi', 'ธัญบุรี'],
    ['khlong_luang', 'Khlong Luang', 'คลองหลวง', 'klong luang'],
    ['lam_luk_ka', 'Lam Luk Ka', 'ลำลูกกา', 'lamlukka'],
    ['lat_lum_kaeo', 'Lat Lum Kaeo', 'ลาดหลุมแก้ว'],
    ['sam_khok', 'Sam Khok', 'สามโคก'],
    ['nong_suea', 'Nong Suea', 'หนองเสือ', 'nong sua'],
  ],

  rayong: [
    ['rayong_town', 'Rayong town', 'เมืองระยอง', 'rayong city', 'mueang rayong'],
    ['ban_chang', 'Ban Chang', 'บ้านฉาง', 'banchang'],
    ['map_ta_phut', 'Map Ta Phut', 'มาบตาพุด'],
    ['ban_khai', 'Ban Khai', 'บ้านค่าย', 'bankhai'],
    ['pluak_daeng', 'Pluak Daeng', 'ปลวกแดง'],
    ['nikhom_phatthana', 'Nikhom Phatthana', 'นิคมพัฒนา'],
    ['ban_phe', 'Ban Phe', 'บ้านเพ'],
    ['klaeng', 'Klaeng', 'แกลง'],
  ],

  chiang_rai: [
    ['chiang_rai_town', 'Chiang Rai town', 'เมืองเชียงราย', 'chiang rai city', 'mueang chiang rai'],
    ['mae_sai', 'Mae Sai', 'แม่สาย'],
    ['mae_chan', 'Mae Chan', 'แม่จัน'],
    ['chiang_saen', 'Chiang Saen', 'เชียงแสน'],
    ['chiang_khong', 'Chiang Khong', 'เชียงของ'],
    ['phan', 'Phan', 'พาน'],
    ['mae_lao', 'Mae Lao', 'แม่ลาว'],
    ['wiang_chai', 'Wiang Chai', 'เวียงชัย'],
  ],

  trat: [
    ['trat_town', 'Trat town', 'เมืองตราด', 'trat city', 'mueang trat'],
    ['koh_chang', 'Koh Chang', 'เกาะช้าง', 'ko chang'],
    ['koh_kood', 'Koh Kood', 'เกาะกูด', 'ko kut', 'koh kut'],
  ],

  mae_hong_son: [
    ['mae_hong_son_town', 'Mae Hong Son town', 'เมืองแม่ฮ่องสอน', 'mueang mae hong son'],
    ['pai', 'Pai', 'ปาย'],
    ['mae_sariang', 'Mae Sariang', 'แม่สะเรียง'],
  ],
};

/**
 * Places in the city list that are really one district or island of a
 * province that is ALSO in the city list. A company that picks "Prachuap
 * Khiri Khan" and one that picks "Hua Hin" mean the same town; the filter has
 * to find both either way. `area` is the row in the province's list above.
 */
export const PLACE_PARENT = {
  hua_hin:     { province: 'prachuap_khiri_khan', area: 'hua_hin' },
  pattaya:     { province: 'chonburi',            area: 'pattaya' },
  koh_samui:   { province: 'surat_thani',         area: 'koh_samui' },
  koh_phangan: { province: 'surat_thani',         area: 'koh_phangan' },
  koh_tao:     { province: 'surat_thani',         area: 'koh_tao' },
  ao_nang:     { province: 'krabi',               area: 'ao_nang' },
  koh_lanta:   { province: 'krabi',               area: 'koh_lanta' },
  koh_chang:   { province: 'trat',                area: 'koh_chang' },
  pai:         { province: 'mae_hong_son',        area: 'pai' },
};

export const MAX_AREAS = 8;
export const MAX_AREA_OTHER = 80;

// "Bang Tao" = "bangtao" = "BANG-TAO": compare without case, spaces or dashes.
const squash = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[\s\-_.'’()]+/g, '');

const citySlug = (city) => String(city || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const BY_CITY = {};
const LOOKUP = {};
const PHRASES = {};

// "Soi Sukhumvit 21, Asok" → "soi sukhumvit 21 asok": words kept apart, so a
// name can be looked for as a whole word and "Nana" is not found in "banana".
const words = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, ' ')
  .trim();

for (const [city, rows] of Object.entries(RAW)) {
  BY_CITY[city] = rows.map(([slug, en, th]) => ({ slug, en, th }));
  const map = new Map();
  const phrases = [];
  for (const [slug, en, th, ...aliases] of rows) {
    for (const name of [slug, en, th, ...aliases]) {
      const key = squash(name);
      if (key && !map.has(key)) map.set(key, slug);
      // Inside a longer line a name has to be unmistakable. Latin names are
      // matched as whole words, so four letters are enough ("Nana", "Kata") —
      // but not the generic words some rows use as an alias. Thai has no word
      // boundaries, so short Thai names only count as the whole token.
      const thai = /[\u0E00-\u0E7F]/.test(name);
      // "siam": Suan Siam, Siam Country Club … are nowhere near Siam Square.
      const generic = ['city', 'town', 'area', 'airport', 'oldtown', 'towncentre', 'siam'].includes(key);
      if (!generic && key.length >= (thai ? 5 : 4) && !/[/(]/.test(name)) phrases.push({ slug, spaced: words(name), flat: key, thai });
    }
  }
  LOOKUP[city] = map;
  PHRASES[city] = phrases;
}

/** The clickable areas of a city, or [] when we have no list for it. */
export function areasFor(city) {
  return BY_CITY[citySlug(city)] || [];
}

export function hasAreas(city) {
  return areasFor(city).length > 0;
}

/** CSV / array / anything → clean array of slugs. */
export function parseAreaSlugs(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean))];
}

/** Only the slugs that exist for this city, in list order, capped. */
export function cleanAreaSlugs(city, value, max = MAX_AREAS) {
  const wanted = new Set(parseAreaSlugs(value));
  return areasFor(city).filter((a) => wanted.has(a.slug)).map((a) => a.slug).slice(0, max);
}

export function areaName(city, slug, lang = 'en') {
  const a = areasFor(city).find((x) => x.slug === slug);
  if (!a) return '';
  return lang === 'th' ? a.th : a.en;
}

// Words people add around a place name that do not change which place it is.
const NOISE = /\b(sub-?district|district|amphoe|amphur|tambon|area|beach|road|rd|province)\b|ตำบล|อำเภอ|เขต|แขวง|ต\.|อ\./gi;

function lookupToken(city, token) {
  const map = LOOKUP[citySlug(city)];
  if (!map) return [];
  // "Kathu District" is Kathu: the extra word adds nothing, so it is exact.
  const plain = String(token).replace(NOISE, ' ');
  const exact = map.get(squash(token)) || map.get(squash(plain));
  if (exact) return [{ slug: exact, exact: true }];
  // "Sukhumvit 71", "Charoen Krung 103": the place is clear, but the number
  // is detail the person chose to give, so the text stays (not `exact`).
  const noNumber = plain.replace(/\b(soi|ซอย)\s*\d+\b/gi, ' ').replace(/[\s/]*\d+\s*$/g, ' ');
  const loose = map.get(squash(noNumber));
  if (loose) return [{ slug: loose, exact: false }];
  // "Soi Sukhumvit 21 Asok", "near Robinson Thalang": a list name inside a
  // longer line. Whole words only for Latin; Thai has no spaces to go by.
  const spaced = ` ${words(token)} `;
  const single = new Set(spaced.trim().split(' '));
  const hits = new Set();
  for (const p of PHRASES[citySlug(city)]) {
    if (p.thai ? spaced.includes(p.spaced) : (spaced.includes(` ${p.spaced} `) || single.has(p.flat))) hits.add(p.slug);
  }
  return [...hits].map((slug) => ({ slug, exact: false }));
}

const cityNames = (city) => {
  const slug = citySlug(city);
  const out = new Set();
  // "Koh Samui" is also just "Samui"; "Phuket city" is not on this list on
  // purpose — in Phuket and Krabi that means the town, which is an area.
  for (const name of [slug, slug.replace(/^koh_/, '')]) {
    for (const form of [name, `all ${name}`, `${name} area`, `all ${name} area`, `anywhere in ${name}`, `around ${name}`, `${name} province`, `within ${name} province`]) {
      out.add(squash(form));
    }
  }
  return out;
};

/**
 * Sort a free-text line into the list. Used on every save (so an old client
 * that still sends plain text ends up with clickable areas) and once for the
 * existing profiles.
 *
 *   foldAreaText('phuket', [], 'Rawai / chaloong, near the pier')
 *     → { slugs: ['chalong', 'rawai'], other: 'near the pier' }
 *
 * A token that IS a list entry moves into `slugs` and leaves the text. A token
 * that only contains one ("Sukhumvit 71") sets the slug and stays in the text,
 * so the detail the person wrote is not thrown away. The bare city name
 * ("Phuket", "all Phuket area") says nothing and is dropped.
 */
export function foldAreaText(city, slugs, text) {
  const found = new Set(cleanAreaSlugs(city, slugs));
  const rest = [];
  const skip = cityNames(city);
  const tokens = String(text || '').split(/\s*[,/;|·•\n]+\s*|\s+&\s+|\s+and\s+|\s+และ\s+/i);
  for (const raw of tokens) {
    const token = raw.trim().replace(/^[.\s]+|[.\s]+$/g, '');
    if (!token) continue;
    if (hasAreas(city) && skip.has(squash(token))) continue;
    const hits = lookupToken(city, token);
    for (const hit of hits) found.add(hit.slug);
    if (!hits.length || hits.some((h) => !h.exact)) rest.push(token);
  }
  return {
    slugs: cleanAreaSlugs(city, [...found]),
    other: rest.join(', ').slice(0, MAX_AREA_OTHER).trim(),
  };
}

/**
 * The one line shown on a card: clicked areas first, then the free text.
 * A clicked name the text already spells out ("Sukhumvit" + "Sukhumvit 71")
 * is not said twice.
 */
export function formatAreas(city, slugs, other = '', lang = 'en') {
  const text = String(other || '').trim();
  const flat = squash(text);
  const names = cleanAreaSlugs(city, slugs)
    .map((slug) => areaName(city, slug, lang))
    .filter((name) => name && !(flat && flat.includes(squash(name.split(/[/(]/)[0]))));
  return [...names, text].filter(Boolean).join(', ');
}

/**
 * Does a profile / listing belong under a city (+ area) filter?
 *
 *   row    { city, areaSlugs }   areaSlugs: array or CSV; empty = whole city
 *   filter { city, area }        either may be empty
 *
 * Someone who named no area works (or is looking) anywhere in the city, so
 * they show under every area of it. Hua Hin and "Prachuap Khiri Khan → Hua
 * Hin" are the same place and find each other; see PLACE_PARENT.
 */
export function locationMatches(row, filter) {
  const fCity = citySlug(filter?.city);
  const fArea = String(filter?.area || '').trim().toLowerCase();
  if (!fCity) return true;
  const rCity = citySlug(row?.city);
  // Slugs that are not of the row's own city say nothing (stale after a move).
  const rAreas = cleanAreaSlugs(rCity, row?.areaSlugs, 999);

  if (rCity === fCity) {
    return !fArea || rAreas.length === 0 || rAreas.includes(fArea);
  }
  // Row sits in a town, filter is its province: Hua Hin under Prachuap.
  const up = PLACE_PARENT[rCity];
  if (up && up.province === fCity) {
    return !fArea || fArea === up.area;
  }
  // Row sits in the province, filter is one of its towns: only if the row
  // named that town, or named nothing (= anywhere in the province).
  const down = PLACE_PARENT[fCity];
  if (down && down.province === rCity) {
    return rAreas.length === 0 || rAreas.includes(down.area);
  }
  return false;
}

/**
 * What a card needs from a stored row, in both languages.
 *
 *   row: { city, area_slugs, area, area_en }
 *     area     the free-text line as typed (Thai or Latin)
 *     area_en  its English translation, when the original was Thai
 *
 *   → { area, areaEn, areaSlugs }
 *     area      Thai list names + the line as typed   (Thai viewers)
 *     areaEn    English list names + the translation  (everyone else)
 *     areaSlugs CSV, for the filter
 *
 * `area` / `areaEn` keep the names every existing screen — and the shipped
 * mobile app — already reads, so nothing downstream has to know about slugs
 * to show the right line.
 */
export function areaFields(row) {
  const city = row?.city;
  const slugs = cleanAreaSlugs(city, row?.area_slugs);
  const text = String(row?.area || '').trim();
  const textEn = String(row?.area_en || '').trim() || text;
  return {
    area: formatAreas(city, slugs, text, 'th'),
    areaEn: formatAreas(city, slugs, textEn, 'en'),
    areaSlugs: slugs.join(','),
  };
}

/**
 * Turn what a client sent into what gets stored.
 *
 *   incoming.areaSlugs / area_slugs   clicked chips (new clients)
 *   incoming.areaOther / area_other   the "Other" line (new clients)
 *   incoming.area                     one plain line (old clients, old app)
 *
 * An old client only knows the plain line, and what it shows in that line is
 * the composed text from areaFields(). So for it the line IS the whole
 * answer: chips are rebuilt from the text alone, otherwise deleting a name in
 * the old app would never remove it.
 *
 * `current` is the stored row ({ area_slugs, area }), used for whatever the
 * client did not send — e.g. a city change that must drop chips of the old
 * city.
 */
export function resolveAreaInput(city, incoming = {}, current = {}) {
  const pick = (...keys) => keys.find((k) => k in incoming);
  const slugKey = pick('areaSlugs', 'area_slugs');
  const otherKey = pick('areaOther', 'area_other');
  const legacy = !slugKey && !otherKey && 'area' in incoming;

  const text = otherKey ? incoming[otherKey] : legacy ? incoming.area : (slugKey ? '' : current.area);
  const slugs = slugKey ? incoming[slugKey] : legacy ? [] : current.area_slugs;
  // A new client that sends chips but no "Other" key keeps the stored line.
  const keptText = slugKey && !otherKey ? current.area : text;

  const folded = foldAreaText(city, slugs, keptText);
  return { area_slugs: folded.slugs.join(',') || null, area: folded.other || null };
}

export const touchesArea = (incoming = {}) =>
  ['area', 'areaOther', 'area_other', 'areaSlugs', 'area_slugs', 'city'].some((k) => k in incoming);

/**
 * Same as areaFields() for the tables that keep no translation of the line
 * (families, directory): `area` is the English line every existing screen
 * reads, `areaTh` the same with Thai list names.
 */
export function areaFieldsLatin(row) {
  const f = areaFields({ ...row, area_en: '' });
  return { area: f.areaEn, areaTh: f.area, areaSlugs: f.areaSlugs };
}

/**
 * The browse pages' area filter, on top of an already chosen city.
 *
 *   row         { city, areaSlugs, area, areaEn, areaTh }
 *   filterCity  slug or display name, may be empty
 *   filterArea  a slug from the city's list — or, for a city without a list
 *               (and when no city is chosen), free text to search for
 *
 * Returns whether the row passes BOTH city and area. Callers that have their
 * own idea of "this helper also covers other cities" check the city first
 * and pass '' for filterCity here.
 */
export function areaFilterMatches(row, filterCity, filterArea) {
  const fCity = citySlug(filterCity);
  const fArea = String(filterArea || '').trim();
  const listed = areasFor(fCity).some((a) => a.slug === fArea.toLowerCase());
  if (fCity && !locationMatches(row, { city: fCity, area: listed ? fArea : '' })) return false;
  if (!fArea || listed) return true;
  const hay = [row?.area, row?.areaEn, row?.areaTh].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(fArea.toLowerCase());
}
