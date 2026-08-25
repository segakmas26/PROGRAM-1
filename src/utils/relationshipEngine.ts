import { Person, RelationshipResult } from '../types/family';

/**
 * Advanced Genealogical Relationship Engine
 * Calculates exact relationships between Person A and Person B in the Malay genealogical tradition:
 * - Keturunan Langsung: Anak, Cucu, Cicit, Piut, Piut-piut (Generasi ke-5), Miut/Antah (Generasi ke-6+)
 * - Leluhur Langsung: Bapa/Ibu, Datuk/Nenek, Moyang, Moyang Piut (Tok Buyut), Moyang Piut-piut (Tok Onget)
 * - Adik-Beradik: Abang, Kakak, Adik (kandung, se-bapa, se-ibu) dengan gelaran tradisi (Pak Long, Pak Ngah, etc.)
 * - Bapa Saudara & Ibu Saudara: Pakcik, Makcik (sebelah bapa/ibu), Datuk/Nenek Saudara, Moyang Saudara, Moyang Piut Saudara
 * - Anak Saudara & Keturunan Saudara: Anak Saudara, Cucu Saudara, Cicit Saudara, Piut Saudara, Piut-piut Saudara
 * - Sepupu: Sepupu Pertama (1st cousin), Sepupu Kedua (2nd cousin / 2 pupus), Sepupu Ketiga (3rd cousin / 3 pupus), Sepupu Keempat (4 pupus), Anak Sepupu, Cucu Sepupu, Bapa/Ibu Saudara Sepupu, Datuk Saudara Sepupu
 * - Hubungan Semenda (In-Laws): Pasangan, Mertua, Menantu, Cucu Menantu, Cicit Menantu, Ipar, Biras, Besan, Ipar Sepupu, Saudara Mertua
 */

export function findRelationship(
  personAId: string,
  personBId: string,
  allPersons: Person[]
): RelationshipResult | null {
  const personMap = new Map<string, Person>();
  allPersons.forEach((p) => personMap.set(p.id, p));

  const personA = personMap.get(personAId);
  const personB = personMap.get(personBId);

  if (!personA || !personB) return null;

  const genA = personA.generation || getGenerationFallback(personA, personMap);
  const genB = personB.generation || getGenerationFallback(personB, personMap);
  const generationLabelA = formatGenerationBadge(genA);
  const generationLabelB = formatGenerationBadge(genB);

  // ================= 1. SAME PERSON =================
  if (personAId === personBId) {
    return {
      personA,
      personB,
      relationshipName: 'Diri Sendiri',
      category: 'DIRI',
      generationalDifference: 0,
      generationLabelA,
      generationLabelB,
      directPath: [personA.fullName],
      pathDetails: [{ from: personA, to: personB, relation: 'Individu yang sama' }],
      detailedSteps: [
        {
          stepIndex: 1,
          from: personA,
          to: personB,
          relation: 'Diri Sendiri',
          direction: 'LATERAL',
        },
      ],
      explanation: `${personA.fullName} ialah diri anda sendiri.`,
      traditionalHonorific: 'Diri Sendiri',
      kinshipSide: 'Langsung',
      commonAncestors: [personA],
      isDirectDescendant: false,
      isSibling: false,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 2. SPOUSE (PASANGAN) =================
  if (personA.spouseIds?.includes(personBId) || personB.spouseIds?.includes(personAId)) {
    const isWife = personB.gender === 'female';
    const relName = isWife ? 'Isteri' : 'Suami';
    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'PASANGAN',
      generationalDifference: 0,
      generationLabelA,
      generationLabelB,
      directPath: [personA.fullName, `Pasangan (${relName})`, personB.fullName],
      pathDetails: [{ from: personA, to: personB, relation: relName }],
      detailedSteps: [
        {
          stepIndex: 1,
          from: personA,
          to: personB,
          relation: `Pasangan (${relName})`,
          direction: 'SPOUSE',
        },
      ],
      explanation: `${personB.fullName} ialah ${relName.toLowerCase()} yang sah kepada ${personA.fullName}.`,
      traditionalHonorific: relName,
      kinshipSide: 'Perkahwinan',
      commonAncestors: [],
      isDirectDescendant: false,
      isSibling: false,
      isCousin: false,
      isSpouse: true,
      isInLaw: false,
    };
  }

  // ================= 3. DIRECT PARENT - CHILD =================
  // Person B is child of Person A
  if (personB.fatherId === personAId || personB.motherId === personAId || personA.childrenIds?.includes(personBId)) {
    const relName = personB.gender === 'female' ? 'Anak Perempuan Kandung' : 'Anak Lelaki Kandung';
    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'KETURUNAN_LANGSUNG',
      generationalDifference: 1,
      generationLabelA,
      generationLabelB,
      directPath: [personA.fullName, relName, personB.fullName],
      pathDetails: [{ from: personA, to: personB, relation: relName }],
      detailedSteps: [
        {
          stepIndex: 1,
          from: personA,
          to: personB,
          relation: relName,
          direction: 'DOWN',
        },
      ],
      explanation: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName} (generasi ke-${genB}).`,
      traditionalHonorific: 'Anak',
      kinshipSide: 'Langsung',
      commonAncestors: [personA],
      isDirectDescendant: true,
      isSibling: false,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // Person B is parent of Person A
  if (personA.fatherId === personBId || personA.motherId === personBId) {
    const relName = personB.gender === 'female' ? 'Ibu Kandung' : 'Bapa Kandung';
    const honorific = personB.gender === 'female' ? 'Ibu / Mak' : 'Bapa / Ayah';
    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'LELUHUR_LANGSUNG',
      generationalDifference: -1,
      generationLabelA,
      generationLabelB,
      directPath: [personA.fullName, relName, personB.fullName],
      pathDetails: [{ from: personA, to: personB, relation: relName }],
      detailedSteps: [
        {
          stepIndex: 1,
          from: personA,
          to: personB,
          relation: relName,
          direction: 'UP',
        },
      ],
      explanation: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName} (generasi ke-${genB}).`,
      traditionalHonorific: honorific,
      kinshipSide: 'Langsung',
      commonAncestors: [personB],
      isDirectDescendant: false,
      isSibling: false,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 4. SIBLINGS (ADIK-BERADIK) =================
  const isFullSibling =
    personA.fatherId &&
    personB.fatherId &&
    personA.fatherId === personB.fatherId &&
    personA.motherId &&
    personB.motherId &&
    personA.motherId === personB.motherId;

  const isHalfSiblingFather =
    personA.fatherId && personB.fatherId && personA.fatherId === personB.fatherId && (!personA.motherId || !personB.motherId || personA.motherId !== personB.motherId);

  const isHalfSiblingMother =
    personA.motherId && personB.motherId && personA.motherId === personB.motherId && (!personA.fatherId || !personB.fatherId || personA.fatherId !== personB.fatherId);

  if (isFullSibling || isHalfSiblingFather || isHalfSiblingMother) {
    const aBirth = personA.birthYear || 0;
    const bBirth = personB.birthYear || 0;
    const aOrder = personA.birthOrder || 0;
    const bOrder = personB.birthOrder || 0;

    let isOlder = false;
    if (aOrder && bOrder) {
      isOlder = bOrder < aOrder;
    } else if (aBirth && bBirth) {
      isOlder = bBirth < aBirth;
    }

    let title = 'Adik-beradik';
    if (personB.gender === 'female') {
      title = isOlder ? 'Kakak Kandung' : 'Adik Perempuan';
    } else {
      title = isOlder ? 'Abang Kandung' : 'Adik Lelaki';
    }

    const typeDesc = isFullSibling ? 'seibu sebapa' : isHalfSiblingFather ? 'se-bapa' : 'se-ibu';
    const relName = `${title} (${typeDesc})`;
    const honorific = getTraditionalSiblingHonorific(personB, isOlder);

    const parents: Person[] = [];
    if (personA.fatherId && personMap.get(personA.fatherId)) parents.push(personMap.get(personA.fatherId)!);
    if (personA.motherId && personMap.get(personA.motherId)) parents.push(personMap.get(personA.motherId)!);

    const parentNames = parents.map((p) => p.nickname || p.fullName).join(' & ');

    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'ADIK_BERADIK',
      generationalDifference: 0,
      generationLabelA,
      generationLabelB,
      directPath: [personA.fullName, `Ibu Bapa Bersama (${parentNames})`, personB.fullName],
      pathDetails: [{ from: personA, to: personB, relation: relName }],
      detailedSteps: [
        {
          stepIndex: 1,
          from: personA,
          to: parents[0] || personA,
          relation: 'Ibu/Bapa',
          direction: 'UP',
        },
        {
          stepIndex: 2,
          from: parents[0] || personA,
          to: personB,
          relation: relName,
          direction: 'DOWN',
        },
      ],
      explanation: `${personB.fullName} ialah ${title.toLowerCase()} (${typeDesc}) kepada ${personA.fullName}, berkongsi ibu bapa (${parentNames}).`,
      traditionalHonorific: honorific,
      kinshipSide: 'Langsung',
      commonAncestors: parents,
      isDirectDescendant: false,
      isSibling: true,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 5. DIRECT DESCENDANTS (CUCU, CICIT, PIUT, PIUT-PIUT) =================
  const descendantPath = findDescendantPath(personA, personB, personMap);
  if (descendantPath) {
    const steps = descendantPath.length - 1; // 1=anak, 2=cucu, 3=cicit, 4=piut, 5=piut-piut, 6=miut/antah
    const isFemale = personB.gender === 'female';

    let relName = '';
    let honorific = '';

    if (steps === 2) {
      relName = isFemale ? 'Cucu Perempuan' : 'Cucu Lelaki';
      honorific = 'Cucu';
    } else if (steps === 3) {
      relName = isFemale ? 'Cicit Perempuan' : 'Cicit Lelaki';
      honorific = 'Cicit';
    } else if (steps === 4) {
      relName = isFemale ? 'Piut Perempuan' : 'Piut Lelaki';
      honorific = 'Piut (Keturunan Generasi ke-4)';
    } else if (steps === 5) {
      relName = isFemale ? 'Piut-piut Perempuan (Generasi ke-5)' : 'Piut-piut Lelaki (Generasi ke-5)';
      honorific = 'Piut-piut / Onget';
    } else if (steps === 6) {
      relName = isFemale ? 'Piut-piut Generasi ke-6 (Perempuan)' : 'Piut-piut Generasi ke-6 (Lelaki)';
      honorific = 'Miut / Generasi ke-6';
    } else {
      relName = `Keturunan Generasi ke-${steps} (${isFemale ? 'Perempuan' : 'Lelaki'})`;
      honorific = `Keturunan Tingkat ke-${steps}`;
    }

    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'KETURUNAN_LANGSUNG',
      generationalDifference: steps,
      generationLabelA,
      generationLabelB,
      directPath: descendantPath.map((p) => p.fullName),
      pathDetails: buildPathDetails(descendantPath),
      detailedSteps: buildDetailedStepsFromPath(descendantPath),
      explanation: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName} (jarak ${steps} generasi ke bawah salasilah).`,
      traditionalHonorific: honorific,
      kinshipSide: 'Langsung',
      commonAncestors: [personA],
      isDirectDescendant: true,
      isSibling: false,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 6. DIRECT ANCESTORS (DATUK, NENEK, MOYANG, MOYANG PIUT, MOYANG PIUT-PIUT) =================
  const ancestorPath = findDescendantPath(personB, personA, personMap);
  if (ancestorPath) {
    const steps = ancestorPath.length - 1;
    const isFemale = personB.gender === 'female';

    let relName = '';
    let honorific = '';

    if (steps === 2) {
      relName = isFemale ? 'Nenek Kandung' : 'Datuk Kandung';
      honorific = isFemale ? 'Tok Mak / Nenek / Tok Wan' : 'Tok Ayah / Datuk / Tok Aki';
    } else if (steps === 3) {
      relName = isFemale ? 'Moyang Perempuan' : 'Moyang Lelaki';
      honorific = 'Tok Moyang';
    } else if (steps === 4) {
      relName = isFemale ? 'Moyang Piut Perempuan (Tok Buyut)' : 'Moyang Piut Lelaki (Tok Buyut)';
      honorific = 'Moyang Piut / Tok Buyut';
    } else if (steps === 5) {
      relName = isFemale ? 'Moyang Piut-piut Perempuan (Tok Onget)' : 'Moyang Piut-piut Lelaki (Tok Onget)';
      honorific = 'Moyang Piut-piut / Tok Onget';
    } else {
      relName = `Leluhur Generasi ke-${steps} (${isFemale ? 'Perempuan' : 'Lelaki'})`;
      honorific = `Leluhur Tingkat ke-${steps}`;
    }

    const reversedPath = [...ancestorPath].reverse();

    return {
      personA,
      personB,
      relationshipName: relName,
      category: 'LELUHUR_LANGSUNG',
      generationalDifference: -steps,
      generationLabelA,
      generationLabelB,
      directPath: reversedPath.map((p) => p.fullName),
      pathDetails: buildPathDetailsReversed(reversedPath),
      detailedSteps: buildDetailedStepsFromPathReversed(reversedPath),
      explanation: `${personB.fullName} ialah ${relName.toLowerCase()} kepada ${personA.fullName} (jarak ${steps} generasi ke atas salasilah).`,
      traditionalHonorific: honorific,
      kinshipSide: 'Langsung',
      commonAncestors: [personB],
      isDirectDescendant: false,
      isSibling: false,
      isCousin: false,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 7. UNCLE / AUNT / GRAND-UNCLE / GREAT-GRAND-UNCLE =================
  // Person B is Sibling of an Ancestor of Person A
  const uncleResult = checkUncleAuntHierarchy(personA, personB, allPersons, personMap);
  if (uncleResult) {
    return {
      ...uncleResult,
      generationLabelA,
      generationLabelB,
    };
  }

  // ================= 8. NIECE / NEPHEW / GRAND-NIECE / GREAT-GRAND-NIECE =================
  // Person B is Descendant of a Sibling of Person A
  const nephewResult = checkNephewNieceHierarchy(personA, personB, allPersons, personMap);
  if (nephewResult) {
    return {
      ...nephewResult,
      generationLabelA,
      generationLabelB,
    };
  }

  // ================= 9. COUSINS (SEPUPU) - ALL DEGREES & GENERATION REMOVALS =================
  const cousinResult = checkCousinRelationship(personA, personB, personMap);
  if (cousinResult) {
    return {
      ...cousinResult,
      generationLabelA,
      generationLabelB,
    };
  }

  // ================= 10. IN-LAWS & AFFINITY (HUBUNGAN SEMENDA & PERKAHWINAN) =================
  const inLawResult = checkInLaws(personA, personB, allPersons, personMap);
  if (inLawResult) {
    return {
      ...inLawResult,
      generationLabelA,
      generationLabelB,
    };
  }

  // ================= 11. GENERAL WARIS MAMAT & HAFSAH DESCENDANT LINK =================
  const isDescOfRootA = isDescendantOfRoot(personA, personMap);
  const isDescOfRootB = isDescendantOfRoot(personB, personMap);

  if (isDescOfRootA && isDescOfRootB) {
    const genDiff = genB - genA;
    const genTitle =
      genDiff === 0
        ? 'Saudara Sebaya Salasilah'
        : genDiff > 0
        ? `Waris Generasi Bawah (${genDiff} tingkat)`
        : `Waris Generasi Atas (${Math.abs(genDiff)} tingkat)`;

    const shortestPath = findShortestKinshipPath(personA, personB, personMap);
    const root1 = personMap.get('WMH-000001');
    const root2 = personMap.get('WMH-000002');
    const commonRoots = [root1, root2].filter(Boolean) as Person[];

    return {
      personA,
      personB,
      relationshipName: `Ahli Waris Salasilah (${genTitle})`,
      category: 'WARIS_SALASILAH',
      generationalDifference: genDiff,
      generationLabelA,
      generationLabelB,
      directPath: shortestPath ? shortestPath.map((p) => p.fullName) : [personA.fullName, 'Susur Galur Tok Mamat & Tok Hafsah', personB.fullName],
      pathDetails: shortestPath ? buildPathDetails(shortestPath) : [{ from: personA, to: personB, relation: genTitle }],
      detailedSteps: shortestPath ? buildDetailedStepsFromPath(shortestPath) : undefined,
      explanation: `${personA.fullName} (${generationLabelA}) dan ${personB.fullName} (${generationLabelB}) kedua-duanya tergolong dalam salasilah keturunan Tok Ayah Mamat bin Ismail & Tok Mak Hafsah binti Ismail.`,
      traditionalHonorific: 'Waris Keluarga',
      kinshipSide: 'Salasilah Rasmi',
      commonAncestors: commonRoots,
      isDirectDescendant: false,
      isSibling: false,
      isCousin: true,
      isSpouse: false,
      isInLaw: false,
    };
  }

  // ================= 12. FALLBACK =================
  const shortestAnyPath = findShortestKinshipPath(personA, personB, personMap);
  const genDiff = genB - genA;

  return {
    personA,
    personB,
    relationshipName: 'Pertalian Belum Ditetapkan',
    category: 'LAIN',
    generationalDifference: genDiff,
    generationLabelA,
    generationLabelB,
    directPath: shortestAnyPath ? shortestAnyPath.map((p) => p.fullName) : [personA.fullName, 'Pangkalan Data Waris', personB.fullName],
    pathDetails: shortestAnyPath ? buildPathDetails(shortestAnyPath) : [{ from: personA, to: personB, relation: 'Belum terhubung secara terus' }],
    detailedSteps: shortestAnyPath ? buildDetailedStepsFromPath(shortestAnyPath) : undefined,
    explanation: `Hubungan antara ${personA.fullName} dan ${personB.fullName} belum dapat ditentukan secara tepat berdasarkan data semasa yang direkodkan.`,
    traditionalHonorific: 'Saudara',
    kinshipSide: 'Umum',
    commonAncestors: [],
    isDirectDescendant: false,
    isSibling: false,
    isCousin: false,
    isSpouse: false,
    isInLaw: false,
  };
}

// ================= HELPER FUNCTIONS =================

/**
 * Check if Person B is Uncle / Aunt / Grand-Uncle / Great-Grand-Uncle of Person A
 */
function checkUncleAuntHierarchy(
  personA: Person,
  personB: Person,
  allPersons: Person[],
  personMap: Map<string, Person>
): RelationshipResult | null {
  const isFemale = personB.gender === 'female';

  // Level 1: B is sibling of parent of A (Bapa Saudara / Ibu Saudara)
  const parentsA = [personA.fatherId, personA.motherId]
    .filter(Boolean)
    .map((id) => personMap.get(id!))
    .filter(Boolean) as Person[];

  for (const parent of parentsA) {
    const parentSibRel = findRelationship(parent.id, personB.id, allPersons);
    if (parentSibRel && parentSibRel.isSibling) {
      const side = parent.gender === 'male' ? 'sebelah bapa' : 'sebelah ibu';
      const sideLabel = parent.gender === 'male' ? 'Sebelah Bapa (Paternal)' : 'Sebelah Ibu (Maternal)';
      const title = isFemale ? 'Ibu Saudara (Makcik)' : 'Bapa Saudara (Pakcik)';
      const relName = `${title} (${side})`;
      const honorific = personB.nickname || getTraditionalUncleHonorific(personB);

      return {
        personA,
        personB,
        relationshipName: relName,
        category: 'SAUDARA_IBU_BAPA',
        generationalDifference: -1,
        directPath: [personA.fullName, `${parent.gender === 'male' ? 'Bapa' : 'Ibu'} (${parent.fullName})`, relName, personB.fullName],
        pathDetails: [
          { from: personA, to: parent, relation: parent.gender === 'male' ? 'Bapa Kandung' : 'Ibu Kandung' },
          { from: parent, to: personB, relation: parentSibRel.relationshipName },
        ],
        detailedSteps: [
          {
            stepIndex: 1,
            from: personA,
            to: parent,
            relation: parent.gender === 'male' ? 'Bapa Kandung' : 'Ibu Kandung',
            direction: 'UP',
          },
          {
            stepIndex: 2,
            from: parent,
            to: personB,
            relation: `Saudara Kandung (${isFemale ? 'Kakak/Adik' : 'Abang/Adik'})`,
            direction: 'LATERAL',
          },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} ${side} kepada ${personA.fullName} (saudara kandung kepada ${parent.gender === 'male' ? 'bapa' : 'ibu'} anda, ${parent.fullName}).`,
        traditionalHonorific: honorific,
        kinshipSide: sideLabel,
        commonAncestors: parentSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 2: B is sibling of Grandparent of A (Datuk Saudara / Nenek Saudara)
  const grandparentsA = getAncestorsAtLevel(personA, 2, personMap);
  for (const gp of grandparentsA) {
    const gpSibRel = findRelationship(gp.id, personB.id, allPersons);
    if (gpSibRel && gpSibRel.isSibling) {
      const title = isFemale ? 'Nenek Saudara' : 'Datuk Saudara (Tok Saudara)';
      const relName = `${title}`;
      const honorific = isFemale ? 'Tok Nenek Saudara' : 'Tok Ayah Saudara / Tok Wan';

      return {
        personA,
        personB,
        relationshipName: relName,
        category: 'DATUK_NENEK_SAUDARA',
        generationalDifference: -2,
        directPath: [personA.fullName, `Datuk/Nenek (${gp.fullName})`, `Saudara Datuk/Nenek`, personB.fullName],
        pathDetails: [
          { from: personA, to: gp, relation: gp.gender === 'male' ? 'Datuk Kandung' : 'Nenek Kandung' },
          { from: gp, to: personB, relation: gpSibRel.relationshipName },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: gp, relation: 'Datuk/Nenek Kandung', direction: 'UP' },
          { stepIndex: 2, from: gp, to: personB, relation: 'Saudara Kandung Datuk/Nenek', direction: 'LATERAL' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (saudara kandung kepada datuk/nenek anda, ${gp.fullName}).`,
        traditionalHonorific: honorific,
        kinshipSide: 'Sebelah Datuk/Nenek',
        commonAncestors: gpSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 3: B is sibling of Great-Grandparent of A (Moyang Saudara)
  const greatGrandparentsA = getAncestorsAtLevel(personA, 3, personMap);
  for (const ggp of greatGrandparentsA) {
    const ggpSibRel = findRelationship(ggp.id, personB.id, allPersons);
    if (ggpSibRel && ggpSibRel.isSibling) {
      const title = isFemale ? 'Moyang Saudara Perempuan' : 'Moyang Saudara Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'MOYANG_SAUDARA',
        generationalDifference: -3,
        directPath: [personA.fullName, `Moyang (${ggp.fullName})`, `Saudara Moyang`, personB.fullName],
        pathDetails: [
          { from: personA, to: ggp, relation: 'Moyang Kandung' },
          { from: ggp, to: personB, relation: ggpSibRel.relationshipName },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: ggp, relation: 'Moyang Kandung', direction: 'UP' },
          { stepIndex: 2, from: ggp, to: personB, relation: 'Saudara Kandung Moyang', direction: 'LATERAL' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (saudara kandung kepada moyang anda, ${ggp.fullName}).`,
        traditionalHonorific: 'Tok Moyang Saudara',
        kinshipSide: 'Sebelah Moyang',
        commonAncestors: ggpSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 4: B is sibling of Great-great-grandparent (Moyang Piut Saudara / Tok Buyut Saudara)
  const gggpA = getAncestorsAtLevel(personA, 4, personMap);
  for (const buyut of gggpA) {
    const buyutSibRel = findRelationship(buyut.id, personB.id, allPersons);
    if (buyutSibRel && buyutSibRel.isSibling) {
      const title = isFemale ? 'Moyang Piut Saudara (Perempuan)' : 'Moyang Piut Saudara (Lelaki)';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'MOYANG_SAUDARA',
        generationalDifference: -4,
        directPath: [personA.fullName, `Tok Buyut (${buyut.fullName})`, `Saudara Tok Buyut`, personB.fullName],
        pathDetails: [
          { from: personA, to: buyut, relation: 'Moyang Piut Kandung' },
          { from: buyut, to: personB, relation: buyutSibRel.relationshipName },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: buyut, relation: 'Moyang Piut (Tok Buyut)', direction: 'UP' },
          { stepIndex: 2, from: buyut, to: personB, relation: 'Saudara Tok Buyut', direction: 'LATERAL' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (saudara kandung kepada moyang piut anda, ${buyut.fullName}).`,
        traditionalHonorific: 'Tok Buyut Saudara',
        kinshipSide: 'Sebelah Tok Buyut',
        commonAncestors: buyutSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  return null;
}

/**
 * Check if Person B is Niece / Nephew / Grand-Niece / Great-Grand-Niece of Person A
 */
function checkNephewNieceHierarchy(
  personA: Person,
  personB: Person,
  allPersons: Person[],
  personMap: Map<string, Person>
): RelationshipResult | null {
  const isFemale = personB.gender === 'female';

  // Level 1: B is child of Sibling of A (Anak Saudara)
  const parentsB = [personB.fatherId, personB.motherId]
    .filter(Boolean)
    .map((id) => personMap.get(id!))
    .filter(Boolean) as Person[];

  for (const parent of parentsB) {
    const aSibRel = findRelationship(personA.id, parent.id, allPersons);
    if (aSibRel && aSibRel.isSibling) {
      const title = isFemale ? 'Anak Saudara Perempuan' : 'Anak Saudara Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'ANAK_SAUDARA',
        generationalDifference: 1,
        directPath: [personA.fullName, `Saudara Kandung (${parent.fullName})`, title, personB.fullName],
        pathDetails: [
          { from: personA, to: parent, relation: aSibRel.relationshipName },
          { from: parent, to: personB, relation: isFemale ? 'Anak Perempuan' : 'Anak Lelaki' },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: parent, relation: aSibRel.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: parent, to: personB, relation: isFemale ? 'Anak Perempuan' : 'Anak Lelaki', direction: 'DOWN' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (anak kandung kepada saudara anda, ${parent.fullName}).`,
        traditionalHonorific: 'Anak Saudara',
        kinshipSide: 'Saudara Kandung',
        commonAncestors: aSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 2: B is grandchild of Sibling of A (Cucu Saudara)
  const grandparentsB = getAncestorsAtLevel(personB, 2, personMap);
  for (const gp of grandparentsB) {
    const aSibRel = findRelationship(personA.id, gp.id, allPersons);
    if (aSibRel && aSibRel.isSibling) {
      const title = isFemale ? 'Cucu Saudara Perempuan' : 'Cucu Saudara Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'CUCU_SAUDARA',
        generationalDifference: 2,
        directPath: [personA.fullName, `Saudara Kandung (${gp.fullName})`, `Keturunan Cucu`, personB.fullName],
        pathDetails: [
          { from: personA, to: gp, relation: aSibRel.relationshipName },
          { from: gp, to: personB, relation: title },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: gp, relation: aSibRel.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: gp, to: personB, relation: 'Keturunan Cucu', direction: 'DOWN' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (cucu kepada saudara anda, ${gp.fullName}).`,
        traditionalHonorific: 'Cucu Saudara',
        kinshipSide: 'Saudara Kandung',
        commonAncestors: aSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 3: B is great-grandchild of Sibling of A (Cicit Saudara)
  const ggpB = getAncestorsAtLevel(personB, 3, personMap);
  for (const ggp of ggpB) {
    const aSibRel = findRelationship(personA.id, ggp.id, allPersons);
    if (aSibRel && aSibRel.isSibling) {
      const title = isFemale ? 'Cicit Saudara Perempuan' : 'Cicit Saudara Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'CICIT_SAUDARA',
        generationalDifference: 3,
        directPath: [personA.fullName, `Saudara Kandung (${ggp.fullName})`, `Keturunan Cicit`, personB.fullName],
        pathDetails: [
          { from: personA, to: ggp, relation: aSibRel.relationshipName },
          { from: ggp, to: personB, relation: title },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: ggp, relation: aSibRel.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: ggp, to: personB, relation: 'Keturunan Cicit', direction: 'DOWN' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (cicit kepada saudara anda, ${ggp.fullName}).`,
        traditionalHonorific: 'Cicit Saudara',
        kinshipSide: 'Saudara Kandung',
        commonAncestors: aSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 4: B is great-great-grandchild of Sibling of A (Piut Saudara)
  const gggpB = getAncestorsAtLevel(personB, 4, personMap);
  for (const gggp of gggpB) {
    const aSibRel = findRelationship(personA.id, gggp.id, allPersons);
    if (aSibRel && aSibRel.isSibling) {
      const title = isFemale ? 'Piut Saudara Perempuan' : 'Piut Saudara Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'PIUT_SAUDARA',
        generationalDifference: 4,
        directPath: [personA.fullName, `Saudara Kandung (${gggp.fullName})`, `Keturunan Piut`, personB.fullName],
        pathDetails: [
          { from: personA, to: gggp, relation: aSibRel.relationshipName },
          { from: gggp, to: personB, relation: title },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: gggp, relation: aSibRel.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: gggp, to: personB, relation: 'Keturunan Piut', direction: 'DOWN' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (piut kepada saudara anda, ${gggp.fullName}).`,
        traditionalHonorific: 'Piut Saudara',
        kinshipSide: 'Saudara Kandung',
        commonAncestors: aSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  // Level 5: B is 5th gen descendant of Sibling of A (Piut-piut Saudara)
  const g5B = getAncestorsAtLevel(personB, 5, personMap);
  for (const anc of g5B) {
    const aSibRel = findRelationship(personA.id, anc.id, allPersons);
    if (aSibRel && aSibRel.isSibling) {
      const title = isFemale ? 'Piut-piut Saudara Perempuan (Gen-5)' : 'Piut-piut Saudara Lelaki (Gen-5)';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'PIUT_PIUT_SAUDARA',
        generationalDifference: 5,
        directPath: [personA.fullName, `Saudara Kandung (${anc.fullName})`, `Keturunan Piut-piut`, personB.fullName],
        pathDetails: [
          { from: personA, to: anc, relation: aSibRel.relationshipName },
          { from: anc, to: personB, relation: title },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: anc, relation: aSibRel.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: anc, to: personB, relation: 'Keturunan Piut-piut', direction: 'DOWN' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (piut-piut generasi ke-5 kepada saudara anda, ${anc.fullName}).`,
        traditionalHonorific: 'Piut-piut Saudara',
        kinshipSide: 'Saudara Kandung',
        commonAncestors: aSibRel.commonAncestors,
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: false,
      };
    }
  }

  return null;
}

/**
 * Check Cousin relationship (Sepupu Pertama, Sepupu Kedua, Sepupu Ketiga, Sepupu Keempat,
 * and Cousins Removed).
 */
function checkCousinRelationship(
  personA: Person,
  personB: Person,
  personMap: Map<string, Person>
): RelationshipResult | null {
  const ancestorsA = getAllAncestorsWithDistance(personA, personMap);
  const ancestorsB = getAllAncestorsWithDistance(personB, personMap);

  // Find lowest common ancestor (minimum distance sum)
  let bestCommonAncId: string | null = null;
  let minSum = Infinity;
  let bestDistA = 0;
  let bestDistB = 0;

  for (const [ancId, distA] of ancestorsA.entries()) {
    if (ancestorsB.has(ancId)) {
      const distB = ancestorsB.get(ancId)!;
      // Exclude direct line where one is ancestor of another (handled earlier)
      if (distA > 0 && distB > 0) {
        const sum = distA + distB;
        if (sum < minSum) {
          minSum = sum;
          bestCommonAncId = ancId;
          bestDistA = distA;
          bestDistB = distB;
        }
      }
    }
  }

  if (!bestCommonAncId) return null;

  const commonAnc = personMap.get(bestCommonAncId);
  if (!commonAnc) return null;

  const distA = bestDistA;
  const distB = bestDistB;
  const minDistance = Math.min(distA, distB);
  const cousinDegree = minDistance - 1;
  const removed = Math.abs(distA - distB);
  const genDiff = distB - distA;

  // If minDistance is 1, it's sibling or uncle/nephew (already handled above)
  if (cousinDegree < 1) return null;

  let relName = '';
  let explanation = '';
  let honorific = 'Sepupu';

  // 1. Same Generation Cousins (removed === 0)
  if (removed === 0) {
    if (cousinDegree === 1) {
      relName = 'Sepupu Pertama (1st Cousin)';
      honorific = 'Sepupu Pertama';
      explanation = `${personB.fullName} ialah sepupu pertama kepada ${personA.fullName}, berkongsi datuk/nenek (${commonAnc.fullName}).`;
    } else if (cousinDegree === 2) {
      relName = 'Sepupu Kedua (2nd Cousin / Dua Pupus)';
      honorific = 'Sepupu Kedua (2 Pupus)';
      explanation = `${personB.fullName} ialah sepupu kedua (dua pupus) kepada ${personA.fullName}, berkongsi moyang (${commonAnc.fullName}).`;
    } else if (cousinDegree === 3) {
      relName = 'Sepupu Ketiga (3rd Cousin / Tiga Pupus)';
      honorific = 'Sepupu Ketiga (3 Pupus)';
      explanation = `${personB.fullName} ialah sepupu ketiga (tiga pupus) kepada ${personA.fullName}, berkongsi moyang piut (tok buyut, ${commonAnc.fullName}).`;
    } else if (cousinDegree === 4) {
      relName = 'Sepupu Keempat (4th Cousin / Empat Pupus)';
      honorific = 'Sepupu Keempat (4 Pupus)';
      explanation = `${personB.fullName} ialah sepupu keempat (empat pupus) kepada ${personA.fullName}, berkongsi moyang piut-piut (${commonAnc.fullName}).`;
    } else {
      relName = `Sepupu Generasi ke-${cousinDegree} (${cousinDegree} Pupus)`;
      honorific = `Sepupu (${cousinDegree} Pupus)`;
      explanation = `${personB.fullName} ialah sepupu generasi ke-${cousinDegree} kepada ${personA.fullName}, berkongsi leluhur (${commonAnc.fullName}).`;
    }
  } else {
    // 2. Different Generation Cousins (Removed)
    const degreeLabel =
      cousinDegree === 1
        ? 'Sepupu Pertama'
        : cousinDegree === 2
        ? 'Sepupu Kedua'
        : cousinDegree === 3
        ? 'Sepupu Ketiga'
        : `Sepupu ke-${cousinDegree}`;

    if (distA < distB) {
      // Person B is younger / lower generation
      if (removed === 1) {
        relName = `Anak ${degreeLabel} (${cousinDegree === 1 ? '1st' : `${cousinDegree}nd`} Cousin 1x Removed)`;
        honorific = `Anak ${degreeLabel}`;
        explanation = `${personB.fullName} ialah anak kepada ${degreeLabel.toLowerCase()} anda (berjarak 1 generasi ke bawah).`;
      } else if (removed === 2) {
        relName = `Cucu ${degreeLabel} (${cousinDegree === 1 ? '1st' : `${cousinDegree}nd`} Cousin 2x Removed)`;
        honorific = `Cucu ${degreeLabel}`;
        explanation = `${personB.fullName} ialah cucu kepada ${degreeLabel.toLowerCase()} anda (berjarak 2 generasi ke bawah).`;
      } else if (removed === 3) {
        relName = `Cicit ${degreeLabel} (${cousinDegree === 1 ? '1st' : `${cousinDegree}nd`} Cousin 3x Removed)`;
        honorific = `Cicit ${degreeLabel}`;
        explanation = `${personB.fullName} ialah cicit kepada ${degreeLabel.toLowerCase()} anda (berjarak 3 generasi ke bawah).`;
      } else if (removed === 4) {
        relName = `Piut ${degreeLabel} (${cousinDegree === 1 ? '1st' : `${cousinDegree}nd`} Cousin 4x Removed)`;
        honorific = `Piut ${degreeLabel}`;
        explanation = `${personB.fullName} ialah piut kepada ${degreeLabel.toLowerCase()} anda (berjarak 4 generasi ke bawah).`;
      } else {
        relName = `Keturunan ${degreeLabel} (${removed} generasi ke bawah)`;
        honorific = `Keturunan ${degreeLabel}`;
        explanation = `${personB.fullName} ialah keturunan kepada ${degreeLabel.toLowerCase()} anda (${removed} generasi ke bawah).`;
      }
    } else {
      // Person B is older / higher generation
      const isFemale = personB.gender === 'female';
      if (removed === 1) {
        const title = isFemale ? `Ibu Saudara ${degreeLabel} (Makcik Sepupu)` : `Bapa Saudara ${degreeLabel} (Pakcik Sepupu)`;
        relName = title;
        honorific = isFemale ? 'Makcik Sepupu' : 'Pakcik Sepupu';
        explanation = `${personB.fullName} ialah ${title.toLowerCase()} kepada anda (${degreeLabel.toLowerCase()} kepada ibu/bapa anda).`;
      } else if (removed === 2) {
        const title = isFemale ? `Nenek Saudara ${degreeLabel}` : `Datuk Saudara ${degreeLabel}`;
        relName = title;
        honorific = isFemale ? 'Tok Nenek Sepupu' : 'Tok Ayah Sepupu';
        explanation = `${personB.fullName} ialah ${title.toLowerCase()} kepada anda (${degreeLabel.toLowerCase()} kepada datuk/nenek anda).`;
      } else if (removed === 3) {
        const title = isFemale ? `Moyang Saudara ${degreeLabel} (Perempuan)` : `Moyang Saudara ${degreeLabel} (Lelaki)`;
        relName = title;
        honorific = 'Tok Moyang Sepupu';
        explanation = `${personB.fullName} ialah ${title.toLowerCase()} kepada anda (${degreeLabel.toLowerCase()} kepada moyang anda).`;
      } else {
        relName = `Leluhur ${degreeLabel} (${removed} generasi ke atas)`;
        honorific = `Leluhur ${degreeLabel}`;
        explanation = `${personB.fullName} ialah leluhur kepada ${degreeLabel.toLowerCase()} anda (${removed} generasi ke atas).`;
      }
    }
  }

  // Build shortest visual path through common ancestor
  const pathToAncestorA = getPathToAncestor(personA, bestCommonAncId, personMap);
  const pathToAncestorB = getPathToAncestor(personB, bestCommonAncId, personMap);

  const directPath: string[] = [];
  if (pathToAncestorA && pathToAncestorB) {
    const upPath = pathToAncestorA.map((p) => p.fullName);
    const downPath = [...pathToAncestorB].reverse().map((p) => p.fullName);
    // downPath starts with commonAnc, remove duplicate
    downPath.shift();
    directPath.push(...upPath, ...downPath);
  } else {
    directPath.push(personA.fullName, `Leluhur Bersama (${commonAnc.fullName})`, personB.fullName);
  }

  return {
    personA,
    personB,
    relationshipName: relName,
    category: 'SEPUPU',
    generationalDifference: genDiff,
    directPath,
    pathDetails: [{ from: personA, to: personB, relation: relName }],
    detailedSteps: [
      {
        stepIndex: 1,
        from: personA,
        to: commonAnc,
        relation: `Leluhur (${distA} generasi ke atas)`,
        direction: 'UP',
      },
      {
        stepIndex: 2,
        from: commonAnc,
        to: personB,
        relation: `Keturunan (${distB} generasi ke bawah)`,
        direction: 'DOWN',
      },
    ],
    explanation,
    traditionalHonorific: honorific,
    kinshipSide: 'Sepupu Salasilah',
    commonAncestors: [commonAnc],
    isDirectDescendant: false,
    isSibling: false,
    isCousin: true,
    cousinDegree,
    cousinDetail: {
      degree: cousinDegree,
      removed,
      explanation,
    },
    isSpouse: false,
    isInLaw: false,
  };
}

/**
 * Check In-Laws & Affinity (Hubungan Semenda: Mertua, Menantu, Ipar, Biras, Besan)
 */
function checkInLaws(
  personA: Person,
  personB: Person,
  allPersons: Person[],
  personMap: Map<string, Person>
): RelationshipResult | null {
  const isFemaleB = personB.gender === 'female';

  // 1. Mertua (B is parent of spouse of A)
  for (const spouseId of personA.spouseIds || []) {
    const spouse = personMap.get(spouseId);
    if (spouse) {
      if (spouse.fatherId === personB.id || spouse.motherId === personB.id) {
        const title = isFemaleB ? 'Ibu Mertua' : 'Bapa Mertua';
        return {
          personA,
          personB,
          relationshipName: title,
          category: 'SEMENDA_MERTUA',
          generationalDifference: -1,
          directPath: [personA.fullName, `Pasangan (${spouse.fullName})`, title, personB.fullName],
          pathDetails: [
            { from: personA, to: spouse, relation: 'Pasangan' },
            { from: spouse, to: personB, relation: isFemaleB ? 'Ibu Kandung' : 'Bapa Kandung' },
          ],
          detailedSteps: [
            { stepIndex: 1, from: personA, to: spouse, relation: 'Pasangan Sah', direction: 'SPOUSE' },
            { stepIndex: 2, from: spouse, to: personB, relation: isFemaleB ? 'Ibu Kandung' : 'Bapa Kandung', direction: 'UP' },
          ],
          explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (ibu/bapa kepada pasangan anda, ${spouse.fullName}).`,
          traditionalHonorific: title,
          kinshipSide: 'Sebelah Pasangan',
          commonAncestors: [],
          isDirectDescendant: false,
          isSibling: false,
          isCousin: false,
          isSpouse: false,
          isInLaw: true,
        };
      }

      // Datuk / Nenek Mertua
      const gpSpouse = getAncestorsAtLevel(spouse, 2, personMap);
      for (const gp of gpSpouse) {
        if (gp.id === personB.id) {
          const title = isFemaleB ? 'Nenek Mertua' : 'Datuk Mertua';
          return {
            personA,
            personB,
            relationshipName: title,
            category: 'SEMENDA_MERTUA',
            generationalDifference: -2,
            directPath: [personA.fullName, `Pasangan (${spouse.fullName})`, title, personB.fullName],
            pathDetails: [
              { from: personA, to: spouse, relation: 'Pasangan' },
              { from: spouse, to: personB, relation: title },
            ],
            detailedSteps: [
              { stepIndex: 1, from: personA, to: spouse, relation: 'Pasangan Sah', direction: 'SPOUSE' },
              { stepIndex: 2, from: spouse, to: personB, relation: 'Datuk/Nenek Pasangan', direction: 'UP' },
            ],
            explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (datuk/nenek kepada pasangan anda, ${spouse.fullName}).`,
            traditionalHonorific: title,
            kinshipSide: 'Sebelah Pasangan',
            commonAncestors: [],
            isDirectDescendant: false,
            isSibling: false,
            isCousin: false,
            isSpouse: false,
            isInLaw: true,
          };
        }
      }

      // Ipar: B is sibling of spouse of A
      const spouseSib = findRelationship(spouse.id, personB.id, allPersons);
      if (spouseSib && spouseSib.isSibling) {
        const title = isFemaleB ? 'Kakak/Adik Ipar' : 'Abang/Adik Ipar';
        return {
          personA,
          personB,
          relationshipName: `${title} (Saudara Pasangan)`,
          category: 'SEMENDA_IPAR',
          generationalDifference: 0,
          directPath: [personA.fullName, `Pasangan (${spouse.fullName})`, `Saudara Pasangan (Ipar)`, personB.fullName],
          pathDetails: [
            { from: personA, to: spouse, relation: 'Pasangan' },
            { from: spouse, to: personB, relation: spouseSib.relationshipName },
          ],
          detailedSteps: [
            { stepIndex: 1, from: personA, to: spouse, relation: 'Pasangan Sah', direction: 'SPOUSE' },
            { stepIndex: 2, from: spouse, to: personB, relation: 'Saudara Kandung Pasangan', direction: 'LATERAL' },
          ],
          explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (saudara kandung kepada pasangan anda, ${spouse.fullName}).`,
          traditionalHonorific: 'Ipar',
          kinshipSide: 'Sebelah Pasangan',
          commonAncestors: [],
          isDirectDescendant: false,
          isSibling: false,
          isCousin: false,
          isSpouse: false,
          isInLaw: true,
        };
      }

      // Biras: B is spouse of sibling of spouse of A (two people married to siblings)
      for (const sibId of allPersons.filter((p) => p.fatherId === spouse.fatherId && p.motherId === spouse.motherId && p.id !== spouse.id).map((p) => p.id)) {
        const sibling = personMap.get(sibId);
        if (sibling && sibling.spouseIds?.includes(personB.id)) {
          const title = 'Biras';
          return {
            personA,
            personB,
            relationshipName: `Biras (${isFemaleB ? 'Perempuan' : 'Lelaki'})`,
            category: 'SEMENDA_BIRAS',
            generationalDifference: 0,
            directPath: [personA.fullName, `Pasangan (${spouse.fullName})`, `Ipar (${sibling.fullName})`, `Biras (${personB.fullName})`],
            pathDetails: [
              { from: personA, to: spouse, relation: 'Pasangan' },
              { from: spouse, to: sibling, relation: 'Saudara Kandung' },
              { from: sibling, to: personB, relation: 'Pasangan' },
            ],
            detailedSteps: [
              { stepIndex: 1, from: personA, to: spouse, relation: 'Pasangan Sah', direction: 'SPOUSE' },
              { stepIndex: 2, from: spouse, to: sibling, relation: 'Saudara Kandung', direction: 'LATERAL' },
              { stepIndex: 3, from: sibling, to: personB, relation: 'Pasangan', direction: 'SPOUSE' },
            ],
            explanation: `${personB.fullName} ialah biras kepada ${personA.fullName} (masing-masing berkahwin dengan pasangan adik-beradik, iaitu ${spouse.fullName} dan ${sibling.fullName}).`,
            traditionalHonorific: 'Biras',
            kinshipSide: 'Perkahwinan Bersama',
            commonAncestors: [],
            isDirectDescendant: false,
            isSibling: false,
            isCousin: false,
            isSpouse: false,
            isInLaw: true,
          };
        }
      }
    }
  }

  // 2. Menantu (B is spouse of child of A)
  for (const childId of personA.childrenIds || []) {
    const child = personMap.get(childId);
    if (child && child.spouseIds?.includes(personB.id)) {
      const title = isFemaleB ? 'Menantu Perempuan' : 'Menantu Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'SEMENDA_MENANTU',
        generationalDifference: 1,
        directPath: [personA.fullName, `Anak (${child.fullName})`, title, personB.fullName],
        pathDetails: [
          { from: personA, to: child, relation: 'Anak Kandung' },
          { from: child, to: personB, relation: 'Pasangan' },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: child, relation: 'Anak Kandung', direction: 'DOWN' },
          { stepIndex: 2, from: child, to: personB, relation: 'Pasangan Sah', direction: 'SPOUSE' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (pasangan kepada anak anda, ${child.fullName}).`,
        traditionalHonorific: title,
        kinshipSide: 'Sebelah Menantu',
        commonAncestors: [],
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: true,
      };
    }

    // Besan: B is parent of spouse of child of A
    if (child) {
      for (const cSpouseId of child.spouseIds || []) {
        const cSpouse = personMap.get(cSpouseId);
        if (cSpouse && (cSpouse.fatherId === personB.id || cSpouse.motherId === personB.id)) {
          const title = isFemaleB ? 'Besan Perempuan' : 'Besan Lelaki';
          return {
            personA,
            personB,
            relationshipName: `Besan (${isFemaleB ? 'Ibu' : 'Bapa'})`,
            category: 'SEMENDA_BESAN',
            generationalDifference: 0,
            directPath: [personA.fullName, `Anak (${child.fullName})`, `Menantu (${cSpouse.fullName})`, `Besan (${personB.fullName})`],
            pathDetails: [
              { from: personA, to: child, relation: 'Anak' },
              { from: child, to: cSpouse, relation: 'Pasangan Menantu' },
              { from: cSpouse, to: personB, relation: 'Ibu/Bapa' },
            ],
            detailedSteps: [
              { stepIndex: 1, from: personA, to: child, relation: 'Anak Kandung', direction: 'DOWN' },
              { stepIndex: 2, from: child, to: cSpouse, relation: 'Pasangan (Menantu)', direction: 'SPOUSE' },
              { stepIndex: 3, from: cSpouse, to: personB, relation: 'Ibu Bapa Menantu', direction: 'UP' },
            ],
            explanation: `${personB.fullName} ialah besan kepada ${personA.fullName} (ibu bapa kepada menantu anda, ${cSpouse.fullName}).`,
            traditionalHonorific: 'Besan',
            kinshipSide: 'Hubungan Besan',
            commonAncestors: [],
            isDirectDescendant: false,
            isSibling: false,
            isCousin: false,
            isSpouse: false,
            isInLaw: true,
          };
        }
      }
    }
  }

  // 3. Ipar: B is spouse of Sibling of A
  for (const otherPerson of allPersons) {
    const relToA = findRelationship(personA.id, otherPerson.id, allPersons);
    if (relToA && relToA.isSibling && otherPerson.spouseIds?.includes(personB.id)) {
      const title = isFemaleB ? 'Kakak/Adik Ipar' : 'Abang/Adik Ipar';
      return {
        personA,
        personB,
        relationshipName: `${title} (Pasangan Saudara)`,
        category: 'SEMENDA_IPAR',
        generationalDifference: 0,
        directPath: [personA.fullName, `Saudara Kandung (${otherPerson.fullName})`, `Pasangan Saudara (Ipar)`, personB.fullName],
        pathDetails: [
          { from: personA, to: otherPerson, relation: relToA.relationshipName },
          { from: otherPerson, to: personB, relation: 'Pasangan' },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: otherPerson, relation: relToA.relationshipName, direction: 'LATERAL' },
          { stepIndex: 2, from: otherPerson, to: personB, relation: 'Pasangan', direction: 'SPOUSE' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (pasangan kepada saudara kandung anda, ${otherPerson.fullName}).`,
        traditionalHonorific: 'Ipar',
        kinshipSide: 'Sebelah Saudara Kandung',
        commonAncestors: [],
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: true,
      };
    }
  }

  // 4. Cucu Menantu (B is spouse of grandchild of A)
  const grandchildrenA = getDescendantsAtLevel(personA, 2, personMap);
  for (const gc of grandchildrenA) {
    if (gc.spouseIds?.includes(personB.id)) {
      const title = isFemaleB ? 'Cucu Menantu Perempuan' : 'Cucu Menantu Lelaki';
      return {
        personA,
        personB,
        relationshipName: title,
        category: 'SEMENDA_MENANTU',
        generationalDifference: 2,
        directPath: [personA.fullName, `Cucu (${gc.fullName})`, title, personB.fullName],
        pathDetails: [
          { from: personA, to: gc, relation: 'Cucu Kandung' },
          { from: gc, to: personB, relation: 'Pasangan' },
        ],
        detailedSteps: [
          { stepIndex: 1, from: personA, to: gc, relation: 'Cucu Kandung', direction: 'DOWN' },
          { stepIndex: 2, from: gc, to: personB, relation: 'Pasangan Cucu', direction: 'SPOUSE' },
        ],
        explanation: `${personB.fullName} ialah ${title.toLowerCase()} kepada ${personA.fullName} (pasangan kepada cucu anda, ${gc.fullName}).`,
        traditionalHonorific: 'Cucu Menantu',
        kinshipSide: 'Sebelah Cucu',
        commonAncestors: [],
        isDirectDescendant: false,
        isSibling: false,
        isCousin: false,
        isSpouse: false,
        isInLaw: true,
      };
    }
  }

  return null;
}

// ================= GRAPH TRAVERSAL & ANCESTRY UTILITIES =================

function findDescendantPath(
  ancestor: Person,
  target: Person,
  personMap: Map<string, Person>
): Person[] | null {
  const queue: { current: Person; path: Person[] }[] = [{ current: ancestor, path: [ancestor] }];
  const visited = new Set<string>();
  visited.add(ancestor.id);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current.id === target.id) {
      return path;
    }

    const childrenIds = current.childrenIds || [];
    for (const childId of childrenIds) {
      if (!visited.has(childId)) {
        visited.add(childId);
        const child = personMap.get(childId);
        if (child) {
          queue.push({ current: child, path: [...path, child] });
        }
      }
    }
  }

  return null;
}

function getAllAncestorsWithDistance(
  person: Person,
  personMap: Map<string, Person>
): Map<string, number> {
  const ancestors = new Map<string, number>();
  const queue: { personId: string; distance: number }[] = [];

  if (person.fatherId) queue.push({ personId: person.fatherId, distance: 1 });
  if (person.motherId) queue.push({ personId: person.motherId, distance: 1 });

  while (queue.length > 0) {
    const { personId, distance } = queue.shift()!;
    if (!ancestors.has(personId) || ancestors.get(personId)! > distance) {
      ancestors.set(personId, distance);
      const anc = personMap.get(personId);
      if (anc) {
        if (anc.fatherId) queue.push({ personId: anc.fatherId, distance: distance + 1 });
        if (anc.motherId) queue.push({ personId: anc.motherId, distance: distance + 1 });
      }
    }
  }

  return ancestors;
}

function getAncestorsAtLevel(
  person: Person,
  targetLevel: number,
  personMap: Map<string, Person>
): Person[] {
  const result: Person[] = [];
  const queue: { personId: string; level: number }[] = [];

  if (person.fatherId) queue.push({ personId: person.fatherId, level: 1 });
  if (person.motherId) queue.push({ personId: person.motherId, level: 1 });

  while (queue.length > 0) {
    const { personId, level } = queue.shift()!;
    const p = personMap.get(personId);
    if (!p) continue;

    if (level === targetLevel) {
      result.push(p);
    } else if (level < targetLevel) {
      if (p.fatherId) queue.push({ personId: p.fatherId, level: level + 1 });
      if (p.motherId) queue.push({ personId: p.motherId, level: level + 1 });
    }
  }

  return result;
}

function getDescendantsAtLevel(
  person: Person,
  targetLevel: number,
  personMap: Map<string, Person>
): Person[] {
  const result: Person[] = [];
  const queue: { personId: string; level: number }[] = [];

  for (const childId of person.childrenIds || []) {
    queue.push({ personId: childId, level: 1 });
  }

  while (queue.length > 0) {
    const { personId, level } = queue.shift()!;
    const p = personMap.get(personId);
    if (!p) continue;

    if (level === targetLevel) {
      result.push(p);
    } else if (level < targetLevel) {
      for (const childId of p.childrenIds || []) {
        queue.push({ personId: childId, level: level + 1 });
      }
    }
  }

  return result;
}

function getPathToAncestor(
  person: Person,
  ancestorId: string,
  personMap: Map<string, Person>
): Person[] | null {
  const queue: { current: Person; path: Person[] }[] = [{ current: person, path: [person] }];
  const visited = new Set<string>();
  visited.add(person.id);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current.id === ancestorId) {
      return path;
    }

    const parentIds = [current.fatherId, current.motherId].filter(Boolean) as string[];
    for (const pid of parentIds) {
      if (!visited.has(pid)) {
        visited.add(pid);
        const parent = personMap.get(pid);
        if (parent) {
          queue.push({ current: parent, path: [...path, parent] });
        }
      }
    }
  }

  return null;
}

function findShortestKinshipPath(
  startPerson: Person,
  endPerson: Person,
  personMap: Map<string, Person>
): Person[] | null {
  if (startPerson.id === endPerson.id) return [startPerson];

  const queue: { current: Person; path: Person[] }[] = [{ current: startPerson, path: [startPerson] }];
  const visited = new Set<string>();
  visited.add(startPerson.id);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current.id === endPerson.id) {
      return path;
    }

    // Neighbors: parents, children, spouses, siblings
    const neighborIds = new Set<string>();
    if (current.fatherId) neighborIds.add(current.fatherId);
    if (current.motherId) neighborIds.add(current.motherId);
    (current.childrenIds || []).forEach((cid) => neighborIds.add(cid));
    (current.spouseIds || []).forEach((sid) => neighborIds.add(sid));

    for (const nid of neighborIds) {
      if (!visited.has(nid)) {
        visited.add(nid);
        const neighbor = personMap.get(nid);
        if (neighbor) {
          queue.push({ current: neighbor, path: [...path, neighbor] });
        }
      }
    }
  }

  return null;
}

function buildPathDetails(path: Person[]): { from: Person; to: Person; relation: string }[] {
  const details = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    let relation = 'Keturunan';

    if (to.fatherId === from.id || to.motherId === from.id || from.childrenIds?.includes(to.id)) {
      relation = to.gender === 'female' ? 'Anak Perempuan' : 'Anak Lelaki';
    } else if (from.fatherId === to.id || from.motherId === to.id) {
      relation = to.gender === 'female' ? 'Ibu Kandung' : 'Bapa Kandung';
    } else if (from.spouseIds?.includes(to.id)) {
      relation = to.gender === 'female' ? 'Isteri' : 'Suami';
    }

    details.push({ from, to, relation });
  }
  return details;
}

function buildPathDetailsReversed(path: Person[]): { from: Person; to: Person; relation: string }[] {
  const details = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    let relation = 'Leluhur';

    if (from.fatherId === to.id || from.motherId === to.id) {
      relation = to.gender === 'female' ? 'Ibu Kandung' : 'Bapa Kandung';
    } else if (to.fatherId === from.id || to.motherId === from.id) {
      relation = to.gender === 'female' ? 'Anak Perempuan' : 'Anak Lelaki';
    }

    details.push({ from, to, relation });
  }
  return details;
}

function buildDetailedStepsFromPath(
  path: Person[]
): { stepIndex: number; from: Person; to: Person; relation: string; direction: 'UP' | 'DOWN' | 'LATERAL' | 'SPOUSE' }[] {
  const steps = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    let relation = 'Keturunan';
    let direction: 'UP' | 'DOWN' | 'LATERAL' | 'SPOUSE' = 'DOWN';

    if (to.fatherId === from.id || to.motherId === from.id || from.childrenIds?.includes(to.id)) {
      relation = to.gender === 'female' ? 'Anak Perempuan' : 'Anak Lelaki';
      direction = 'DOWN';
    } else if (from.fatherId === to.id || from.motherId === to.id) {
      relation = to.gender === 'female' ? 'Ibu Kandung' : 'Bapa Kandung';
      direction = 'UP';
    } else if (from.spouseIds?.includes(to.id)) {
      relation = to.gender === 'female' ? 'Isteri' : 'Suami';
      direction = 'SPOUSE';
    } else {
      direction = 'LATERAL';
    }

    steps.push({
      stepIndex: i + 1,
      from,
      to,
      relation,
      direction,
    });
  }
  return steps;
}

function buildDetailedStepsFromPathReversed(
  path: Person[]
): { stepIndex: number; from: Person; to: Person; relation: string; direction: 'UP' | 'DOWN' | 'LATERAL' | 'SPOUSE' }[] {
  const steps = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    let relation = 'Leluhur';
    let direction: 'UP' | 'DOWN' | 'LATERAL' | 'SPOUSE' = 'UP';

    if (from.fatherId === to.id || from.motherId === to.id) {
      relation = to.gender === 'female' ? 'Ibu Kandung' : 'Bapa Kandung';
      direction = 'UP';
    } else if (to.fatherId === from.id || to.motherId === from.id) {
      relation = to.gender === 'female' ? 'Anak Perempuan' : 'Anak Lelaki';
      direction = 'DOWN';
    }

    steps.push({
      stepIndex: i + 1,
      from,
      to,
      relation,
      direction,
    });
  }
  return steps;
}

function isDescendantOfRoot(person: Person, personMap: Map<string, Person>): boolean {
  if (person.id === 'WMH-000001' || person.id === 'WMH-000002') return true;
  const ancestors = getAllAncestorsWithDistance(person, personMap);
  return ancestors.has('WMH-000001') || ancestors.has('WMH-000002');
}

function getGenerationFallback(person: Person, personMap: Map<string, Person>): number {
  if (person.generation) return person.generation;
  if (person.id === 'WMH-000001' || person.id === 'WMH-000002') return 1;
  const ancestors = getAllAncestorsWithDistance(person, personMap);
  const dist1 = ancestors.get('WMH-000001');
  const dist2 = ancestors.get('WMH-000002');
  if (dist1 !== undefined) return dist1 + 1;
  if (dist2 !== undefined) return dist2 + 1;
  return 1;
}

function formatGenerationBadge(gen: number): string {
  if (gen === 1) return 'Generasi 1 (Pengasas/Datuk Asal)';
  if (gen === 2) return 'Generasi 2 (Anak-anak)';
  if (gen === 3) return 'Generasi 3 (Cucu-cucu)';
  if (gen === 4) return 'Generasi 4 (Cicit-cicit)';
  if (gen === 5) return 'Generasi 5 (Piut-piut)';
  if (gen === 6) return 'Generasi 6 (Piut Bertingkat / Onget)';
  return `Generasi ${gen}`;
}

function getTraditionalSiblingHonorific(person: Person, isOlder: boolean): string {
  if (!isOlder) {
    return person.gender === 'female' ? 'Adik' : 'Adik';
  }
  const order = person.birthOrder || 0;
  if (order === 1) return person.gender === 'female' ? 'Kak Long' : 'Abang Long';
  if (order === 2) return person.gender === 'female' ? 'Kak Ngah' : 'Abang Ngah';
  if (order === 3) return person.gender === 'female' ? 'Kak Lang' : 'Abang Lang';
  if (order === 4) return person.gender === 'female' ? 'Kak Anjang / Kak Teh' : 'Abang Anjang / Abang Teh';
  if (order === 5) return person.gender === 'female' ? 'Kak Uda' : 'Abang Uda';
  if (order >= 6) return person.gender === 'female' ? 'Kak Su / Kak Cik' : 'Abang Su / Pak Su';
  return person.gender === 'female' ? 'Kakak' : 'Abang';
}

function getTraditionalUncleHonorific(person: Person): string {
  const isFemale = person.gender === 'female';
  const order = person.birthOrder || 0;
  if (order === 1) return isFemale ? 'Mak Long' : 'Pak Long';
  if (order === 2) return isFemale ? 'Mak Ngah' : 'Pak Ngah';
  if (order === 3) return isFemale ? 'Mak Lang' : 'Pak Lang';
  if (order === 4) return isFemale ? 'Mak Anjang / Mak Teh' : 'Pak Anjang / Pak Teh';
  if (order === 5) return isFemale ? 'Mak Uda' : 'Pak Uda';
  if (order >= 6) return isFemale ? 'Mak Su' : 'Pak Su';
  return isFemale ? 'Makcik' : 'Pakcik';
}
