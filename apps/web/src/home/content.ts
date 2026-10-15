export type HomeLang = 'fr' | 'en';

export interface HomeCopy {
  lang: HomeLang;
  meta: { title: string; description: string };
  nav: {
    skip: string;
    label: string;
    howItWorks: string;
    tryIt: string;
    login: string;
    cta: string;
    ctaShort: string;
    switchTo: string;
    switchLabel: string;
    home: string;
  };
  sample: string;
  hero: {
    eyebrow: string;
    title: [string, string];
    body: string;
    secondary: string;
    fig: string;
    linkLabel: string;
    destinationLabel: string;
    edit: string;
    managed: string;
    active: string;
    toast: string;
  };
  oldWay: {
    eyebrow: string;
    title: string;
    body: string;
    before: string;
    after: string;
    notFound: string;
    notFoundBody: string;
    scans: string;
    scansUnknown: string;
    reprint: string;
    fig: string;
  };
  rule: {
    eyebrow: string;
    title: [string, string];
    body: string;
    steps: [string, string, string];
    editTitle: string;
    destinationField: string;
    save: string;
    saved: string;
    qrLabel: string;
    qrState: string;
    route: [string, string, string];
    fig: string;
  };
  mechanism: {
    eyebrow: string;
    title: string;
    body: string;
    panels: { tab: string; title: string; body: string; fig: string }[];
    create: { destination: string; slug: string; customSlug: string; submit: string };
    share: {
      direct: string;
      managed: string;
      ink: string;
      background: string;
      size: string;
      export: string;
    };
    secure: { password: string; expiry: string; expiryValue: string; active: string; note: string };
    track: {
      clicks: string;
      scans: string;
      devices: string;
      sources: string;
      direct: string;
      mobile: string;
      desktop: string;
      tablet: string;
    };
  };
  tryIt: {
    eyebrow: string;
    title: string;
    body: string;
    label: string;
    placeholder: string;
    generate: string;
    download: string;
    copy: string;
    ink: string;
    inks: [string, string, string];
    note: string;
    ready: string;
    copied: string;
    copyFailed: string;
    downloaded: string;
    invalid: string;
    encoded: string;
    qrAlt: string;
  };
  identity: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    name: string;
    role: string;
    company: string;
    email: string;
    phone: string;
    website: string;
    cards: { kicker: string; title: string; detail: string }[];
    saveContact: string;
    share: string;
    copySignature: string;
    mailTo: string;
    mailSubject: string;
    mailBody: string;
    clients: string;
  };
  signal: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    periods: [string, string, string];
    periodLabel: string;
    clicks: string;
    scans: string;
    devices: string;
    browsers: string;
    sources: string;
    direct: string;
    chartLabel: string;
  };
  payoff: {
    eyebrow: string;
    title: string;
    body: string;
    pause: string;
    play: string;
    tiles: { title: string; body: string }[];
  };
  action: {
    eyebrow: string;
    title: string;
    body: string;
    footerTagline: string;
    rights: string;
  };
}

const fr: HomeCopy = {
  lang: 'fr',
  meta: {
    title: 'WRX — Imprimez une fois. Redirigez après.',
    description:
      'Liens courts, QR codes gérés, cartes de visite, cartes digitales et signatures e-mail. Changez la destination sans réimprimer, et suivez clics et scans.',
  },
  nav: {
    skip: 'Aller au contenu',
    label: 'Navigation principale',
    howItWorks: 'Comment ça marche',
    tryIt: 'Essayer',
    login: 'Se connecter',
    cta: 'Créer mon compte gratuit',
    ctaShort: 'Créer un compte',
    switchTo: 'EN',
    switchLabel: 'Read in English',
    home: 'WRX, accueil',
  },
  sample: 'Exemple',
  hero: {
    eyebrow: 'Liens · QR codes · Cartes · Signatures',
    title: ['Imprimez une fois.', 'Redirigez après.'],
    body: 'WRX crée les liens courts, QR codes, cartes et signatures qui portent votre adresse, et vous laisse changer la destination.',
    secondary: 'Voir comment ça marche',
    fig: 'Fig. 01 — Un QR géré, relié à un lien WRX. Données d’exemple.',
    linkLabel: 'Lien WRX',
    destinationLabel: 'Destination',
    edit: 'Modifier',
    managed: 'QR géré',
    active: 'Actif',
    toast: 'Destination mise à jour',
  },
  oldWay: {
    eyebrow: '02 — Le problème',
    title: 'Un QR imprimé ne se corrige pas.',
    body: 'La page change, la campagne se termine : vos flyers pointent vers une impasse, et rien ne dit qui a scanné.',
    before: 'Le jour de l’impression',
    after: 'Trois semaines plus tard',
    notFound: '404',
    notFoundBody: 'Page introuvable',
    scans: 'Scans',
    scansUnknown: 'inconnu',
    reprint: 'Seule solution : réimprimer.',
    fig: 'Fig. 02 — Un QR direct contient l’adresse elle-même. Illustration.',
  },
  rule: {
    eyebrow: '03 — La règle WRX',
    title: ['L’entrée reste.', 'La destination bouge.'],
    body: 'Le QR géré passe par votre lien WRX : modifiez la destination, le papier imprimé reste juste.',
    steps: [
      'Le QR imprimé ne change pas.',
      'Vous modifiez la destination du lien.',
      'Le scan suivant arrive au bon endroit.',
    ],
    editTitle: 'Modifier le lien',
    destinationField: 'URL de destination',
    save: 'Enregistrer',
    saved: 'Enregistré',
    qrLabel: 'QR géré',
    qrState: 'Inchangé · rien à réimprimer',
    route: ['Scan', 'Lien WRX', 'Destination actuelle'],
    fig: 'Fig. 03 — Scan → lien WRX → destination actuelle.',
  },
  mechanism: {
    eyebrow: '04 — Comment ça marche',
    title: 'Créer, partager, sécuriser, suivre.',
    body: 'Quatre gestes, un seul fil : du slug personnalisé jusqu’au scan qui revient.',
    panels: [
      {
        tab: 'Créer',
        title: 'Un lien court, à votre nom.',
        body: 'Collez une destination, choisissez un slug : votre lien est prêt à partager.',
        fig: 'Fig. 4.1 — Création d’un lien',
      },
      {
        tab: 'Partager',
        title: 'Un QR prêt à imprimer.',
        body: 'Couleurs, taille, marge : exportez en PNG, SVG ou PDF, en direct ou géré.',
        fig: 'Fig. 4.2 — Export du QR',
      },
      {
        tab: 'Sécuriser',
        title: 'Protégé, daté ou en pause.',
        body: 'Ajoutez un mot de passe, une date d’expiration, ou désactivez le lien quand vous voulez.',
        fig: 'Fig. 4.3 — Règles du lien',
      },
      {
        tab: 'Suivre',
        title: 'Chaque clic et chaque scan compte.',
        body: 'Jour par jour, par appareil, navigateur et source, sur 7, 30 ou 90 jours.',
        fig: 'Fig. 4.4 — Statistiques. Données d’exemple.',
      },
    ],
    create: {
      destination: 'URL de destination',
      slug: 'Slug',
      customSlug: 'Slug personnalisé',
      submit: 'Créer le lien',
    },
    share: {
      direct: 'QR direct',
      managed: 'QR géré',
      ink: 'Encre',
      background: 'Fond',
      size: 'Taille',
      export: 'Exporter',
    },
    secure: {
      password: 'Mot de passe',
      expiry: 'Date d’expiration',
      expiryValue: '31 déc. 2026',
      active: 'Lien actif',
      note: 'Après expiration, le lien répond « expiré » au lieu de rediriger.',
    },
    track: {
      clicks: 'Clics',
      scans: 'Scans',
      devices: 'Appareils',
      sources: 'Sources',
      direct: 'Direct',
      mobile: 'Mobile',
      desktop: 'Ordinateur',
      tablet: 'Tablette',
    },
  },
  tryIt: {
    eyebrow: '05 — Essayez ici',
    title: 'Votre QR, sans compte.',
    body: 'Collez une URL : le QR se génère dans votre navigateur et se télécharge en SVG.',
    label: 'Votre adresse',
    placeholder: 'https://votre-site.fr/menu',
    generate: 'Générer',
    download: 'Télécharger le SVG',
    copy: 'Copier l’adresse',
    ink: 'Encre',
    inks: ['Encre', 'Bleu', 'Nuit'],
    note: 'Ce QR contient l’adresse elle-même : il ne se modifie pas et ne compte pas les scans. Pour ça, il faut un QR géré.',
    ready: 'QR prêt. Scannez-le ou téléchargez-le.',
    copied: 'Adresse copiée.',
    copyFailed: 'Copie indisponible dans ce navigateur.',
    downloaded: 'QR téléchargé en SVG.',
    invalid:
      'Saisissez une adresse http:// ou https:// valide, sans identifiants (512 caractères maximum).',
    encoded: 'Adresse encodée',
    qrAlt: 'QR code de l’adresse',
  },
  identity: {
    eyebrow: '06 — Un profil, trois supports',
    title: 'Votre identité, sur papier et à l’écran.',
    body: 'Partez de votre profil : carte de visite en 5 modèles, carte digitale avec vCard, signature pour Gmail, Outlook ou Apple Mail.',
    note: 'Chaque support reçoit une copie de votre profil, modifiable séparément.',
    name: 'Votre nom',
    role: 'Votre fonction',
    company: 'Votre entreprise',
    email: 'vous@entreprise.fr',
    phone: '+33 6 00 00 00 00',
    website: 'entreprise.fr',
    cards: [
      {
        kicker: 'Carte de visite',
        title: 'Prête à imprimer.',
        detail: '5 modèles · recto et verso · PNG 300 dpi ou PDF via l’impression',
      },
      {
        kicker: 'Carte digitale',
        title: 'Une page à partager.',
        detail: 'Publiée sur son lien · contact en .vcf · partage natif ou par QR',
      },
      {
        kicker: 'Signature e-mail',
        title: 'Dans chaque message.',
        detail: '3 mises en page · copie riche ou HTML · guides Gmail, Outlook, Apple Mail',
      },
    ],
    saveContact: 'Enregistrer le contact',
    share: 'Partager',
    copySignature: 'Copier la signature',
    mailTo: 'À : client@exemple.fr',
    mailSubject: 'Objet : Notre proposition',
    mailBody: 'Bonjour, vous trouverez la proposition en pièce jointe. Bonne journée,',
    clients: 'Gmail · Outlook · Apple Mail',
  },
  signal: {
    eyebrow: '07 — Ce qui revient',
    title: 'Voyez qui scanne, et d’où ça vient.',
    body: 'Clics et scans par jour, appareil, navigateur et source, sur 7, 30 ou 90 jours.',
    note: 'Données d’exemple. Les vues des cartes et des signatures ne sont pas comptées.',
    periods: ['7 j', '30 j', '90 j'],
    periodLabel: 'Période',
    clicks: 'Clics',
    scans: 'Scans',
    devices: 'Appareils',
    browsers: 'Navigateurs',
    sources: 'Sources',
    direct: 'Direct',
    chartLabel: 'Clics et scans par jour, données d’exemple',
  },
  payoff: {
    eyebrow: '08 — Tout au même endroit',
    title: 'Un espace, tous vos supports.',
    body: 'Gratuit pour commencer : 10 liens courts et 5 QR codes. Passez à Pro quand vous en avez besoin.',
    pause: 'Mettre en pause le défilement',
    play: 'Reprendre le défilement',
    tiles: [
      {
        title: 'Liens courts',
        body: 'Slug personnalisé, destination modifiable, mot de passe, expiration.',
      },
      { title: 'QR codes', body: 'Direct ou géré. Couleurs et taille. PNG, SVG ou PDF.' },
      { title: 'Statistiques', body: 'Clics et scans par jour, appareil, navigateur et source.' },
      { title: 'Cartes de visite', body: '5 modèles, recto verso, PNG 300 dpi.' },
      { title: 'Cartes digitales', body: 'Une page publiée et un contact .vcf.' },
      { title: 'Signatures', body: '3 mises en page, copie riche ou HTML.' },
      { title: 'Mots de passe', body: 'Générés dans votre navigateur. Rien n’est envoyé.' },
      { title: 'Votre espace', body: '3 navigations, 5 accents, clair ou sombre.' },
    ],
  },
  action: {
    eyebrow: '09 — À vous',
    title: 'Créez votre premier lien.',
    body: 'Un compte gratuit suffit pour publier, modifier et suivre.',
    footerTagline: 'Créer. Partager. Sécuriser. Suivre.',
    rights: '© 2026 WRX',
  },
};

const en: HomeCopy = {
  lang: 'en',
  meta: {
    title: 'WRX — Print once. Redirect later.',
    description:
      'Short links, managed QR codes, business cards, digital cards and email signatures. Change the destination without reprinting, and track clicks and scans.',
  },
  nav: {
    skip: 'Skip to content',
    label: 'Main navigation',
    howItWorks: 'How it works',
    tryIt: 'Try it',
    login: 'Log in',
    cta: 'Create my free account',
    ctaShort: 'Sign up',
    switchTo: 'FR',
    switchLabel: 'Lire en français',
    home: 'WRX, home',
  },
  sample: 'Sample',
  hero: {
    eyebrow: 'Links · QR codes · Cards · Signatures',
    title: ['Print once.', 'Redirect later.'],
    body: 'WRX makes the short links, QR codes, cards and signatures that carry your address, and lets you change where they lead.',
    secondary: 'See how it works',
    fig: 'Fig. 01 — A managed QR, tied to a WRX link. Sample data.',
    linkLabel: 'WRX link',
    destinationLabel: 'Destination',
    edit: 'Edit',
    managed: 'Managed QR',
    active: 'Active',
    toast: 'Destination updated',
  },
  oldWay: {
    eyebrow: '02 — The problem',
    title: 'A printed QR can’t be corrected.',
    body: 'The page moves, the campaign ends: your flyers lead to a dead end, and nothing tells you who scanned.',
    before: 'On print day',
    after: 'Three weeks later',
    notFound: '404',
    notFoundBody: 'Page not found',
    scans: 'Scans',
    scansUnknown: 'unknown',
    reprint: 'Only fix: reprint.',
    fig: 'Fig. 02 — A direct QR holds the address itself. Illustration.',
  },
  rule: {
    eyebrow: '03 — The WRX rule',
    title: ['The entry stays.', 'The destination moves.'],
    body: 'A managed QR goes through your WRX link: change the destination, and the printed paper stays right.',
    steps: [
      'The printed QR doesn’t change.',
      'You edit the link’s destination.',
      'The next scan lands in the right place.',
    ],
    editTitle: 'Edit link',
    destinationField: 'Destination URL',
    save: 'Save',
    saved: 'Saved',
    qrLabel: 'Managed QR',
    qrState: 'Unchanged · nothing to reprint',
    route: ['Scan', 'WRX link', 'Current destination'],
    fig: 'Fig. 03 — Scan → WRX link → current destination.',
  },
  mechanism: {
    eyebrow: '04 — How it works',
    title: 'Create, share, secure, track.',
    body: 'Four moves, one thread: from your custom slug to the scan that comes back.',
    panels: [
      {
        tab: 'Create',
        title: 'A short link, in your name.',
        body: 'Paste a destination, pick a slug: your link is ready to share.',
        fig: 'Fig. 4.1 — Creating a link',
      },
      {
        tab: 'Share',
        title: 'A QR ready for print.',
        body: 'Colors, size, margin: export as PNG, SVG or PDF, direct or managed.',
        fig: 'Fig. 4.2 — Exporting a QR',
      },
      {
        tab: 'Secure',
        title: 'Protected, dated or paused.',
        body: 'Add a password, an expiry date, or switch the link off whenever you like.',
        fig: 'Fig. 4.3 — Link rules',
      },
      {
        tab: 'Track',
        title: 'Every click and scan counts.',
        body: 'Day by day, by device, browser and source, over 7, 30 or 90 days.',
        fig: 'Fig. 4.4 — Analytics. Sample data.',
      },
    ],
    create: {
      destination: 'Destination URL',
      slug: 'Slug',
      customSlug: 'Custom slug',
      submit: 'Create link',
    },
    share: {
      direct: 'Direct QR',
      managed: 'Managed QR',
      ink: 'Ink',
      background: 'Background',
      size: 'Size',
      export: 'Export',
    },
    secure: {
      password: 'Password',
      expiry: 'Expiry date',
      expiryValue: 'Dec 31, 2026',
      active: 'Link active',
      note: 'Once expired, the link answers “expired” instead of redirecting.',
    },
    track: {
      clicks: 'Clicks',
      scans: 'Scans',
      devices: 'Devices',
      sources: 'Sources',
      direct: 'Direct',
      mobile: 'Mobile',
      desktop: 'Desktop',
      tablet: 'Tablet',
    },
  },
  tryIt: {
    eyebrow: '05 — Try it here',
    title: 'Your QR, no account.',
    body: 'Paste a URL: the QR is generated in your browser and downloads as SVG.',
    label: 'Your address',
    placeholder: 'https://your-site.com/menu',
    generate: 'Generate',
    download: 'Download SVG',
    copy: 'Copy address',
    ink: 'Ink',
    inks: ['Ink', 'Blue', 'Night'],
    note: 'This QR holds the address itself: it can’t be edited and doesn’t count scans. For that, you need a managed QR.',
    ready: 'QR ready. Scan it or download it.',
    copied: 'Address copied.',
    copyFailed: 'Copy isn’t available in this browser.',
    downloaded: 'QR downloaded as SVG.',
    invalid: 'Enter a valid http:// or https:// address, without credentials (512 characters max).',
    encoded: 'Encoded address',
    qrAlt: 'QR code for the address',
  },
  identity: {
    eyebrow: '06 — One profile, three formats',
    title: 'Your identity, on paper and screen.',
    body: 'Start from your profile: a business card in 5 templates, a digital card with vCard, a signature for Gmail, Outlook or Apple Mail.',
    note: 'Each format gets a copy of your profile that you edit separately.',
    name: 'Your name',
    role: 'Your role',
    company: 'Your company',
    email: 'you@company.com',
    phone: '+1 555 000 0000',
    website: 'company.com',
    cards: [
      {
        kicker: 'Business card',
        title: 'Ready for print.',
        detail: '5 templates · front and back · 300 dpi PNG or PDF from print',
      },
      {
        kicker: 'Digital card',
        title: 'A page to share.',
        detail: 'Published on its own link · .vcf contact · native share or QR',
      },
      {
        kicker: 'Email signature',
        title: 'In every message.',
        detail: '3 layouts · rich or HTML copy · Gmail, Outlook, Apple Mail guides',
      },
    ],
    saveContact: 'Save contact',
    share: 'Share',
    copySignature: 'Copy signature',
    mailTo: 'To: client@example.com',
    mailSubject: 'Subject: Our proposal',
    mailBody: 'Hello, please find the proposal attached. Have a good day,',
    clients: 'Gmail · Outlook · Apple Mail',
  },
  signal: {
    eyebrow: '07 — What comes back',
    title: 'See who scans, and from where.',
    body: 'Clicks and scans by day, device, browser and source, over 7, 30 or 90 days.',
    note: 'Sample data. Card and signature views aren’t counted.',
    periods: ['7 d', '30 d', '90 d'],
    periodLabel: 'Period',
    clicks: 'Clicks',
    scans: 'Scans',
    devices: 'Devices',
    browsers: 'Browsers',
    sources: 'Sources',
    direct: 'Direct',
    chartLabel: 'Clicks and scans per day, sample data',
  },
  payoff: {
    eyebrow: '08 — All in one place',
    title: 'One workspace, every format.',
    body: 'Free to start: 10 short links and 5 QR codes. Move to Pro when you need more.',
    pause: 'Pause scrolling logos',
    play: 'Resume scrolling logos',
    tiles: [
      { title: 'Short links', body: 'Custom slug, editable destination, password, expiry.' },
      { title: 'QR codes', body: 'Direct or managed. Colors and size. PNG, SVG or PDF.' },
      { title: 'Analytics', body: 'Clicks and scans by day, device, browser and source.' },
      { title: 'Business cards', body: '5 templates, front and back, 300 dpi PNG.' },
      { title: 'Digital cards', body: 'A published page and a .vcf contact.' },
      { title: 'Signatures', body: '3 layouts, rich or HTML copy.' },
      { title: 'Passwords', body: 'Generated in your browser. Nothing is sent.' },
      { title: 'Your workspace', body: '3 navigation modes, 5 accents, light or dark.' },
    ],
  },
  action: {
    eyebrow: '09 — Your turn',
    title: 'Create your first link.',
    body: 'A free account is all you need to publish, edit and track.',
    footerTagline: 'Create. Share. Secure. Track.',
    rights: '© 2026 WRX',
  },
};

export const homeCopy: Record<HomeLang, HomeCopy> = { fr, en };

export const homePaths: Record<HomeLang, string> = { fr: '/', en: '/en/' };

/** Sample addresses used by the illustrative interface pieces. */
export const demo = {
  link: 'wrx.example/r/menu',
  linkUrl: 'https://wrx.example/r/menu',
  managedQr: 'https://wrx.example/r/scan/menu',
  before: 'restaurant.example/menu-printemps',
  after: 'restaurant.example/menu-ete',
  beforeEn: 'restaurant.example/spring-menu',
  afterEn: 'restaurant.example/summer-menu',
  slug: 'menu',
} as const;
