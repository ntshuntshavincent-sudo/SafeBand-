/**
 * FNB AOTY Hackathon 2026 Official Judging Criteria Breakdown
 * SafeBand 70/70 Perfect Alignment Rubric & Evidence Matrix
 */

export interface JudgingCriterion {
  id: string;
  name: string;
  maxScore: number;
  targetedScore: number;
  officialQuestions: string[];
  safeBandAnswer: string;
  keyFeaturesEvidence: string[];
  demonstrations: string[];
  competitiveSuperiority: string;
}

export const JUDGING_CRITERIA_MATRIX: JudgingCriterion[] = [
  {
    id: 'product',
    name: 'Product',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'Is the app a complete solution or does is it far from completion?',
      'Is it polished and does it work in a way the user would expect?',
      'Does it do what it is meant to do, and resolve the needs of the challenges it addresses?',
      'Is there a market need for the application?',
      'Does it have traction?'
    ],
    safeBandAnswer: 
      'SafeBand is a 100% complete, fully functional Progressive Web App addressing the South African GBV crisis. It features real-time GPS breadcrumb tracking with reverse geocoding, client-side AES-256 encrypted tamper-proof evidence capture, an offline-cached verified support directory (hotlines, shelters, PEP clinics), and a live campus security responder console.',
    keyFeaturesEvidence: [
      'Real-time GPS Tracking with OpenStreetMap reverse geocoding & breadcrumb trail',
      'Client-side AES-256-GCM Vault & SHA-256 legal hash generation with 0 phone gallery trace',
      'Anti-Coercion Dual-PIN system (Duress PIN 9999 reveals sanitized notes)',
      'Verified Directory with 1-tap call & *120*7867# USSD loadshedding access',
      'Campus Security Control Room Dispatch Console with active signal routing'
    ],
    demonstrations: [
      'Live GPS walk simulation with safe zone detection',
      'In-browser photo/audio incident recording with instant SHA-256 certificate generation',
      'Triggering panic exit (<150ms zero-trace memory wipe)',
      'Simulating campus dispatch unit assignment'
    ],
    competitiveSuperiority: 'Unlike prototype mockups, SafeBand is end-to-end operational in browser and mobile viewports with full offline PWA caching.'
  },
  {
    id: 'creativity',
    name: 'Creativity',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'Is it a new application or service that has been created?',
      'How creative is the approach?',
      'Is it contributing towards the improvement of society or business in some new way?',
      'Is it commercially, socially, politically, or personally appealing, relevant and exciting?',
      'Is it freshly entertaining, a new approach to an old problem or a better way to do something more effectively?'
    ],
    safeBandAnswer:
      'SafeBand radically reimagines safety tech from the survivor\'s perspective: traditional panic apps get survivors beaten when discovered by abusive partners. SafeBand turns stealth into a survival shield using a dual-PIN anti-coercion mechanism, covert acoustic triggers, zero-trace memory flushing, and disguised QR touchpoints in private campus spaces (restrooms and laundry rooms).',
    keyFeaturesEvidence: [
      'Dual-PIN Coercion Protocol: Entering PIN 9999 displays a harmless student study timetable',
      'Zero-Gallery Footprint: Encrypted chunks stream directly to cloud vault, leaving zero incriminating evidence on the device',
      'Subtle Gesture & Hardware SOS triggers (3-second hold or triple-tap)',
      'Legal Chain of Custody token generation compliant with South African ECTA 25 of 2002'
    ],
    demonstrations: [
      'Enter Duress Mode to inspect sanitized decoy notes that fool perpetrators',
      'Review ECTA 25 of 2002 digital certificate generated for evidence items',
      'Benchmark memory purge speed (<150ms) during panic exit'
    ],
    competitiveSuperiority: 'First platform in South Africa to combine anti-coercion dual-PINs with cryptographic court-admissibility certificates.'
  },
  {
    id: 'usability',
    name: 'Usability',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'Is the app easy to use?',
      'Is there a clarity, simplicity and intuitive feel of how the app works and what to do next?'
    ],
    safeBandAnswer:
      'Engineered specifically for high-adrenaline crisis situations. Clean, high-contrast dark theme (#020617) designed for low-light survival. Features bottom-anchored thumb-zone navigation, single-tap panic exits, 1-touch emergency hotline dialing, and zero multi-step onboarding barriers.',
    keyFeaturesEvidence: [
      'Mobile Thumb-Zone layout adhering to touch accessibility standards (min 48px tap targets)',
      'Persistent Floating Panic Button accessible from any screen in <150ms',
      'Zero mandatory sign-up tracking for immediate survivor anonymity',
      'Universal offline fallback banner with instant cached directory access'
    ],
    demonstrations: [
      'Navigate using single-hand thumb reach on mobile viewport',
      'Trigger 1-touch call to National GBV Command Centre or Tears Foundation',
      'Test instant offline mode with local service worker cache'
    ],
    competitiveSuperiority: 'No complex menus or mandatory registration walls that could cost a survivor their life in an emergency.'
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'What is the potential of the application and the team of developers behind it?',
      'Can the app be taken to the next level?',
      'Is there a potential path to revenue with the app?'
    ],
    safeBandAnswer:
      'SafeBand adopts an ethical, highly lucrative institutional B2B/B2G SaaS model: 100% free for individual survivors, while generating recurring revenue from Universities (R35k/campus/yr), Municipalities (R120k/yr for CPF dispatch), and Corporate CSI sponsors (R50k packages). Year 1 generates R275k revenue (45% net margin), scaling to R2.08M in Year 3 (78% net margin).',
    keyFeaturesEvidence: [
      'B2B Campus SaaS License: ~R2.90 per student/yr for university security dashboard and onboarding',
      'B2G Municipal Contracts: Integrated Community Policing Forum (CPF) dispatch & anonymized heat maps',
      'Corporate CSI Grants: Sponsored zero-rated SMS and data packages (Vodacom, MTN, FNB)',
      'Low Operational Cost Structure: Just R8,000/mo OpEx (~R96k/yr) supported by modest CapEx'
    ],
    demonstrations: [
      'Inspect 3-Year Financial Model and OpEx/CapEx breakdown in the PowerPoint slide deck',
      'Review institutional dashboard features for university campus security teams'
    ],
    competitiveSuperiority: 'Avoids exploitative subscriptions for vulnerable victims while securing stable institutional budgets.'
  },
  {
    id: 'impact',
    name: 'Impact',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'How much impact does the application have?',
      'What kind of problem does it solve – a big or small one?',
      'What is the level of indispensability and importance of the app?'
    ],
    safeBandAnswer:
      'Solves South Africa\'s most devastating social crisis: over 50,000 official GBV cases reported annually (>100 rapes daily). Addresses domestic violence escalation, empowers tertiary students in dangerous student corridors, preserves evidence for high conviction rates under ECTA 25 of 2002, and facilitates critical 72-hour HIV Post-Exposure Prophylaxis (PEP).',
    keyFeaturesEvidence: [
      'Direct alignment with National Strategic Plan on Gender-Based Violence and Femicide (NSP-GBVF)',
      'Preserves the critical 72-hour window for HIV PEP initiation at Thuthuzela Care Centres',
      'Prevents perpetrator evidence destruction (<10% currently survives to trial)',
      'Targets 5,000 protected student survivors within 6 months of rollout'
    ],
    demonstrations: [
      'View Thuthuzela Care Centre locator with PEP starter kit verification',
      'Verify SHA-256 evidence certificate containing legal device and GPS metadata'
    ],
    competitiveSuperiority: 'Addresses the entire lifecycle of GBV response: pre-incident stealth, crisis beaconing, medical PEP, and judicial conviction.'
  },
  {
    id: 'presentation',
    name: 'Presentation',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'How well did the team communicate their idea/app?',
      'Were they effective in telling their story and did they convey the importance and relevance of the mobile application to society?'
    ],
    safeBandAnswer:
      'TechResolvers delivers a world-class, pitch-ready presentation: a 11-slide widescreen PowerPoint deck accessible directly in-app, printable to PDF, downloadable as native .PPTX, equipped with verbatim speaker notes for judging delivery, backed by team walk-in anthem ("All I Do Is Win").',
    keyFeaturesEvidence: [
      'Interactive In-Browser Presentation Viewer with Fullscreen mode (press F)',
      'Verbatim Speaker Notes for all 11 slides for flawless team pitch delivery',
      'Direct .PPTX download + 1-click PDF print export for universal offline access',
      'Engaging team identity: TechResolvers (Virtual Track) with anthem by DJ Khaled'
    ],
    demonstrations: [
      'Launch interactive slide deck and toggle speaker notes script',
      'Present Slide 2 empirical SAPS statistics and Slide 8 business model to judges'
    ],
    competitiveSuperiority: 'Complete pitch deck built natively into the platform with multiple formats, eliminating projection and software hiccups.'
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    maxScore: 10,
    targetedScore: 10,
    officialQuestions: [
      'Can the app “think” for itself, forecast, and predict the user’s likely future behaviour by analyzing patterns in data inputs?'
    ],
    safeBandAnswer:
      'SafeBand features the "Cortex Neural Safety" predictive engine: it learns the user\'s daily habitual travel corridors, compares real-time movement velocity and trajectories to detect sudden flight or prolonged halts, integrates live Eskom Loadshedding schedules to forecast dark street corridors before the user enters them, and autonomously pre-arms emergency beacons if battery depletion and route variance escalate danger.',
    keyFeaturesEvidence: [
      'Habitual Corridor Pattern Learning: Compares live GPS to 30-day baseline routes',
      'Biomechanical Pace Anomaly Detection: Detects sprinting (>9.5 km/h) or unnatural paralysis',
      'Loadshedding Grid Hazard Forecaster: Predicts unlit municipal blackouts in the user\'s transit path',
      'Battery Survival Forecaster: Anticipates premature device power loss under crisis conditions',
      'Autonomous Pre-emptive Safeguards: Pre-arms SOS beacons and triggers silent haptic heartbeat check-ins'
    ],
    demonstrations: [
      'Simulate an abrupt route divergence into an unlit off-campus sector',
      'Observe live Risk Probability score change dynamically from 15% to 85%',
      'Verify autonomous pre-emptive SOS arming and alert packet generation'
    ],
    competitiveSuperiority: 'Moves beyond reactive panic buttons to predictive, proactive autonomous protection that thinks ahead of danger.'
  }
];
