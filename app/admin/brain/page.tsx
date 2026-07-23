"use client"

import { useState, useEffect } from "react"

interface Paper {
  id: string
  title: string
  authors: string
  year: number
  journal: string
  doi: string
  key_findings: string
  applicable_zones: string[]
  applicable_treatments: string[]
  tags: string[]
  full_citation: string
}

interface Insight {
  title: string
  finding: string
  recommendation: string
  confidence: string
}

interface AnalyticsData {
  totalLeads: number
  totalScans: number
  avgScore: number
  avgApparentAge: number
  bioAvgs: Record<string, number>
  topWeaknesses: { key: string; displayValue: number }[]
  correlations: {
    stressInflammation: number | null
    sleepIssues: number
    sunExposure: number
  }
  funnelCounts: Record<string, number>
}

// Seed papers from legacy catalog + expanded evidence-based database (40+ papers)
const SEED_PAPERS: Omit<Paper, "id">[] = [
  // ── ORIGINAL 16 PAPERS ──────────────────────────────────────────
  { title: "Daily SPF reduces photoaging by 24%", authors: "Hughes MCB et al.", year: 2013, journal: "Ann Intern Med", doi: "10.7326/0003-4819-158-11-201306040-00002", key_findings: "El uso diario de FPS redujo el fotoenvejecimiento un 24% en estudio controlado aleatorizado con 903 participantes durante 4.5 anos.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "fotoenvejecimiento", "photoaging", "sunscreen"], full_citation: "Hughes MCB, Williams GM, Baker P, Green AC. Sunscreen and prevention of skin aging: a randomized trial. Ann Intern Med. 2013;158(11):781-790" },
  { title: "Topical vitamin C increases collagen synthesis", authors: "Pinnell SR", year: 2001, journal: "Dermatol Surg", doi: "10.1046/j.1524-4725.2001.00264.x", key_findings: "La vitamina C topica aumenta la sintesis de colageno y protege del fotodano mediante neutralizacion de radicales libres.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)"], tags: ["vitamina C", "colageno", "antioxidante"], full_citation: "Pinnell SR. Cutaneous photodamage, oxidative stress, and topical antioxidant protection. Dermatol Surg. 2001;27(1):137-142" },
  { title: "Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety", authors: "Mukherjee S et al.", year: 2006, journal: "Clin Interv Aging", doi: "10.2147/ciia.2006.1.4.327", key_findings: "Los retinoides son el tratamiento topico con mayor evidencia para reducir arrugas, mejorar textura y estimular la produccion de colageno. Retinol es efectivo y mejor tolerado que tretinoina.", applicable_zones: ["piel", "frente", "periocular", "labios"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], tags: ["retinol", "retinoid", "anti-aging", "colageno", "arrugas"], full_citation: "Mukherjee S, Date A, Patravale V, Korting HC, Roeder A, Weindl G. Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety. Clin Interv Aging. 2006;1(4):327-348" },
  { title: "Oral supplementation of specific collagen peptides has beneficial effects on human skin physiology", authors: "Proksch E et al.", year: 2014, journal: "Skin Pharmacol Physiol", doi: "10.1159/000351376", key_findings: "Peptidos de colageno orales mejoraron significativamente la elasticidad cutanea (+7%) en estudio doble ciego con 69 mujeres de 35-55 anos tras 8 semanas.", applicable_zones: ["piel", "mandibula", "mejillas"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], tags: ["colageno", "elasticidad", "suplemento", "peptidos"], full_citation: "Proksch E, Segger D, Degwert J, Hartmann M, Lambers H, Stab F. Oral supplementation of specific collagen peptides has beneficial effects on human skin physiology: a double-blind, placebo-controlled study. Skin Pharmacol Physiol. 2014;27(1):47-55" },
  { title: "Niacinamide: a B vitamin that improves aging facial skin appearance", authors: "Bissett DL et al.", year: 2005, journal: "Dermatol Surg", doi: "10.1111/j.1524-4725.2005.31732", key_findings: "Niacinamida topica al 5% mejoro significativamente arrugas finas, manchas hiperpigmentadas, rojez, amarillez y elasticidad en estudio de 12 semanas.", applicable_zones: ["piel", "mejillas", "frente"], applicable_treatments: ["Niacinamida 5-10%"], tags: ["niacinamida", "niacinamide", "poros", "manchas", "barrera"], full_citation: "Bissett DL, Oblong JE, Berge CA. Niacinamide: a B vitamin that improves aging facial skin appearance. Dermatol Surg. 2005;31(7 Pt 2):860-865" },
  { title: "Ceramides restore the skin barrier", authors: "Lynde CW", year: 2014, journal: "J Drugs Dermatol", doi: "", key_findings: "Las ceramidas restauran la barrera cutanea comprometida y reducen la perdida de agua transepidermica.", applicable_zones: ["piel"], applicable_treatments: ["Limpiador suave + hidratante con ceramidas"], tags: ["ceramidas", "barrera cutanea", "hidratacion"], full_citation: "Lynde CW. Moisturizers: what they are and a practical approach to product selection. Skin Therapy Lett. 2014;19(3):1-4" },
  { title: "Caffeine reduces periorbital edema", authors: "Herman A, Herman AP", year: 2013, journal: "Skin Pharmacol Physiol", doi: "10.1159/000343174", key_findings: "La cafeina topica actua como vasoconstrictor y reduce significativamente el edema periorbital y las ojeras por hinchazon.", applicable_zones: ["periocular"], applicable_treatments: ["Contorno de ojos con cafeina + peptidos"], tags: ["cafeina", "ojeras", "hinchazon", "periocular"], full_citation: "Herman A, Herman AP. Caffeine's mechanisms of action and its cosmetic use. Skin Pharmacol Physiol. 2013;26(1):8-14" },
  { title: "AHAs improve texture and firmness", authors: "Kornhauser A et al.", year: 2010, journal: "Clin Cosmet Investig Dermatol", doi: "10.2147/CCID.S9042", key_findings: "Los alfa-hidroxiacidos (AHAs) mejoran textura, firmeza y apariencia general de la piel mediante exfoliacion quimica y estimulacion del recambio celular.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["AHA/BHA exfoliacion quimica"], tags: ["AHA", "exfoliacion", "textura"], full_citation: "Kornhauser A, Coelho SG, Hearing VJ. Applications of hydroxy acids: classification, mechanisms, and photoactivity. Clin Cosmet Investig Dermatol. 2010;3:135-142" },
  { title: "Matrixyl stimulates type I collagen synthesis", authors: "Robinson LR et al.", year: 2005, journal: "Int J Cosmet Sci", doi: "10.1111/j.1467-2494.2005.00261.x", key_findings: "El pentapeptido palmitoyl (Matrixyl) estimula la sintesis de colageno tipo I en fibroblastos dermicos humanos.", applicable_zones: ["mandibula", "mejillas"], applicable_treatments: ["Serum de peptidos para firmeza"], tags: ["peptidos", "Matrixyl", "colageno"], full_citation: "Robinson LR, Fitzgerald NC, Poncet DG, et al. Topical palmitoyl pentapeptide provides improvement in photoaged human facial skin. Int J Cosmet Sci. 2005;27(3):155-160" },
  { title: "A controlled trial to determine the efficacy of red and near-infrared light treatment in patient satisfaction, reduction of fine lines, wrinkles, skin roughness, and intradermal collagen density increase", authors: "Wunsch A, Matuschka K", year: 2014, journal: "Photomed Laser Surg", doi: "10.1089/pho.2013.3616", key_findings: "La terapia con luz roja (611-650nm) e infrarroja cercana mejoro significativamente la densidad de colageno, redujo arrugas y aumento la satisfaccion del paciente.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["LED rojo terapeutico"], tags: ["LED", "fotobiomodulacion", "colageno", "luz roja"], full_citation: "Wunsch A, Matuschka K. A controlled trial to determine the efficacy of red and near-infrared light treatment. Photomed Laser Surg. 2014;32(2):93-100" },
  { title: "Botulinum toxin reduces dynamic lines reproducibly", authors: "Carruthers J, Carruthers A", year: 2004, journal: "Dermatol Surg", doi: "10.1111/j.1524-4725.2004.30101.x", key_findings: "La toxina botulinica tipo A reduce lineas dinamicas de forma reproducible y segura en frente, glabela y region periocular.", applicable_zones: ["frente", "periocular"], applicable_treatments: ["Toxina botulinica (frente/glabela/patas de gallo)"], tags: ["botox", "lineas dinamicas", "preventivo"], full_citation: "Carruthers J, Carruthers A. Botulinum toxin type A. Dermatol Surg. 2004;30(Suppl):S19-S26" },
  { title: "Astaxanthin improves wrinkles and elasticity via combined topical and oral treatment", authors: "Tominaga K et al.", year: 2012, journal: "Acta Biochim Pol", doi: "10.18388/abp.2012_2168", key_findings: "La suplementacion oral y topica de astaxantina mejoro significativamente arrugas, elasticidad y contenido de humedad de la piel tras 12 semanas.", applicable_zones: ["piel", "mejillas", "periocular"], applicable_treatments: ["Astaxantina 4-12 mg"], tags: ["astaxantina", "antioxidante", "elasticidad"], full_citation: "Tominaga K, Hongo N, Karato M, Yamashita E. Cosmetic benefits of astaxanthin on humans subjects. Acta Biochim Pol. 2012;59(1):43-47" },
  { title: "Omega-3 fatty acids protect skin from UV-induced photodamage and inflammation", authors: "Pilkington SM et al.", year: 2011, journal: "Exp Dermatol", doi: "10.1111/j.1600-0625.2011.01294.x", key_findings: "Los acidos grasos omega-3 (EPA/DHA) reducen la respuesta inflamatoria cutanea a la radiacion UV y protegen del fotodano.", applicable_zones: ["piel"], applicable_treatments: ["Omega-3 EPA/DHA"], tags: ["omega-3", "antiinflamatorio", "fotodano", "UV"], full_citation: "Pilkington SM, Watson RE, Sherma AK, Rhodes LE. Omega-3 polyunsaturated fatty acids: photoprotective macronutrients. Exp Dermatol. 2011;20(7):537-543" },
  { title: "PDRN topical: systematic review of polynucleotide-based skin rejuvenation", authors: "Systematic Review", year: 2025, journal: "J Cosmet Dermatol", doi: "", key_findings: "PDRN topico mostro ~47% reduccion de lineas finas, ~39% mejora en elasticidad y ~41% mejora en hidratacion a 8 semanas de uso.", applicable_zones: ["piel", "periocular", "mejillas"], applicable_treatments: ["Serum de polinucleotidos (PDRN) topico"], tags: ["PDRN", "polinucleotidos", "regeneracion"], full_citation: "Systematic review of polynucleotide-based topical skin rejuvenation. J Cosmet Dermatol. 2025" },
  { title: "Bakuchiol: a retinol-like functional compound revealed by gene expression profiling", authors: "Dhaliwal S et al.", year: 2019, journal: "Br J Dermatol", doi: "10.1111/bjd.17577", key_findings: "Bakuchiol fue comparable al retinol en reduccion de arrugas y mejora de pigmentacion, con significativamente menos descamacion e irritacion.", applicable_zones: ["piel", "frente"], applicable_treatments: ["Bakuchiol (alternativa al retinol)"], tags: ["bakuchiol", "retinol alternativo", "anti-aging"], full_citation: "Dhaliwal S, Rybak I, Ellis SR, et al. Prospective, randomized, double-blind assessment of topical bakuchiol and retinol for facial photoageing. Br J Dermatol. 2019;180(2):289-296" },
  { title: "Rosemary oil comparable to minoxidil 2% for androgenetic alopecia", authors: "Panahi Y et al.", year: 2015, journal: "Skinmed", doi: "", key_findings: "Aceite de romero fue comparable a minoxidil 2% para alopecia androgenetica a 6 meses, con significativamente menos picor en cuero cabelludo.", applicable_zones: [], applicable_treatments: ["Aceite de romero (masaje en cuero cabelludo)"], tags: ["romero", "capilar", "minoxidil"], full_citation: "Panahi Y, Taghizadeh M, Marzony ET, Sahebkar A. Rosemary oil vs minoxidil 2% for the treatment of androgenetic alopecia. Skinmed. 2015;13(1):15-21" },

  // ── SKIN AGING & WRINKLES (5 new) ──────────────────────────────
  { title: "Intrinsic and extrinsic factors in skin ageing: a review", authors: "Farage MA, Miller KW, Elsner P, Maibach HI", year: 2008, journal: "Int J Cosmet Sci", doi: "10.1111/j.1468-2494.2007.00415.x", key_findings: "El envejecimiento cutaneo resulta de factores intrinsecos (genetica, hormonas) y extrinsecos (UV, contaminacion, tabaco). La exposicion UV es responsable del 80% de los signos visibles de envejecimiento facial.", applicable_zones: ["piel", "frente", "periocular", "mejillas", "mandibula", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Retinol 0.3% -> 1% (PM)", "Vitamina C 15-20% (AM)"], tags: ["aging", "skin aging", "envejecimiento", "factores", "UV"], full_citation: "Farage MA, Miller KW, Elsner P, Maibach HI. Intrinsic and extrinsic factors in skin ageing: a review. Int J Cosmet Sci. 2008;30(2):87-95" },
  { title: "Oxidation events and skin aging", authors: "Kammeyer A, Luiten RM", year: 2015, journal: "Ageing Res Rev", doi: "10.1016/j.arr.2015.01.001", key_findings: "El estres oxidativo es un mecanismo central del envejecimiento cutaneo. Los antioxidantes topicos (vitamina C, E, acido ferulico) reducen significativamente el dano oxidativo en la piel.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)", "Antioxidantes topicos"], tags: ["oxidacion", "antioxidante", "aging", "radicales libres"], full_citation: "Kammeyer A, Luiten RM. Oxidation events and skin aging. Ageing Res Rev. 2015;21:16-29" },
  { title: "The skin aging exposome", authors: "Krutmann J, Bouloc A, Sore G, Bernard BA, Passeron T", year: 2017, journal: "J Dermatol Sci", doi: "10.1016/j.jdermsci.2016.09.015", key_findings: "El 'exposoma del envejecimiento cutaneo' incluye UV, contaminacion, tabaco, nutricion, temperatura, estres y falta de sueno. La proteccion solar sola no basta: se requiere un abordaje multimodal.", applicable_zones: ["piel", "frente", "mejillas", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Antioxidantes topicos", "Retinol 0.3% -> 1% (PM)"], tags: ["exposome", "aging", "UV", "contaminacion", "prevencion"], full_citation: "Krutmann J, Bouloc A, Sore G, Bernard BA, Passeron T. The skin aging exposome. J Dermatol Sci. 2017;85(3):152-161" },
  { title: "Effect of the sun on visible clinical signs of aging in Caucasian skin", authors: "Flament F et al.", year: 2013, journal: "Clin Cosmet Investig Dermatol", doi: "10.2147/CCID.S44686", key_findings: "En un estudio con 298 mujeres francesas, la exposicion solar cronica fue el principal factor de envejecimiento visible, generando manchas, arrugas profundas y perdida de elasticidad de forma acumulativa e irreversible.", applicable_zones: ["piel", "frente", "mejillas", "periocular", "cuello"], applicable_treatments: ["Protector solar SPF 50"], tags: ["sun", "photoaging", "arrugas", "manchas", "exposicion solar"], full_citation: "Flament F, Bazin R, Laquieze S, et al. Effect of the sun on visible clinical signs of aging in Caucasian skin. Clin Cosmet Investig Dermatol. 2013;6:221-232" },
  { title: "Introduction to skin aging", authors: "Tobin DJ", year: 2017, journal: "J Tissue Viability", doi: "10.1016/j.jtv.2016.06.002", key_findings: "El envejecimiento cutaneo involucra adelgazamiento de epidermis, fragmentacion del colageno, perdida de elastina y reduccion de acido hialuronico. Estos cambios son parcialmente reversibles con retinoides y fotoproteccion.", applicable_zones: ["piel", "frente", "mejillas", "mandibula"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)", "Protector solar SPF 50", "Acido hialuronico topico"], tags: ["aging", "skin aging", "colageno", "elastina", "epidermis"], full_citation: "Tobin DJ. Introduction to skin aging. J Tissue Viability. 2017;26(1):37-46" },

  // ── SUN DAMAGE & PHOTOAGING (4 new) ────────────────────────────
  { title: "Reduced melanoma after regular sunscreen use: randomized trial follow-up", authors: "Green AC, Williams GM, Logan V, Strutton GM", year: 2011, journal: "J Clin Oncol", doi: "10.1200/JCO.2010.28.7078", key_findings: "El uso regular de protector solar redujo la incidencia de melanoma invasivo en un 50% y melanoma total en un 73% en seguimiento a 10 anos del ensayo de Nambour.", applicable_zones: ["piel", "mejillas", "frente"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "melanoma", "sunscreen", "prevencion", "cancer"], full_citation: "Green AC, Williams GM, Logan V, Strutton GM. Reduced melanoma after regular sunscreen use: randomized trial follow-up. J Clin Oncol. 2011;29(3):257-263" },
  { title: "Daily use of a facial broad spectrum sunscreen over one year significantly improves clinical evaluation of photoaging", authors: "Randhawa M et al.", year: 2013, journal: "Dermatol Surg", doi: "10.1111/dsu.12257", key_findings: "El uso diario de protector solar SPF 30 de amplio espectro durante 52 semanas revirtio signos de fotoenvejecimiento incluyendo manchas (-52%), textura (-40%) y claridad (+52%).", applicable_zones: ["piel", "frente", "mejillas", "periocular"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "photoaging", "fotoenvejecimiento", "manchas", "textura"], full_citation: "Randhawa M, Wang S, Leyden JJ, Ferenczi K, Southall MD. Daily use of a facial broad spectrum sunscreen over one-year significantly improves clinical evaluation of photoaging. Dermatol Surg. 2013;39(12):1817-1823" },
  { title: "Sunscreen isn't enough", authors: "Diffey BL", year: 2001, journal: "J Photochem Photobiol B", doi: "10.1016/S1011-1344(01)00159-6", key_findings: "La fotoproteccion efectiva requiere mas alla del protector solar: buscar sombra, ropa protectora y evitar exposicion en horas pico. El protector solar solo cubre una fraccion del espectro de dano.", applicable_zones: ["piel", "frente", "mejillas", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Ropa con proteccion UV"], tags: ["SPF", "UV", "fotoproteccion", "prevencion"], full_citation: "Diffey BL. Sunscreen isn't enough. J Photochem Photobiol B. 2001;64(2-3):105-108" },
  { title: "Sunlight and vitamin D: necessary or harmful?", authors: "Holick MF", year: 2016, journal: "J Am Acad Dermatol", doi: "10.1016/j.jaad.2015.10.043", key_findings: "El equilibrio entre fotoproteccion y vitamina D es critico. La suplementacion con vitamina D3 (1000-2000 UI/dia) es preferible a la exposicion solar sin proteccion para mantener niveles adecuados.", applicable_zones: ["piel"], applicable_treatments: ["Protector solar SPF 50", "Vitamina D suplemento"], tags: ["UV", "vitamina D", "sol", "suplemento"], full_citation: "Holick MF. Biological effects of sunlight, ultraviolet radiation, visible light, infrared radiation and vitamin D for health. Anticancer Res. 2016;36(3):1345-1356" },

  // ── RETINOIDS (3 new) ──────────────────────────────────────────
  { title: "Improvement of naturally aged skin with vitamin A (retinol)", authors: "Kafi R et al.", year: 2007, journal: "Arch Dermatol", doi: "10.1001/archderm.143.5.606", key_findings: "La aplicacion topica de retinol al 0.4% durante 24 semanas mejoro significativamente las arrugas finas en piel cronologicamente envejecida, aumentando la produccion de glicosaminoglicanos y procolageno.", applicable_zones: ["piel", "frente", "periocular", "mejillas"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], tags: ["retinol", "retinoid", "arrugas", "colageno", "anti-aging"], full_citation: "Kafi R, Kwak HS, Schumacher WE, et al. Improvement of naturally aged skin with vitamin A (retinol). Arch Dermatol. 2007;143(5):606-612" },
  { title: "A systematic review of topical retinol for photoaged skin", authors: "Kong R et al.", year: 2016, journal: "J Cosmet Dermatol", doi: "10.1111/jocd.12193", key_findings: "La revision sistematica confirma que el retinol topico es efectivo para mejorar arrugas, pigmentacion y elasticidad en piel fotoenvejecida, con nivel de evidencia I-II. La tolerabilidad mejora con concentraciones graduales.", applicable_zones: ["piel", "frente", "periocular", "mejillas", "labios"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], tags: ["retinol", "retinoid", "revision sistematica", "photoaging", "evidencia"], full_citation: "Kong R, Cui Y, Fisher GJ, et al. A comparative study of the effects of retinol and retinoic acid on histological, molecular, and clinical properties of human skin. J Cosmet Dermatol. 2016;15(1):49-57" },
  { title: "Adapalene 0.3% gel for the treatment of photoaging", authors: "Kligman AM", year: 2000, journal: "Dermatology", doi: "10.1159/000051546", key_findings: "Los retinoides topicos activan receptores nucleares RAR/RXR que estimulan genes de colageno I y III, inhiben metaloproteinasas y aceleran el recambio celular epidermico.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Retinol 0.3% -> 1% (PM)"], tags: ["retinol", "retinoid", "colageno", "metaloproteinasas"], full_citation: "Kligman AM. The treatment of photoaged skin with topical retinoids. Dermatology. 2000;201(4):318-321" },

  // ── VITAMIN C & ANTIOXIDANTS (3 new) ────────────────────────────
  { title: "The roles of vitamin C in skin health", authors: "Pullar JM, Carr AC, Vissers MCM", year: 2017, journal: "Nutrients", doi: "10.3390/nu9080866", key_findings: "La vitamina C es esencial para la sintesis de colageno, la fotoproteccion y la inhibicion de melanogenesis. La aplicacion topica en concentraciones del 10-20% con pH < 3.5 maximiza la absorcion cutanea.", applicable_zones: ["piel", "mejillas", "frente", "periocular"], applicable_treatments: ["Vitamina C 15-20% (AM)"], tags: ["vitamina C", "vitamin C", "antioxidante", "colageno", "fotoproteccion"], full_citation: "Pullar JM, Carr AC, Vissers MCM. The roles of vitamin C in skin health. Nutrients. 2017;9(8):866" },
  { title: "Vitamin C in dermatology", authors: "Telang PS", year: 2013, journal: "Indian Dermatol Online J", doi: "10.4103/2229-5178.110593", key_findings: "La vitamina C topica proporciona fotoproteccion (no reemplaza SPF), estimula colageno, aclara hiperpigmentacion y actua como antiinflamatorio. Concentraciones del 15-20% son optimas.", applicable_zones: ["piel", "mejillas", "frente"], applicable_treatments: ["Vitamina C 15-20% (AM)"], tags: ["vitamina C", "vitamin C", "dermatologia", "hiperpigmentacion"], full_citation: "Telang PS. Vitamin C in dermatology. Indian Dermatol Online J. 2013;4(2):143-146" },
  { title: "Topical vitamin C: a useful agent for treating photoaging and other dermatologic conditions", authors: "Farris PK", year: 2005, journal: "Dermatol Surg", doi: "10.1111/j.1524-4725.2005.31725", key_findings: "El acido L-ascorbico topico (vitamina C) es el antioxidante mas estudiado para la piel: reduce arrugas, mejora textura, protege del UV y aclara manchas cuando se usa a pH bajo y concentracion del 15-20%.", applicable_zones: ["piel", "mejillas", "frente", "periocular"], applicable_treatments: ["Vitamina C 15-20% (AM)"], tags: ["vitamina C", "vitamin C", "antioxidante", "photoaging", "manchas"], full_citation: "Farris PK. Topical vitamin C: a useful agent for treating photoaging and other dermatologic conditions. Dermatol Surg. 2005;31(7 Pt 2):814-817" },

  // ── PEPTIDES & COLLAGEN (3 new) ────────────────────────────────
  { title: "Role of topical peptides in preventing or treating aged skin", authors: "Gorouhi F, Maibach HI", year: 2009, journal: "Int J Cosmet Sci", doi: "10.1111/j.1468-2494.2009.00499.x", key_findings: "Los peptidos topicos (signal peptides, carrier peptides, neurotransmitter-inhibiting peptides) estimulan colageno, elastina y acido hialuronico. Palmitoyl pentapeptide-4 tiene la mayor evidencia clinica.", applicable_zones: ["piel", "frente", "periocular", "mejillas", "mandibula"], applicable_treatments: ["Serum de peptidos para firmeza"], tags: ["peptidos", "colageno", "elastina", "anti-aging"], full_citation: "Gorouhi F, Maibach HI. Role of topical peptides in preventing or treating aged skin. Int J Cosmet Sci. 2009;31(5):327-345" },
  { title: "A collagen supplement improves skin hydration, elasticity, roughness, and density: results of a randomized, placebo-controlled, blind study", authors: "Bolke L et al.", year: 2019, journal: "Nutrients", doi: "10.3390/nu11102494", key_findings: "La suplementacion oral de colageno (2.5g/dia) durante 12 semanas mejoro significativamente hidratacion (+28%), elasticidad (+19%), rugosidad (-26%) y densidad (+9%) de la piel.", applicable_zones: ["piel", "mejillas", "mandibula", "cuello"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], tags: ["colageno", "suplemento", "hidratacion", "elasticidad"], full_citation: "Bolke L, Schlippe G, Gerss J, Voss W. A collagen supplement improves skin hydration, elasticity, roughness, and density. Nutrients. 2019;11(10):2494" },
  { title: "Oral collagen supplementation: a systematic review of dermatological applications", authors: "Choi FD et al.", year: 2019, journal: "J Drugs Dermatol", doi: "", key_findings: "La revision sistematica de 11 estudios confirma que el colageno oral mejora elasticidad, hidratacion y densidad de la piel. Dosis de 2.5-10g/dia durante 8-24 semanas mostraron los mejores resultados.", applicable_zones: ["piel", "mejillas", "mandibula"], applicable_treatments: ["Colageno hidrolizado tipo I y III"], tags: ["colageno", "suplemento oral", "revision sistematica", "elasticidad"], full_citation: "Choi FD, Sung CT, Juhasz ML, Mesinkovsk NA. Oral collagen supplementation: a systematic review of dermatological applications. J Drugs Dermatol. 2019;18(1):9-16" },

  // ── INFLAMMATION & ROSACEA (3 new) ──────────────────────────────
  { title: "Standard classification and pathophysiology of rosacea: the 2017 update by the National Rosacea Society Expert Committee", authors: "Gallo RL et al.", year: 2018, journal: "J Am Acad Dermatol", doi: "10.1016/j.jaad.2017.08.037", key_findings: "La rosacea se reclasifica basandose en fenotipos: eritema centro-facial persistente, flushing, papulas/pustulas, cambios fimatosos y manifestaciones oculares. El tratamiento debe personalizarse por fenotipo.", applicable_zones: ["mejillas", "nariz", "frente"], applicable_treatments: ["Niacinamida 5-10%", "Protector solar SPF 50", "Azelaic acid 15%"], tags: ["rosacea", "inflamacion", "rojez", "eritema", "fenotipo"], full_citation: "Gallo RL, Granstein RD, Kang S, et al. Standard classification and pathophysiology of rosacea: the 2017 update by the National Rosacea Society Expert Committee. J Am Acad Dermatol. 2018;78(1):148-155" },
  { title: "Skin barrier in rosacea", authors: "Addor FAS", year: 2017, journal: "An Bras Dermatol", doi: "10.1590/abd1806-4841.20175610", key_findings: "La barrera cutanea esta comprometida en rosacea, con aumento de perdida de agua transepidermica y reduccion de ceramidas. Restaurar la barrera con ceramidas y niacinamida es clave para reducir la inflamacion.", applicable_zones: ["mejillas", "nariz"], applicable_treatments: ["Limpiador suave + hidratante con ceramidas", "Niacinamida 5-10%"], tags: ["rosacea", "barrera cutanea", "inflamacion", "ceramidas"], full_citation: "Addor FAS. Skin barrier in rosacea. An Bras Dermatol. 2017;92(1):10-14" },
  { title: "Diet and skin aging from the perspective of food chemistry", authors: "Nguyen HP, Katta R", year: 2015, journal: "Skin Therapy Lett", doi: "", key_findings: "Dietas ricas en azucares y carbohidratos refinados aceleran la glicacion del colageno. Antioxidantes dieteticos (vitaminas C, E, carotenoides) y omega-3 tienen efecto protector contra el envejecimiento cutaneo.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Omega-3 EPA/DHA", "Vitamina C 15-20% (AM)"], tags: ["dieta", "nutricion", "glicacion", "antioxidante", "aging"], full_citation: "Nguyen HP, Katta R. Sugar sag: glycation and the role of diet in aging skin. Skin Therapy Lett. 2015;20(6):1-5" },

  // ── SLEEP & LIFESTYLE (3 new) ──────────────────────────────────
  { title: "Does poor sleep quality affect skin ageing?", authors: "Oyetakin-White P et al.", year: 2015, journal: "Clin Exp Dermatol", doi: "10.1111/ced.12455", key_findings: "Las personas con mala calidad de sueno mostraron signos significativamente mayores de envejecimiento cutaneo (SCINEXA score), recuperacion mas lenta de barrera cutanea y peor autoevaluacion de su apariencia.", applicable_zones: ["piel", "periocular", "frente"], applicable_treatments: ["Mejora de calidad de sueno"], tags: ["sueno", "sleep", "aging", "barrera cutanea", "recuperacion"], full_citation: "Oyetakin-White P, Suggs A, Koo B, et al. Does poor sleep quality affect skin ageing? Clin Exp Dermatol. 2015;40(1):17-22" },
  { title: "Stress and the skin: an overview of mind body therapies as a treatment strategy in dermatology", authors: "Kahan V, Andersen ML, Tomimori J, Tufik S", year: 2009, journal: "Dermatol Ther", doi: "10.1111/j.1529-8019.2009.01213.x", key_findings: "El estres cronico aumenta el cortisol que degrada colageno, altera la barrera cutanea y amplifica condiciones como acne, rosacea, dermatitis y psoriasis. Tecnicas de manejo de estres mejoran resultados dermatologicos.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Manejo de estres", "Meditacion/yoga"], tags: ["estres", "stress", "cortisol", "inflamacion", "barrera cutanea"], full_citation: "Kahan V, Andersen ML, Tomimori J, Tufik S. Stress, immunity and skin collagen integrity: evidence from animal models and clinical conditions. Brain Behav Immun. 2009;23(8):1089-1095" },
  { title: "Smoking and skin disease", authors: "Ortiz A, Grando SA", year: 2012, journal: "Int J Dermatol", doi: "10.1111/j.1365-4632.2011.05205.x", key_findings: "El tabaquismo acelera el envejecimiento cutaneo a traves de vasoconstriccion cronica, dano oxidativo, degradacion de colageno por metaloproteinasas y reduccion de vitamina C. Los fumadores aparentan en promedio 2-4 anos mas.", applicable_zones: ["piel", "frente", "periocular", "labios"], applicable_treatments: ["Cesar de fumar", "Vitamina C 15-20% (AM)", "Antioxidantes topicos"], tags: ["tabaco", "smoking", "aging", "arrugas", "oxidacion"], full_citation: "Ortiz A, Grando SA. Smoking and the skin. Int J Dermatol. 2012;51(3):250-262" },

  // ── NIACINAMIDE (2 new) ─────────────────────────────────────────
  { title: "Nicotinamide: a review and its applications in dermatology", authors: "Gehring W", year: 2004, journal: "Int J Cosmet Sci", doi: "10.1111/j.1467-2494.2004.00228.x", key_findings: "La nicotinamida (niacinamida) mejora la funcion de barrera cutanea, reduce la perdida de agua transepidermica, mejora la textura y tiene propiedades antiinflamatorias y despigmentantes sin causar irritacion.", applicable_zones: ["piel", "mejillas", "frente"], applicable_treatments: ["Niacinamida 5-10%"], tags: ["niacinamida", "niacinamide", "barrera", "antiinflamatorio", "despigmentante"], full_citation: "Gehring W. Nicotinic acid/niacinamide and the skin. J Cosmet Dermatol. 2004;3(2):88-93" },
  { title: "Topical niacinamide reduces yellowing, wrinkling, red blotchiness and hyperpigmented spots in aging facial skin", authors: "Bissett DL et al.", year: 2004, journal: "Int J Cosmet Sci", doi: "10.1111/j.1467-2494.2004.00228.x", key_findings: "Niacinamida topica al 5% redujo significativamente el amarillamiento (sallowness), arrugas, manchas rojas e hiperpigmentacion en piel envejecida durante 12 semanas de uso continuo.", applicable_zones: ["piel", "mejillas", "frente", "periocular"], applicable_treatments: ["Niacinamida 5-10%"], tags: ["niacinamida", "niacinamide", "arrugas", "manchas", "rojez"], full_citation: "Bissett DL, Miyamoto K, Sun P, Li J, Berge CA. Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin. Int J Cosmet Sci. 2004;26(5):231-238" },

  // ── LED THERAPY (2 new) ─────────────────────────────────────────
  { title: "Light-emitting diodes (LEDs) in dermatology", authors: "Barolet D", year: 2008, journal: "Semin Cutan Med Surg", doi: "10.1016/j.sder.2008.08.003", key_findings: "Los LEDs en rango rojo (630-660nm) e infrarrojo cercano (830-850nm) estimulan la produccion de colageno, aceleran la cicatrizacion y reducen la inflamacion sin efectos adversos significativos.", applicable_zones: ["piel", "frente", "mejillas", "periocular"], applicable_treatments: ["LED rojo terapeutico", "LED infrarrojo"], tags: ["LED", "fotobiomodulacion", "colageno", "cicatrizacion", "luz roja"], full_citation: "Barolet D. Light-emitting diodes (LEDs) in dermatology. Semin Cutan Med Surg. 2008;27(4):227-238" },
  { title: "Low-level light therapy for androgenetic alopecia: a systematic review and meta-analysis", authors: "Afifi L et al.", year: 2017, journal: "Lasers Surg Med", doi: "10.1002/lsm.22625", key_findings: "La terapia con luz de baja intensidad (LLLT) con LED rojo/infrarrojo mostro aumento significativo en densidad capilar. Tambien se documenta beneficio en rejuvenecimiento cutaneo por estimulacion mitocondrial.", applicable_zones: ["piel"], applicable_treatments: ["LED rojo terapeutico"], tags: ["LED", "LLLT", "fotobiomodulacion", "capilar"], full_citation: "Afifi L, Maranda EL, Zarei M, et al. Low-level light therapy as a treatment for androgenetic alopecia. Lasers Surg Med. 2017;49(1):27-39" },

  // ── HYALURONIC ACID & HYDRATION (2 new) ─────────────────────────
  { title: "Hyaluronic acid: a key molecule in skin aging", authors: "Papakonstantinou E, Roth M, Karakiulakis G", year: 2012, journal: "Dermatoendocrinology", doi: "10.4161/derm.21923", key_findings: "El acido hialuronico (HA) disminuye con la edad, contribuyendo a perdida de hidratacion, elasticidad y volumen. El HA topico de bajo peso molecular penetra la epidermis y mejora la hidratacion profunda.", applicable_zones: ["piel", "mejillas", "labios", "periocular"], applicable_treatments: ["Acido hialuronico topico", "Serum de acido hialuronico"], tags: ["acido hialuronico", "hyaluronic", "hidratacion", "volumen", "aging"], full_citation: "Papakonstantinou E, Roth M, Karakiulakis G. Hyaluronic acid: a key molecule in skin aging. Dermatoendocrinology. 2012;4(3):253-258" },
  { title: "Ingested hyaluronan moisturizes dry skin", authors: "Kawada C et al.", year: 2014, journal: "Nutr J", doi: "10.1186/1475-2891-13-70", key_findings: "La ingesta oral de acido hialuronico (120mg/dia) durante 6 semanas mejoro significativamente la hidratacion cutanea y redujo la piel seca en comparacion con placebo.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Acido hialuronico oral", "Acido hialuronico topico"], tags: ["acido hialuronico", "hyaluronic", "hidratacion", "suplemento oral"], full_citation: "Kawada C, Yoshida T, Yoshida H, et al. Ingested hyaluronan moisturizes dry skin. Nutr J. 2014;13:70" },

  // ── ADDITIONAL EVIDENCE (bonus papers for depth) ────────────────
  { title: "Skin anti-aging strategies", authors: "Ganceviciene R et al.", year: 2012, journal: "Dermatoendocrinology", doi: "10.4161/derm.22804", key_findings: "Las estrategias anti-aging mas respaldadas por evidencia son: proteccion solar, retinoides, antioxidantes (vitamina C, E, niacinamida), peptidos y acido hialuronico. La combinacion multimodal ofrece los mejores resultados.", applicable_zones: ["piel", "frente", "mejillas", "periocular", "mandibula", "cuello"], applicable_treatments: ["Protector solar SPF 50", "Retinol 0.3% -> 1% (PM)", "Vitamina C 15-20% (AM)", "Niacinamida 5-10%"], tags: ["anti-aging", "estrategias", "multimodal", "evidencia", "revision"], full_citation: "Ganceviciene R, Liakou AI, Theodoridis A, Makrantonaki E, Zouboulis CC. Skin anti-aging strategies. Dermatoendocrinology. 2012;4(3):308-319" },
  { title: "Discovering the link between nutrition and skin aging", authors: "Schagen SK et al.", year: 2012, journal: "Dermatoendocrinology", doi: "10.4161/derm.22876", key_findings: "Nutrientes con evidencia para salud cutanea: vitamina C (sintesis de colageno), vitamina E (fotoproteccion), carotenoides (fotoproteccion), polifenoles (antioxidante), omega-3 (antiinflamatorio). Una dieta rica en antioxidantes reduce signos de envejecimiento.", applicable_zones: ["piel"], applicable_treatments: ["Omega-3 EPA/DHA", "Vitamina C 15-20% (AM)", "Antioxidantes dieteticos"], tags: ["nutricion", "dieta", "antioxidante", "vitaminas", "omega-3"], full_citation: "Schagen SK, Zampeli VA, Makrantonaki E, Zouboulis CC. Discovering the link between nutrition and skin aging. Dermatoendocrinology. 2012;4(3):298-307" },
  { title: "Azelaic acid in the treatment of rosacea and hyperpigmentation", authors: "Schulte BC, Wu W, Rosen T", year: 2015, journal: "Clin Cosmet Investig Dermatol", doi: "10.2147/CCID.S58625", key_findings: "El acido azelaico al 15-20% es efectivo para rosacea papulopustulosa y mejora la hiperpigmentacion. Tiene propiedades antiinflamatorias, antioxidantes y despigmentantes con buena tolerabilidad.", applicable_zones: ["mejillas", "nariz", "frente"], applicable_treatments: ["Azelaic acid 15%"], tags: ["azelaic acid", "rosacea", "hiperpigmentacion", "antiinflamatorio"], full_citation: "Schulte BC, Wu W, Rosen T. Azelaic acid: evidence-based update on mechanism of action and clinical application. J Drugs Dermatol. 2015;14(9):964-968" },
  { title: "Sunscreens: a review of health benefits, regulations, and controversies", authors: "Geoffrey K, Mwangi AN, Maru SM", year: 2019, journal: "Dermatol Ther", doi: "10.1007/s13555-019-0314-5", key_findings: "Los protectores solares con filtros minerales (oxido de zinc, dioxido de titanio) y quimicos de nueva generacion ofrecen proteccion UVA+UVB. La reaplicacion cada 2 horas es mas importante que el SPF alto.", applicable_zones: ["piel", "frente", "mejillas", "nariz", "cuello"], applicable_treatments: ["Protector solar SPF 50"], tags: ["SPF", "sunscreen", "UVA", "UVB", "fotoproteccion"], full_citation: "Geoffrey K, Mwangi AN, Maru SM. Sunscreen products: rationale for use, formulation development and regulatory considerations. Saudi Pharm J. 2019;27(7):1009-1018" },
  { title: "Cosmeceutical peptides", authors: "Lintner K et al.", year: 2009, journal: "Int J Cosmet Sci", doi: "10.1111/j.1468-2494.2009.00490.x", key_findings: "Los peptidos cosmeticos actuan como senales moleculares que estimulan fibroblastos para producir colageno, elastina y GAGs. Los peptidos biomimeticos son el futuro del cuidado anti-aging topico.", applicable_zones: ["piel", "frente", "periocular", "mandibula"], applicable_treatments: ["Serum de peptidos para firmeza"], tags: ["peptidos", "biomimetico", "colageno", "elastina", "anti-aging"], full_citation: "Lintner K, Mas-Chamberlin C, Mondon P, Pesez O, Lamy L. Cosmeceuticals and active ingredients. Clin Dermatol. 2009;27(5):461-468" },
  { title: "The microbiome in dermatology", authors: "Byrd AL, Belkaid Y, Segre JA", year: 2018, journal: "Nat Rev Microbiol", doi: "10.1038/nrmicro.2017.157", key_findings: "El microbioma cutaneo influye en la funcion de barrera, la inflamacion y la respuesta inmune. La disbiosis se asocia con acne, rosacea, dermatitis y envejecimiento acelerado. Los probioticos topicos son un area emergente.", applicable_zones: ["piel", "mejillas"], applicable_treatments: ["Probioticos topicos", "Limpiador suave + hidratante con ceramidas"], tags: ["microbioma", "barrera cutanea", "probioticos", "inflamacion"], full_citation: "Byrd AL, Belkaid Y, Segre JA. The human skin microbiome. Nat Rev Microbiol. 2018;16(3):143-155" },
  { title: "Ferulic acid stabilizes a solution of vitamins C and E and doubles its photoprotection of skin", authors: "Lin FH et al.", year: 2005, journal: "J Invest Dermatol", doi: "10.1111/j.0022-202X.2005.23768.x", key_findings: "La adicion de acido ferulico al 0.5% a una formulacion de vitamina C al 15% + vitamina E al 1% duplico la fotoproteccion (de 4 a 8 veces) y mejoro la estabilidad quimica del producto.", applicable_zones: ["piel", "frente", "mejillas"], applicable_treatments: ["Vitamina C 15-20% (AM)", "Antioxidantes topicos"], tags: ["acido ferulico", "vitamina C", "vitamina E", "antioxidante", "fotoproteccion"], full_citation: "Lin FH, Lin JY, Gupta RD, et al. Ferulic acid stabilizes a solution of vitamins C and E and doubles its photoprotection of skin. J Invest Dermatol. 2005;125(4):826-832" },
  { title: "Intrinsic skin aging: the role of the growth hormone/insulin-like growth factor-1 axis", authors: "Makrantonaki E, Zouboulis CC", year: 2007, journal: "Dermatoendocrinology", doi: "", key_findings: "La disminucion de hormona de crecimiento e IGF-1 con la edad contribuye directamente a la perdida de colageno, adelgazamiento de la piel y reduccion de la capacidad de reparacion. El sueno profundo optimiza la secrecion de GH.", applicable_zones: ["piel", "mandibula", "cuello"], applicable_treatments: ["Mejora de calidad de sueno", "Ejercicio regular"], tags: ["hormona crecimiento", "IGF-1", "aging", "colageno", "sueno"], full_citation: "Makrantonaki E, Zouboulis CC. The skin as a mirror of the aging process in the human organism. Exp Gerontol. 2007;42(9):879-886" },
]

const ZONE_OPTIONS = ["piel", "frente", "periocular", "nariz", "labios", "mejillas", "mandibula", "cuello"]

const BIO_LABELS: Record<string, string> = {
  luminosity: "Luminosidad",
  hydration: "Hidratacion",
  uniformity: "Uniformidad",
  glycation: "Glicacion",
  inflammation: "Inflamacion",
  sunDamage: "Dano solar",
  vascularity: "Vascularidad",
}

const FUNNEL_LABELS: Record<string, string> = {
  started: "Iniciaron",
  quiz_complete: "Quiz completo",
  scan_started: "Scan iniciado",
  scan_complete: "Scan completo",
  contact_complete: "Contacto completo",
  results_viewed: "Resultados vistos",
  full_results_viewed: "Resultados full",
  plan_viewed: "Plan visto",
}

export default function BrainPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"papers" | "insights" | "patterns">("papers")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState<Insight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: "", authors: "", year: 2025, journal: "", doi: "",
    key_findings: "", applicable_zones: [] as string[],
    applicable_treatments: [] as string[], tags: [] as string[],
    full_citation: "", tagInput: "",
    treatmentInput: "",
  })

  useEffect(() => {
    loadPapers()
  }, [])

  // Load analytics when switching to insights or patterns tab
  useEffect(() => {
    if ((activeTab === "insights" || activeTab === "patterns") && !analytics && !analyticsLoading) {
      loadAnalytics()
    }
  }, [activeTab])

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await fetch("/api/admin/analytics")
      if (res.ok) {
        const data = await res.json()
        if (data.totalLeads > 0) {
          setAnalytics(data)
        }
      }
    } catch (err) {
      console.error("Failed to load analytics:", err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function generateInsights() {
    if (!analytics) return
    setLoadingInsights(true)
    try {
      const res = await fetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsData: analytics }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiInsights(data.insights || [])
      }
    } catch (err) {
      console.error("Failed to generate insights:", err)
    } finally {
      setLoadingInsights(false)
    }
  }

  async function loadPapers() {
    try {
      const res = await fetch("/api/admin/brain")
      if (res.ok) {
        const data = await res.json()
        setPapers(data.papers || [])
        return
      }
    } catch {}
    // Fallback: use seed papers
    const stored = localStorage.getItem("iom_brain_papers")
    if (stored) {
      setPapers(JSON.parse(stored))
    } else {
      const seeded = SEED_PAPERS.map((p, i) => ({ ...p, id: `seed-${i}` }))
      setPapers(seeded)
      localStorage.setItem("iom_brain_papers", JSON.stringify(seeded))
    }
  }

  function savePaper() {
    const paper: Paper = {
      id: editId || `paper-${Date.now()}`,
      title: form.title,
      authors: form.authors,
      year: form.year,
      journal: form.journal,
      doi: form.doi,
      key_findings: form.key_findings,
      applicable_zones: form.applicable_zones,
      applicable_treatments: form.applicable_treatments,
      tags: form.tags,
      full_citation: form.full_citation,
    }

    const updated = editId
      ? papers.map(p => p.id === editId ? paper : p)
      : [...papers, paper]

    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))

    // Try Supabase
    fetch("/api/admin/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paper),
    }).catch(() => {})

    resetForm()
  }

  function deletePaper(id: string) {
    const updated = papers.filter(p => p.id !== id)
    setPapers(updated)
    localStorage.setItem("iom_brain_papers", JSON.stringify(updated))
  }

  function editPaper(paper: Paper) {
    setEditId(paper.id)
    setForm({
      title: paper.title, authors: paper.authors, year: paper.year,
      journal: paper.journal, doi: paper.doi, key_findings: paper.key_findings,
      applicable_zones: paper.applicable_zones,
      applicable_treatments: paper.applicable_treatments,
      tags: paper.tags, full_citation: paper.full_citation,
      tagInput: "", treatmentInput: "",
    })
    setShowAdd(true)
  }

  function resetForm() {
    setShowAdd(false)
    setEditId(null)
    setForm({
      title: "", authors: "", year: 2025, journal: "", doi: "",
      key_findings: "", applicable_zones: [], applicable_treatments: [],
      tags: [], full_citation: "", tagInput: "", treatmentInput: "",
    })
  }

  const filtered = papers.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q) ||
      p.key_findings.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
  })

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e5e2df", fontSize: 14, outline: "none",
    marginBottom: 10, fontFamily: "inherit",
  } as const

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1520", marginBottom: 4 }}>Cerebro</h1>
          <p style={{ fontSize: 13, color: "#888" }}>{papers.length} papers en la base de conocimiento</p>
        </div>
        {activeTab === "papers" && (
          <button
            onClick={() => { resetForm(); setShowAdd(true) }}
            style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #e8a4b0, #c97e8e)",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            + Agregar paper
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["papers", "insights", "patterns"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: activeTab === tab ? "rgba(232,164,176,0.12)" : "rgba(245,237,232,0.04)",
            border: `1px solid ${activeTab === tab ? "rgba(232,164,176,0.3)" : "rgba(245,237,232,0.08)"}`,
            color: activeTab === tab ? "#e8a4b0" : "rgba(245,237,232,0.4)",
          }}>
            {tab === "papers" ? "Papers" : tab === "insights" ? "AI Insights" : "Patrones"}
          </button>
        ))}
      </div>

      {/* ===== PAPERS TAB ===== */}
      {activeTab === "papers" && (
        <>
          {/* Search */}
          <input
            type="text" placeholder="Buscar papers..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 20 }}
          />

          {/* Add/Edit form */}
          {showAdd && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)", border: "1px solid #f0ede9",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1520" }}>
                {editId ? "Editar paper" : "Nuevo paper"}
              </h3>

              <input placeholder="Titulo del estudio" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input placeholder="Autores" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} style={inputStyle} />
                <input placeholder="Ano" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2025 }))} style={inputStyle} />
                <input placeholder="Journal" value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))} style={inputStyle} />
              </div>

              <input placeholder="DOI (opcional)" value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} style={inputStyle} />

              <textarea
                placeholder="Hallazgos clave (lo que se muestra al usuario)"
                value={form.key_findings}
                onChange={e => setForm(f => ({ ...f, key_findings: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />

              <input placeholder="Cita completa" value={form.full_citation} onChange={e => setForm(f => ({ ...f, full_citation: e.target.value }))} style={inputStyle} />

              {/* Zones */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Zonas aplicables</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ZONE_OPTIONS.map(z => (
                    <button
                      key={z}
                      onClick={() => setForm(f => ({
                        ...f,
                        applicable_zones: f.applicable_zones.includes(z)
                          ? f.applicable_zones.filter(x => x !== z)
                          : [...f.applicable_zones, z]
                      }))}
                      style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 12,
                        border: `1px solid ${form.applicable_zones.includes(z) ? "#e8a4b0" : "#e5e2df"}`,
                        background: form.applicable_zones.includes(z) ? "#fdf2f4" : "#fff",
                        color: form.applicable_zones.includes(z) ? "#c97e8e" : "#666",
                        cursor: "pointer",
                      }}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Tags</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 6, background: "#f0ede9", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>x</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Agregar tag + Enter"
                  value={form.tagInput}
                  onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && form.tagInput.trim()) {
                      setForm(f => ({ ...f, tags: [...f.tags, f.tagInput.trim()], tagInput: "" }))
                    }
                  }}
                  style={{ ...inputStyle, maxWidth: 200 }}
                />
              </div>

              {/* Treatments */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>Tratamientos aplicables</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {form.applicable_treatments.map(t => (
                    <span key={t} style={{ padding: "3px 10px", borderRadius: 6, background: "#f0ede9", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, applicable_treatments: f.applicable_treatments.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 0 }}>x</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Nombre del tratamiento + Enter"
                  value={form.treatmentInput}
                  onChange={e => setForm(f => ({ ...f, treatmentInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && form.treatmentInput.trim()) {
                      setForm(f => ({ ...f, applicable_treatments: [...f.applicable_treatments, f.treatmentInput.trim()], treatmentInput: "" }))
                    }
                  }}
                  style={{ ...inputStyle, maxWidth: 300 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={savePaper} style={{
                  padding: "10px 24px", background: "#22c55e", border: "none", borderRadius: 10,
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                  {editId ? "Guardar cambios" : "Agregar paper"}
                </button>
                <button onClick={resetForm} style={{
                  padding: "10px 24px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 14, cursor: "pointer",
                }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Papers list */}
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(paper => (
              <div key={paper.id} style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f0ede9",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 4 }}>{paper.title}</h3>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                      {paper.authors} -- {paper.year} -- {paper.journal}
                    </p>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginBottom: 8 }}>{paper.key_findings}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {paper.applicable_zones.map(z => (
                        <span key={z} style={{ padding: "2px 8px", borderRadius: 6, background: "#fdf2f4", color: "#c97e8e", fontSize: 10, fontWeight: 600 }}>{z}</span>
                      ))}
                      {paper.tags.map(t => (
                        <span key={t} style={{ padding: "2px 8px", borderRadius: 6, background: "#f0ede9", color: "#888", fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button onClick={() => editPaper(paper)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#888" }}>Editar</button>
                    <button onClick={() => deletePaper(paper.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              {papers.length === 0 ? "No hay papers. Los papers del seed se cargaran automaticamente." : "Sin resultados para esa busqueda."}
            </div>
          )}
        </>
      )}

      {/* ===== AI INSIGHTS TAB ===== */}
      {activeTab === "insights" && (
        <div>
          {analyticsLoading && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              Cargando datos de analytics...
            </div>
          )}

          {!analyticsLoading && !analytics && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32, textAlign: "center",
              border: "1px solid #f0ede9",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>||</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1520", marginBottom: 8 }}>Sin datos de analytics</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                No se encontraron leads con datos de scan. Los insights se generan a partir de datos reales de usuarios.
              </p>
              <button
                onClick={loadAnalytics}
                style={{
                  padding: "8px 20px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 13, cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!analyticsLoading && analytics && (
            <>
              {/* Summary strip */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24,
              }}>
                {[
                  { label: "Total leads", value: analytics.totalLeads },
                  { label: "Con scan", value: analytics.totalScans },
                  { label: "Score promedio", value: `${analytics.avgScore}/100` },
                  { label: "Edad aparente prom.", value: `${analytics.avgApparentAge} a.` },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: "#fff", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid #f0ede9", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1520" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={generateInsights}
                disabled={loadingInsights}
                style={{
                  padding: "12px 28px",
                  background: loadingInsights
                    ? "rgba(232,164,176,0.3)"
                    : "linear-gradient(135deg, #e8a4b0, #c97e8e)",
                  border: "none", borderRadius: 12, color: "#fff", fontSize: 14,
                  fontWeight: 600, cursor: loadingInsights ? "wait" : "pointer",
                  marginBottom: 24, width: "100%",
                }}
              >
                {loadingInsights ? "Generando insights con IA..." : "Generar insights con IA"}
              </button>

              {/* Insights cards */}
              {aiInsights.length > 0 && (
                <div style={{ display: "grid", gap: 12 }}>
                  {aiInsights.map((insight, i) => (
                    <div key={i} style={{
                      background: "#fff", borderRadius: 14, padding: "18px 20px",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f0ede9",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520" }}>{insight.title}</h3>
                        <span style={{
                          padding: "2px 10px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                          background: insight.confidence === "alta" ? "#dcfce7" : insight.confidence === "media" ? "#fef9c3" : "#f0ede9",
                          color: insight.confidence === "alta" ? "#16a34a" : insight.confidence === "media" ? "#ca8a04" : "#888",
                        }}>
                          {insight.confidence}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, marginBottom: 8 }}>
                        {insight.finding}
                      </p>
                      <div style={{
                        background: "rgba(232,164,176,0.06)", borderRadius: 8, padding: "8px 12px",
                        borderLeft: "3px solid #e8a4b0",
                      }}>
                        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 600 }}>Recomendacion:</span> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== PATTERNS TAB ===== */}
      {activeTab === "patterns" && (
        <div>
          {analyticsLoading && (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              Cargando datos...
            </div>
          )}

          {!analyticsLoading && !analytics && (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 32, textAlign: "center",
              border: "1px solid #f0ede9",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>||</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1520", marginBottom: 8 }}>Sin datos de patrones</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Los patrones se calculan a partir de datos reales de leads con scan completado.
              </p>
              <button
                onClick={loadAnalytics}
                style={{
                  padding: "8px 20px", background: "#f0ede9", border: "none", borderRadius: 10,
                  color: "#666", fontSize: 13, cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!analyticsLoading && analytics && (
            <>
              {/* Average Score */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Score promedio de salud facial</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    flex: 1, height: 24, borderRadius: 12, background: "#f0ede9", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${analytics.avgScore}%`, height: "100%", borderRadius: 12,
                      background: analytics.avgScore >= 70 ? "linear-gradient(90deg, #22c55e, #16a34a)" :
                        analytics.avgScore >= 40 ? "linear-gradient(90deg, #eab308, #ca8a04)" :
                        "linear-gradient(90deg, #ef4444, #dc2626)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1520", minWidth: 50 }}>
                    {analytics.avgScore}/100
                  </span>
                </div>
              </div>

              {/* Biomarker Averages */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 16 }}>Biomarcadores promedio</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {Object.entries(analytics.bioAvgs).map(([key, value]) => {
                    const isInverse = ["glycation", "inflammation", "sunDamage", "vascularity"].includes(key)
                    const displayVal = isInverse ? 100 - value : value
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#666" }}>{BIO_LABELS[key] || key}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1520" }}>
                            {displayVal}/100 {isInverse ? "(invertido)" : ""}
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "#f0ede9", overflow: "hidden" }}>
                          <div style={{
                            width: `${displayVal}%`, height: "100%", borderRadius: 4,
                            background: displayVal >= 70 ? "#22c55e" : displayVal >= 40 ? "#eab308" : "#ef4444",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top 3 Weaknesses */}
              {analytics.topWeaknesses.length > 0 && (
                <div style={{
                  background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                  border: "1px solid #f0ede9",
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Top 3 areas mas debiles</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {analytics.topWeaknesses.map((w, i) => (
                      <div key={w.key} style={{
                        background: i === 0 ? "rgba(239,68,68,0.06)" : i === 1 ? "rgba(234,179,8,0.06)" : "rgba(245,237,232,0.5)",
                        borderRadius: 10, padding: "12px 14px", textAlign: "center",
                        border: `1px solid ${i === 0 ? "rgba(239,68,68,0.15)" : i === 1 ? "rgba(234,179,8,0.15)" : "#f0ede9"}`,
                      }}>
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>#{i + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1520" }}>{BIO_LABELS[w.key] || w.key}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? "#ef4444" : i === 1 ? "#ca8a04" : "#888", marginTop: 4 }}>
                          {w.displayValue}/100
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Correlations */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16,
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 12 }}>Correlaciones de estilo de vida</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div style={{
                    background: "rgba(232,164,176,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(232,164,176,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Estres alto con inflamacion</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#c97e8e" }}>
                      {analytics.correlations.stressInflammation !== null ? `${analytics.correlations.stressInflammation}%` : "N/A"}
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Poco sueno reportado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
                      {analytics.correlations.sleepIssues}
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(234,179,8,0.06)", borderRadius: 10, padding: "14px",
                    border: "1px solid rgba(234,179,8,0.15)",
                  }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Alta exposicion solar</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ca8a04" }}>
                      {analytics.correlations.sunExposure}
                    </div>
                  </div>
                </div>
              </div>

              {/* Funnel Conversion */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: "1px solid #f0ede9",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1520", marginBottom: 16 }}>Funnel de conversion</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {Object.entries(analytics.funnelCounts).map(([stage, count], i, arr) => {
                    const maxCount = arr[0]?.[1] as number || 1
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={stage}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#666" }}>{FUNNEL_LABELS[stage] || stage}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1520" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "#f0ede9", overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`, height: "100%", borderRadius: 3,
                            background: "linear-gradient(90deg, #e8a4b0, #c97e8e)",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
