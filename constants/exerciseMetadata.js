// Static metadata for recommendation engine
// Maps each exercise ID to recommendation-relevant attributes

export const EXERCISE_METADATA = {
    a1: { // Shoulder Shrugs
        targetImpairments: ['motor'],
        bodyRegion: 'upper',
        bilateral: true,
        safeForSevere: true,
        phaseRelevance: { acute: 3, subacute: 2, chronic: 1 },
    },
    a2: { // Table Push
        targetImpairments: ['motor'],
        bodyRegion: 'upper',
        bilateral: false,
        safeForSevere: true,
        phaseRelevance: { acute: 2, subacute: 3, chronic: 2 },
    },
    a3: { // Bicep Curls
        targetImpairments: ['motor'],
        bodyRegion: 'upper',
        bilateral: false,
        safeForSevere: false,
        phaseRelevance: { acute: 0, subacute: 2, chronic: 3 },
    },
    l1: { // Ankle Pumps
        targetImpairments: ['motor'],
        bodyRegion: 'lower',
        bilateral: true,
        safeForSevere: true,
        phaseRelevance: { acute: 3, subacute: 2, chronic: 1 },
    },
    l2: { // Seated Marching
        targetImpairments: ['motor'],
        bodyRegion: 'lower',
        bilateral: true,
        safeForSevere: true,
        phaseRelevance: { acute: 2, subacute: 3, chronic: 2 },
    },
    l3: { // Sit-to-Stand
        targetImpairments: ['motor'],
        bodyRegion: 'lower',
        bilateral: true,
        safeForSevere: false,
        phaseRelevance: { acute: 0, subacute: 2, chronic: 3 },
    },
    c1: { // Trunk Rotations
        targetImpairments: ['motor'],
        bodyRegion: 'core',
        bilateral: true,
        safeForSevere: true,
        phaseRelevance: { acute: 2, subacute: 3, chronic: 2 },
    },
    c2: { // Lateral Flexion
        targetImpairments: ['motor'],
        bodyRegion: 'core',
        bilateral: true,
        safeForSevere: true,
        phaseRelevance: { acute: 1, subacute: 3, chronic: 2 },
    },
    c3: { // Seated Balance
        targetImpairments: ['motor', 'cognitive'],
        bodyRegion: 'core',
        bilateral: true,
        safeForSevere: false,
        phaseRelevance: { acute: 0, subacute: 2, chronic: 3 },
    },
    h1: { // Fist Clenches
        targetImpairments: ['motor'],
        bodyRegion: 'fine_motor',
        bilateral: false,
        safeForSevere: true,
        phaseRelevance: { acute: 3, subacute: 3, chronic: 2 },
    },
    h2: { // Towel Scrunch
        targetImpairments: ['motor'],
        bodyRegion: 'fine_motor',
        bilateral: false,
        safeForSevere: false,
        phaseRelevance: { acute: 1, subacute: 3, chronic: 2 },
    },
    h3: { // Thumb Touch
        targetImpairments: ['motor', 'cognitive'],
        bodyRegion: 'fine_motor',
        bilateral: false,
        safeForSevere: false,
        phaseRelevance: { acute: 0, subacute: 2, chronic: 3 },
    },
};

// Human-readable reason strings for each body region
export const REGION_REASONS = {
    upper: 'For upper body recovery',
    lower: 'For lower body mobility',
    core: 'For core stability',
    fine_motor: 'For fine motor skills',
};
