import { Person } from '../types/family';
import { findRelationship } from '../utils/relationshipEngine';
import { analyzeMahram, ISLAMIC_DISCLAIMER } from '../utils/mahramEngine';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionButtons?: { label: string; action: () => void }[];
  highlightPersonIds?: string[];
}

export async function askAIWaris(
  query: string,
  allPersons: Person[],
  currentPerson: Person | null
): Promise<{ text: string; highlightPersonIds?: string[] }> {
  // 1. Build concise family context summary
  const totalCount = allPersons.length;
  const maxGen = Math.max(...allPersons.map((p) => p.generation || 1), 1);

  // Generate persons summary (id, name, gen, father, mother, spouse, children)
  const personsSummary = allPersons
    .map(
      (p) =>
        `[${p.id}] ${p.fullName} (${p.gender === 'male' ? 'Lelaki' : 'Perempuan'}, Gen ${p.generation}, Lahir: ${p.birthYear || 'T/D'}${p.isDeceased ? ', Meninggal' : ''}) | Bapa: ${p.fatherId || '-'}, Ibu: ${p.motherId || '-'}, Pasangan: ${p.spouseIds?.join(', ') || '-'}, Anak: ${p.childrenIds?.join(', ') || '-'}`
    )
    .join('\n');

  // Check if query is asking about a specific person in the tree
  const lowerQuery = query.toLowerCase();
  let relationshipSummary = '';
  const matchingPersons = allPersons.filter(
    (p) =>
      lowerQuery.includes(p.fullName.toLowerCase()) ||
      (p.nickname && lowerQuery.includes(p.nickname.toLowerCase())) ||
      lowerQuery.includes(p.id.toLowerCase())
  );

  if (currentPerson && matchingPersons.length > 0) {
    const rels = matchingPersons.map((target) => {
      const rel = findRelationship(currentPerson.id, target.id, allPersons);
      const mahram = analyzeMahram(currentPerson, target, allPersons);
      return `Hubungan [${currentPerson.fullName}] dengan [${target.fullName}]: ${rel?.relationshipName || 'Tidak pasti'}. Status Mahram: ${mahram.title} (${mahram.isMahram ? 'MAHRAM' : 'BUKAN MAHRAM/AJNABI'}). Hukum Aurat: ${mahram.hukumAurat}. Hukum Nikah: ${mahram.hukumNikah}.`;
    });
    relationshipSummary = rels.join('\n');
  }

  // 2. Try calling server-side API endpoint
  try {
    const response = await fetch('/api/ai-waris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        currentPerson: currentPerson
          ? {
              id: currentPerson.id,
              fullName: currentPerson.fullName,
              gender: currentPerson.gender,
              generation: currentPerson.generation,
            }
          : null,
        familyContext: {
          totalCount,
          generationsCount: maxGen,
          personsSummary,
          relationshipSummary,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer) {
        return {
          text: data.answer,
          highlightPersonIds: matchingPersons.map((p) => p.id),
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI route failed or in browser-only mode, using deterministic engine fallback:', err);
  }

  // 3. Deterministic Local AI Engine Fallback (Zero Hallucination Guarantee)
  return fallbackLocalAIResponse(query, allPersons, currentPerson);
}

function fallbackLocalAIResponse(
  query: string,
  allPersons: Person[],
  currentPerson: Person | null
): { text: string; highlightPersonIds?: string[] } {
  const lower = query.toLowerCase().trim();

  // Root inquiry
  if (lower.includes('siapa root') || lower.includes('pengasas') || lower.includes('asal keluarga')) {
    return {
      text: `Pasangan asal dan root keluarga ini ialah:\n- MAMAT BIN ISMAIL (WMH-000001) - Tok Ayah Mamat\n- HAFSAH BINTI ISMAIL (WMH-000002) - Tok Mak Hafsah\n\nKeluarga ini bermula dari Kampung Teluk Menara, Terengganu dan kini berkembang kepada 5 generasi waris.`,
      highlightPersonIds: ['WMH-000001', 'WMH-000002'],
    };
  }

  // Count / Statistics
  if (lower.includes('berapa jumlah') || lower.includes('bilangan waris') || lower.includes('statistik')) {
    const maleCount = allPersons.filter((p) => p.gender === 'male').length;
    const femaleCount = allPersons.filter((p) => p.gender === 'female').length;
    const maxGen = Math.max(...allPersons.map((p) => p.generation || 1), 1);
    return {
      text: `📊 Ringkasan Statistik Waris Mamat & Hafsah:\n- Jumlah Waris Direkodkan: ${allPersons.length} orang\n- Bilangan Generasi: ${maxGen} generasi\n- Waris Lelaki: ${maleCount} orang\n- Waris Perempuan: ${femaleCount} orang\n- Profil Disahkan (Verified): ${allPersons.filter((p) => p.isVerified).length} orang`,
    };
  }

  // Anak Mamat / Hafsah (Gen 2)
  if (lower.includes('anak mamat') || lower.includes('anak hafsah') || lower.includes('generasi 2') || lower.includes('generasi kedua')) {
    const children = allPersons.filter((p) => (p.fatherId === 'WMH-000001' && p.motherId === 'WMH-000002') || p.generation === 2);
    const names = children
      .map((c, i) => `${i + 1}. ${c.fullName} (${c.nickname || ''}) - ${c.gender === 'male' ? 'Lelaki' : 'Perempuan'}`)
      .join('\n');
    return {
      text: `🌳 Anak-anak kepada Tok Ayah Mamat & Tok Mak Hafsah (Generasi ke-2):\n\n${names}\n\nSemua anak ini merupakan tunjang utama perkembangan generasi seterusnya.`,
      highlightPersonIds: children.map((c) => c.id),
    };
  }

  // Cucu Mamat / Hafsah (Gen 3)
  if (lower.includes('cucu mamat') || lower.includes('cucu hafsah') || lower.includes('generasi 3') || lower.includes('generasi ketiga')) {
    const cucu = allPersons.filter((p) => p.generation === 3 && (p.fatherId || p.motherId));
    const names = cucu.map((c, i) => `${i + 1}. ${c.fullName} (${c.nickname || ''})`).join('\n');
    return {
      text: `👶 Senarai Cucu Tok Ayah Mamat & Tok Mak Hafsah (Generasi ke-3):\n\n${names}`,
      highlightPersonIds: cucu.map((c) => c.id),
    };
  }

  // Cicit Mamat / Hafsah (Gen 4)
  if (lower.includes('cicit') || lower.includes('generasi 4') || lower.includes('generasi keempat')) {
    const cicit = allPersons.filter((p) => p.generation === 4);
    const names = cicit.map((c, i) => `${i + 1}. ${c.fullName} (${c.nickname || ''})`).join('\n');
    return {
      text: `🧒 Senarai Cicit Tok Ayah Mamat & Tok Mak Hafsah (Generasi ke-4):\n\n${names}`,
      highlightPersonIds: cicit.map((c) => c.id),
    };
  }

  // Piut (Gen 5)
  if (lower.includes('piut') || lower.includes('generasi 5') || lower.includes('generasi kelima')) {
    const piut = allPersons.filter((p) => p.generation === 5);
    const names = piut.map((c, i) => `${i + 1}. ${c.fullName} (${c.nickname || ''})`).join('\n');
    return {
      text: `🍼 Senarai Piut Tok Ayah Mamat & Tok Mak Hafsah (Generasi ke-5):\n\n${names}`,
      highlightPersonIds: piut.map((c) => c.id),
    };
  }

  // Mahram Questions
  if (lower.includes('mahram') || lower.includes('ajnabi') || lower.includes('aurat') || lower.includes('salam')) {
    if (lower.includes('sepupu')) {
      return {
        text: `📌 Hukum Sepupu Dalam Islam:\n\n1. SEPUPU BUKAN MAHRAM (AJNABI):\nWalaupun sepupu mempunyai pertalian darah rapat (anak kepada pakcik/makcik), dalam syariat Islam, SEPUPU BUKANLAH MAHRAM.\n\n2. Batas Aurat:\nWajib menutup aurat penuh seperti di hadapan orang luar bukan mahram.\n\n3. Bersalaman & Sentuhan:\nTidak boleh bersalaman kulit ke kulit tanpa berlapik, dan sentuhan membatalkan wudhu (mazhab Syafi'i).\n\n4. Perkahwinan:\nHalal dan harus bernikah dengan sepupu sekiranya tiada halangan susuan (Surah Al-Ahzab: 50).\n\n⚖️ ${ISLAMIC_DISCLAIMER}`,
      };
    }

    if (lower.includes('ipar')) {
      return {
        text: `📌 Hukum Ipar Dalam Islam:\n\n1. Status Mahram:\nIpar HANYA Mahram Muaqqat (sementara dari sudut larangan mengahwini serentak dua beradik).\n\n2. Aurat & Bersalaman:\nDari segi AURAT dan BERSALAMAN, status ipar adalah SAMA SEPERTI ORANG ASING (AJNABI). Wajib menutup aurat sempurna dan haram bersentuhan kulit.\n\n3. Peringatan Rasulullah SAW:\nNabi SAW bersabda: "Al-Hamwu al-Maut" (Ipar itu bahaya seperti maut) - Hadis Riwayat Bukhari & Muslim, mengingatkan agar sentiasa menjaga batas pergaulan.\n\n⚖️ ${ISLAMIC_DISCLAIMER}`,
      };
    }
  }

  // Personal queries if current user is set
  if (currentPerson) {
    if (lower.includes('sepupu saya') || lower.includes('siapa sepupu')) {
      const cousins = allPersons.filter((p) => {
        const rel = findRelationship(currentPerson.id, p.id, allPersons);
        return rel?.isCousin;
      });
      if (cousins.length > 0) {
        const list = cousins.map((c, i) => `${i + 1}. ${c.fullName} (${c.nickname || ''})`).join('\n');
        return {
          text: `👥 Senarai Sepupu bagi ${currentPerson.fullName}:\n\n${list}\n\n*Nota Syarak: Sepupu tergolong sebagai Ajnabi (bukan mahram).`,
          highlightPersonIds: cousins.map((c) => c.id),
        };
      }
    }

    if (lower.includes('adik beradik saya') || lower.includes('saudara saya')) {
      const siblings = allPersons.filter((p) => {
        const rel = findRelationship(currentPerson.id, p.id, allPersons);
        return rel?.isSibling;
      });
      if (siblings.length > 0) {
        const list = siblings.map((s, i) => `${i + 1}. ${s.fullName} (${s.nickname || ''})`).join('\n');
        return {
          text: `🏠 Adik-beradik bagi ${currentPerson.fullName}:\n\n${list}\n\n*Status: Mahram Muabbad (Kekal).`,
          highlightPersonIds: siblings.map((s) => s.id),
        };
      }
    }

    if (lower.includes('mahram saya') || lower.includes('siapa mahram')) {
      const mahrams = allPersons.filter((p) => {
        const m = analyzeMahram(currentPerson, p, allPersons);
        return m.isMahram && p.id !== currentPerson.id;
      });
      const list = mahrams.map((m, i) => `${i + 1}. ${m.fullName} - ${findRelationship(currentPerson.id, m.id, allPersons)?.relationshipName}`).join('\n');
      return {
        text: `🛡️ Senarai Mahram bagi ${currentPerson.fullName} (${currentPerson.gender === 'male' ? 'Lelaki' : 'Perempuan'}):\n\n${list || 'Tiada rekod mahram langsung.'}\n\n⚖️ ${ISLAMIC_DISCLAIMER}`,
        highlightPersonIds: mahrams.map((p) => p.id),
      };
    }
  }

  // Look up specific person in query
  const target = allPersons.find(
    (p) =>
      lower.includes(p.fullName.toLowerCase()) ||
      (p.nickname && lower.includes(p.nickname.toLowerCase())) ||
      lower.includes(p.id.toLowerCase())
  );

  if (target) {
    const bapa = allPersons.find((p) => p.id === target.fatherId);
    const ibu = allPersons.find((p) => p.id === target.motherId);
    const spouses = (target.spouseIds || []).map((id) => allPersons.find((p) => p.id === id)?.fullName).filter(Boolean);
    const children = (target.childrenIds || []).map((id) => allPersons.find((p) => p.id === id)?.fullName).filter(Boolean);

    let relWithUser = '';
    if (currentPerson) {
      const rel = findRelationship(currentPerson.id, target.id, allPersons);
      const mahram = analyzeMahram(currentPerson, target, allPersons);
      relWithUser = `\n\n📌 Hubungan Dengan Anda (${currentPerson.fullName}):\n- Hubungan: ${rel?.relationshipName || 'Belum dihubungkan'}\n- Status Mahram: ${mahram.title} (${mahram.isMahram ? 'MAHRAM' : 'BUKAN MAHRAM/AJNABI'})\n- Laluan: ${rel?.directPath.join(' ➔ ')}`;
    }

    return {
      text: `👤 Maklumat Waris: ${target.fullName} (${target.id})\n- Nama Panggilan: ${target.nickname || '-'}\n- Generasi: Ke-${target.generation}\n- Bapa: ${bapa?.fullName || '-'}\n- Ibu: ${ibu?.fullName || '-'}\n- Pasangan: ${spouses.join(', ') || 'Tiada direkodkan'}\n- Anak-anak (${children.length}): ${children.join(', ') || 'Tiada direkodkan'}\n- Status: ${target.isVerified ? '🟢 Disahkan (Verified)' : '🟡 Menunggu Pengesahan'}${relWithUser}`,
      highlightPersonIds: [target.id],
    };
  }

  // Default strictly controlled response (No Hallucination)
  return {
    text: `Saya tidak menemui maklumat yang mencukupi untuk carian tersebut dalam pangkalan data WARIS MAMAT & HAFSAH.\n\nSila cuba bertanya mengenai:\n- Nama waris (contoh: "Siapa Ahmad bin Abdullah?")\n- Susur galur generasi (contoh: "Siapa anak Mamat?", "Siapa cucu Hafsah?")\n- Hubungan & Mahram (contoh: "Adakah sepupu mahram?", "Apakah hubungan saya dengan Ali?")\n- Statistik keseluruhan waris.`,
  };
}
