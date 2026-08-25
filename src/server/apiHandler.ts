import { GoogleGenAI } from '@google/genai';

interface AIWarisRequestBody {
  query: string;
  currentPerson?: { id: string; fullName: string; gender: string; generation: number } | null;
  targetPersonId?: string;
  familyContext: {
    totalCount: number;
    generationsCount: number;
    personsSummary: string;
    relationshipSummary?: string;
  };
}

export async function handleAIWarisRequest(body: AIWarisRequestBody): Promise<{ answer: string; relatedPersonIds: string[]; actionSuggestion?: string }> {
  const { query, currentPerson, familyContext } = body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      answer: `[AI WARIS] Maklumat pangkalan data: Kami mendapati ${familyContext.totalCount} orang waris merangkumi ${familyContext.generationsCount} generasi keturunan Tok Ayah Mamat bin Ismail & Tok Mak Hafsah binti Ismail. (Nota: Sila pastikan GEMINI_API_KEY dikonfigurasi untuk jawapan AI generasi termaju).`,
      relatedPersonIds: [],
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `Anda adalah "AI WARIS", pembantu pintar rasmi bagi keluarga keturunan:
MAMAT BIN ISMAIL (WMH-000001) & HAFSAH BINTI ISMAIL (WMH-000002).
Tagline: "Mengenali Waris, Menghubungkan Keluarga, Memelihara Silaturahim."

PERATURAN MUTLAK & PENTING:
1. TIDAK BOLEH MEREKA DATA (NO HALLUCINATION):
   - Gunakan HANYA data waris sebenar yang diberikan dalam konteks di bawah.
   - Jika maklumat tiada atau tidak mencukupi, jawab dengan tegas dan sopan:
     "Maklumat tersebut belum direkodkan dalam pangkalan data WARIS MAMAT & HAFSAH."
   - Jangan reka nama, anak, pasangan, hubungan, generasi, atau tahun.
2. PRINSIP KEKELUARGAAN & HUKUM ISLAM:
   - Apabila ditanya tentang Mahram / Ajnabi / Aurat / Bersalaman / Perkahwinan:
     - Nyatakan bahawa hubungan Nasab (ibu bapa, anak, adik-beradik, pakcik/makcik kandung, anak saudara) adalah Mahram Muabbad.
     - Hubungan Perkahwinan (mertua, menantu) adalah Mahram Muabbad.
     - Hubungan Ipar adalah Mahram Muaqqat (sementara dalam bab larangan himpun nikah), namun dari segi BATAS AURAT dan BERSALAMAN adalah AJNABI (sama seperti orang luar/haram bersentuhan).
     - Sepupu (anak pakcik/makcik) BUKANLAH MAHRAM (AJNABI) walaupun hubungan darah dekat. Boleh bernikah, wajib tutup aurat, dan tidak boleh bersalaman kulit ke kulit.
   - Sertakan disclaimer fiqh secara ringkas: "Maklumat berkaitan hukum Islam dalam aplikasi ini adalah penerangan umum berdasarkan sumber yang digunakan oleh sistem dan bukan fatwa peribadi. Untuk persoalan khusus atau kes yang kompleks, rujuk ustaz/ustazah atau pihak berautoriti agama."
3. FORMAT JAWAPAN:
   - Ringkas, jelas, bersopan santun (bahasa Melayu yang elok dan mesra).
   - Tunjukkan struktur hubungan atau rajah anak panah jika menerangkan susur galur (contoh: Tok Ayah Mamat ↓ Anak ↓ Cucu).

DATA PANGKALAN DATA SEMASA:
- Jumlah Waris: ${familyContext.totalCount}
- Bilangan Generasi: ${familyContext.generationsCount}
- Pengguna Semasa: ${currentPerson ? `${currentPerson.fullName} (${currentPerson.gender === 'male' ? 'Lelaki' : 'Perempuan'}, Gen ${currentPerson.generation})` : 'Belum memilih profil peribadi'}
- Senarai Ringkas Waris:
${familyContext.personsSummary}
${familyContext.relationshipSummary ? `\n- Analisis Hubungan Khusus:\n${familyContext.relationshipSummary}` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for high factual accuracy
      },
    });

    const answer = response.text || 'Maaf, tiada jawapan dijana.';
    return {
      answer,
      relatedPersonIds: [],
    };
  } catch (error: any) {
    console.error('Error generating AI Waris response:', error);
    return {
      answer: `Maaf, berlaku ralat ketika menghubungi model AI: ${error.message || 'Ralat sambungan'}. Sila cuba sebentar lagi atau gunakan kalkulator hubungan sistem.`,
      relatedPersonIds: [],
    };
  }
}
