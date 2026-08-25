import { Person, MahramAnalysis } from '../types/family';
import { findRelationship } from './relationshipEngine';

/**
 * Islamic Mahram Engine
 * Analyzes whether Person B is Mahram or Ajnabi to Person A
 * according to Islamic Fiqh (Nasab, Musaharah, Rada'ah).
 * Includes detailed Aurat, Touch/Handshake, and Marriage rulings with Syarak disclaimers.
 */

export function analyzeMahram(
  personA: Person,
  personB: Person,
  allPersons: Person[]
): MahramAnalysis {
  // If same person
  if (personA.id === personB.id) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'NASAB',
      title: 'Diri Sendiri',
      description: 'Ini adalah diri anda sendiri.',
      relationshipPath: [personA.fullName],
      syarakNotes: 'Diri sendiri.',
      hukumAurat: 'Aurat asas individu.',
      hukumBersalaman: 'Tidak berkenaan.',
      hukumNikah: 'Tidak boleh menikahi diri sendiri.',
    };
  }

  // If same gender, while not "mahram" in marriage context, social interaction rules differ.
  // In fiqh, Mahram technically applies across opposite genders regarding marriage prohibition.
  const isOppositeGender = personA.gender !== personB.gender;

  const relationship = findRelationship(personA.id, personB.id, allPersons);
  const relName = relationship?.relationshipName || 'Waris Keluarga';

  // 1. Check Susuan (Rada'ah) if recorded
  if (personA.isSusuan || personB.isSusuan) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'RADAAH',
      title: `Mahram Rada'ah (Penyusuan) - ${relName}`,
      description: `${personB.fullName} direkodkan mempunyai hubungan susuan dengan ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, "Hubungan Rada'ah", personB.fullName],
      syarakNotes: 'Penyusuan yang memenuhi syarat syarak (5 kali susuan kenyang sebelum umur 2 tahun qamariyah) mengharamkan apa yang diharamkan oleh nasab.',
      hukumAurat: 'Aurat sama seperti mahram nasab (antara pusat hingga lutut sesama jenis / anggota zahir biasa bekerja).',
      hukumBersalaman: 'Harus bersalaman dan tidak membatalkan wudhu (menurut sebahagian mazhab / tiada syahwat).',
      hukumNikah: 'Haram dinikahi selama-lamanya (Haram Muabbad).',
    };
  }

  // 2. Usul & Furu' (Nasab - Direct Ancestors & Descendants)
  // Direct Ancestor (Ibu, Bapa, Nenek, Datuk, Moyang)
  if (relationship?.generationalDifference && relationship.generationalDifference < 0 && relationship.directPath.length >= 2 && !relationship.isInLaw && !relationship.isCousin) {
    const isParentOrGrandparent = relationship.relationshipName.includes('Kandung') || relationship.relationshipName.includes('Ibu') || relationship.relationshipName.includes('Bapa') || relationship.relationshipName.includes('Datuk') || relationship.relationshipName.includes('Nenek') || relationship.relationshipName.includes('Moyang');

    if (isParentOrGrandparent) {
      return {
        person: personA,
        target: personB,
        isMahram: true,
        mahramType: 'NASAB',
        title: `Mahram Nasab (Usul / Leluhur) - ${relName}`,
        description: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName}.`,
        relationshipPath: relationship.directPath,
        syarakNotes: 'Haram muabbad (kekal selamanya) berdasarkan nas al-Quran (Surah An-Nisa: 23). Termasuk ibu/bapa, nenek/datuk dan seterusnya ke atas.',
        hukumAurat: 'Aurat mahram: Boleh mendedahkan anggota yang biasa zahir ketika bekerja/di rumah (kepala, leher, lengan, betis).',
        hukumBersalaman: 'Harus bersalaman dan bersentuhan kulit dengan aman daripada fitnah.',
        hukumNikah: 'Haram bernikah selama-lamanya.',
      };
    }
  }

  // Direct Descendants (Anak, Cucu, Cicit, Piut)
  if (relationship?.isDirectDescendant) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'NASAB',
      title: `Mahram Nasab (Furu' / Keturunan) - ${relName}`,
      description: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName}.`,
      relationshipPath: relationship.directPath,
      syarakNotes: 'Haram muabbad (Surah An-Nisa: 23). Termasuk anak kandung, cucu, cicit dan seterusnya ke bawah.',
      hukumAurat: 'Aurat mahram muabbad (tidak wajib bertudung/menutup penuh seperti ajnabi di hadapannya dalam suasana selamat).',
      hukumBersalaman: 'Harus bersalaman/berpeluk tanda kasih sayang keluarga.',
      hukumNikah: 'Haram bernikah selama-lamanya.',
    };
  }

  // Siblings (Adik-beradik kandung / seibu / sebapa)
  if (relationship?.isSibling) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'NASAB',
      title: `Mahram Nasab (Hawasyi / Adik-Beradik) - ${relName}`,
      description: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName}.`,
      relationshipPath: relationship.directPath,
      syarakNotes: 'Adik-beradik kandung, seibu sebapa, sebapa sahaja, atau seibu sahaja adalah mahram muabbad (Surah An-Nisa: 23).',
      hukumAurat: 'Aurat mahram.',
      hukumBersalaman: 'Harus bersalaman.',
      hukumNikah: 'Haram bernikah selama-lamanya.',
    };
  }

  // Uncle / Aunt (Ibu Saudara / Bapa Saudara - Adik beradik ibu/bapa)
  if (relName.includes('Ibu Saudara') || relName.includes('Bapa Saudara') || relName.includes('Pakcik') || relName.includes('Makcik')) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'NASAB',
      title: `Mahram Nasab (Ibu/Bapa Saudara) - ${relName}`,
      description: `${personB.fullName} ialah saudara kandung kepada ibu atau bapa ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Ibu saudara (makcik) dan bapa saudara (pakcik) sebelah ibu mahupun bapa adalah mahram muabbad (Surah An-Nisa: 23).',
      hukumAurat: 'Aurat mahram muabbad.',
      hukumBersalaman: 'Harus bersalaman.',
      hukumNikah: 'Haram bernikah selama-lamanya.',
    };
  }

  // Niece / Nephew (Anak Saudara)
  if (relName.includes('Anak Saudara')) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'NASAB',
      title: `Mahram Nasab (Anak Saudara) - ${relName}`,
      description: `${personB.fullName} ialah anak kepada adik-beradik ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Anak saudara (anak kepada saudara lelaki atau saudara perempuan) ke bawah adalah mahram muabbad.',
      hukumAurat: 'Aurat mahram muabbad.',
      hukumBersalaman: 'Harus bersalaman.',
      hukumNikah: 'Haram bernikah selama-lamanya.',
    };
  }

  // 3. Musaharah (Perkahwinan)
  // Spouse
  if (relationship?.isSpouse) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'MUSAHARAH',
      title: `Pasangan Nikah Sah - ${relName}`,
      description: `${personB.fullName} ialah pasangan suami/isteri yang sah kepada ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Ikatan pernikahan yang sah menghalalkan hubungan suami isteri.',
      hukumAurat: 'Tiada batasan aurat antara suami dan isteri.',
      hukumBersalaman: 'Halal bersentuhan (perbezaan pandangan mazhab mengenai pembatalan wudhu).',
      hukumNikah: 'Telah berkahwin secara sah.',
    };
  }

  // Mertua (Bapa / Ibu Mertua)
  if (relName.includes('Mertua')) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'MUSAHARAH',
      title: `Mahram Musaharah (Mertua) - ${relName}`,
      description: `${personB.fullName} ialah ibu/bapa kepada pasangan ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Ibu/bapa mertua menjadi Mahram Muabbad (kekal selamanya) sebaik sahaja akad nikah termeterai, walaupun sekiranya berlaku penceraian dengan pasangan.',
      hukumAurat: 'Aurat mahram.',
      hukumBersalaman: 'Harus bersalaman.',
      hukumNikah: 'Haram bernikah selama-lamanya (Muabbad).',
    };
  }

  // Menantu
  if (relName.includes('Menantu')) {
    return {
      person: personA,
      target: personB,
      isMahram: true,
      mahramType: 'MUSAHARAH',
      title: `Mahram Musaharah (Menantu) - ${relName}`,
      description: `${personB.fullName} ialah pasangan kepada anak kandung ${personA.fullName}.`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Isteri/suami kepada anak kandung menjadi Mahram Muabbad sebaik akad nikah.',
      hukumAurat: 'Aurat mahram.',
      hukumBersalaman: 'Harus bersalaman.',
      hukumNikah: 'Haram bernikah selama-lamanya.',
    };
  }

  // Ipar (Abang/Kakak/Adik Ipar) - VERY IMPORTANT SPECIAL CASE
  if (relName.includes('Ipar')) {
    return {
      person: personA,
      target: personB,
      isMahram: false,
      mahramType: 'MAHRAM_SEMENTARA',
      title: `Bukan Mahram Asas / Mahram Muaqqat (Ipar) - ${relName}`,
      description: `${personB.fullName} ialah saudara kepada pasangan anda (atau pasangan kepada adik-beradik anda).`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'PERINGATAN PENTING SYARAK: Ipar HANYA mahram secara "Muaqqat" (sementara dari segi larangan himpun nikah serentak). Namun dari sudut AURAT dan SENTUHAN, status ipar adalah SAMA SEPERTI ORANG ASING (AJNABI). Hadis Nabi SAW mengingatkan: "Al-Hamwu al-Maut" (Ipar itu bahaya seperti maut).',
      hukumAurat: 'WAJIB menutup aurat penuh sebagaimana di hadapan ajnabi / bukan mahram.',
      hukumBersalaman: 'HARAM bersalaman / bersentuhan kulit tanpa lapik.',
      hukumNikah: 'Haram dihimpunkan serentak (haram muaqqat). Sekiranya berlaku perceraian atau kematian pasangan, boleh dinikahi.',
    };
  }

  // 4. COUSIN (SEPUPU) - VERY IMPORTANT ISLAMIC RULING
  if (relationship?.isCousin) {
    const deg = relationship.cousinDegree === 2 ? 'Sepupu Kedua' : 'Sepupu Pertama';
    return {
      person: personA,
      target: personB,
      isMahram: false,
      mahramType: 'BUKAN_MAHRAM_AJNABI',
      title: `Bukan Mahram / Ajnabi (${deg}) - ${relName}`,
      description: `${personB.fullName} ialah sepupu kepada ${personA.fullName} (anak kepada bapa/ibu saudara).`,
      relationshipPath: relationship?.directPath || [personA.fullName, personB.fullName],
      syarakNotes: 'Menurut hukum syarak Islam, SEPUPU BUKANLAH MAHRAM (Ajnabi), walaupun mempunyai hubungan darah kekeluargaan yang rapat. Perkahwinan antara sepupu adalah harus dalam Islam.',
      hukumAurat: 'Wajib menutup aurat secara sempurna (wanita wajib memakai tudung dan menutup seluruh tubuh kecuali muka dan tapak tangan).',
      hukumBersalaman: 'Tidak boleh bersalaman kulit ke kulit dan membatalkan wudhu jika bersentuhan.',
      hukumNikah: 'HALAL / HARUS berkahwin mengikut syarak sekiranya tiada halangan susuan.',
    };
  }

  // 5. Default General Relatives (Ajnabi)
  return {
    person: personA,
    target: personB,
    isMahram: false,
    mahramType: 'BUKAN_MAHRAM_AJNABI',
    title: `Bukan Mahram / Ajnabi - ${relName}`,
    description: `${personB.fullName} tidak mempunyai pertalian nasab atau perkahwinan yang menjadikannya mahram kepada ${personA.fullName}.`,
    relationshipPath: relationship?.directPath || [personA.fullName, 'Ahli Waris', personB.fullName],
    syarakNotes: 'Hubungan ini tergolong sebagai Ajnabi (bukan mahram). Batas pergaulan Islam hendaklah dipelihara.',
    hukumAurat: 'Aurat penuh ajnabi.',
    hukumBersalaman: 'Tidak boleh bersentuhan kulit / bersalaman.',
    hukumNikah: 'Harus dinikahi sekiranya memenuhi syarat syarak.',
  };
}

export const ISLAMIC_DISCLAIMER =
  'Maklumat berkaitan hukum Islam dalam aplikasi ini adalah penerangan umum berdasarkan sumber fiqh yang muktabar dan bukan fatwa peribadi. Untuk persoalan khusus, situasi susuan berbelit, atau kes yang kompleks, sila rujuk ustaz/ustazah atau pihak berautoriti agama.';
