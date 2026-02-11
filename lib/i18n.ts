export type Locale = "en" | "tr" | "ru" | "zh" | "de"

export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Turkce",
  ru: "Russkiy",
  zh: "Zhongwen",
  de: "Deutsch",
}

export const localeFlags: Record<Locale, string> = {
  en: "GB",
  tr: "TR",
  ru: "RU",
  zh: "CN",
  de: "DE",
}

type TranslationKeys = {
  nav: {
    home: string
    builder: string
    pricing: string
    docs: string
    admin: string
    login: string
    logout: string
    dashboard: string
    settings: string
    profile: string
    language: string
  }
  hero: {
    title: string
    subtitle: string
    cta: string
    secondary: string
    description: string
  }
  features: {
    title: string
    subtitle: string
    ai: string
    aiDesc: string
    fast: string
    fastDesc: string
    deploy: string
    deployDesc: string
    responsive: string
    responsiveDesc: string
    secure: string
    secureDesc: string
    collab: string
    collabDesc: string
  }
  pricing: {
    title: string
    subtitle: string
    free: string
    plus: string
    pro: string
    month: string
    popular: string
    current: string
    upgrade: string
    getStarted: string
    features: {
      projects: string
      generations: string
      support: string
      deploy: string
      customDomain: string
      priorityQueue: string
      api: string
      teamCollab: string
      analytics: string
      whiteLabel: string
    }
  }
  builder: {
    placeholder: string
    send: string
    preview: string
    code: string
    files: string
    deploy: string
    thinking: string
    generating: string
    selectAi: string
    fast: string
    planning: string
    fastDesc: string
    planningDesc: string
    steps: string
    analyzing: string
    building: string
    complete: string
  }
  auth: {
    login: string
    register: string
    email: string
    password: string
    confirmPassword: string
    googleLogin: string
    noAccount: string
    hasAccount: string
    welcomeBack: string
    createAccount: string
    forgotPassword: string
  }
  admin: {
    title: string
    users: string
    totalUsers: string
    revenue: string
    projects: string
    analytics: string
    settings: string
    lemonSqueezy: string
    lemonApiKey: string
    lemonWebhook: string
    save: string
    userManagement: string
    search: string
    role: string
    plan: string
    joined: string
    actions: string
  }
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    back: string
    next: string
    previous: string
    search: string
    noResults: string
  }
}

const translations: Record<Locale, TranslationKeys> = {
  en: {
    nav: {
      home: "Home",
      builder: "Builder",
      pricing: "Pricing",
      docs: "Docs",
      admin: "Admin",
      login: "Sign In",
      logout: "Sign Out",
      dashboard: "Dashboard",
      settings: "Settings",
      profile: "Profile",
      language: "Language",
    },
    hero: {
      title: "Build Websites with AI",
      subtitle: "From Prompt to Production",
      cta: "Start Building Free",
      secondary: "View Pricing",
      description:
        "Describe your website in plain text and watch it come to life. Prompt2Web uses advanced AI to generate, preview, and deploy production-ready websites in seconds.",
    },
    features: {
      title: "Everything You Need",
      subtitle: "Powerful features to build any website",
      ai: "AI-Powered Generation",
      aiDesc: "Describe your website and let AI handle the rest. Multiple AI models at your fingertips.",
      fast: "Lightning Fast",
      fastDesc: "Generate complete websites in seconds, not hours. Real-time preview as you build.",
      deploy: "One-Click Deploy",
      deployDesc: "Deploy your website to production with a single click. Custom domains supported.",
      responsive: "Fully Responsive",
      responsiveDesc: "Every generated website is mobile-first and looks great on all devices.",
      secure: "Enterprise Security",
      secureDesc: "Built with security best practices. Your code and data are always protected.",
      collab: "Team Collaboration",
      collabDesc: "Work together in real-time. Share projects and manage team permissions.",
    },
    pricing: {
      title: "Simple, Transparent Pricing",
      subtitle: "Choose the plan that fits your needs",
      free: "Free",
      plus: "Plus",
      pro: "Pro",
      month: "/month",
      popular: "Most Popular",
      current: "Current Plan",
      upgrade: "Upgrade",
      getStarted: "Get Started",
      features: {
        projects: "projects",
        generations: "generations/month",
        support: "support",
        deploy: "deployments",
        customDomain: "Custom domain",
        priorityQueue: "Priority queue",
        api: "API access",
        teamCollab: "Team collaboration",
        analytics: "Advanced analytics",
        whiteLabel: "White-label",
      },
    },
    builder: {
      placeholder: "Describe the website you want to build...",
      send: "Send",
      preview: "Preview",
      code: "Code",
      files: "Files",
      deploy: "Deploy",
      thinking: "Thinking...",
      generating: "Generating...",
      selectAi: "Select AI Model",
      fast: "Fast",
      planning: "Planning",
      fastDesc: "Quick generation, instant results",
      planningDesc: "Analyzed approach, step by step",
      steps: "Steps",
      analyzing: "Analyzing your request...",
      building: "Building components...",
      complete: "Complete!",
    },
    auth: {
      login: "Sign In",
      register: "Sign Up",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      googleLogin: "Continue with Google",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      welcomeBack: "Welcome back",
      createAccount: "Create your account",
      forgotPassword: "Forgot password?",
    },
    admin: {
      title: "Admin Dashboard",
      users: "Users",
      totalUsers: "Total Users",
      revenue: "Revenue",
      projects: "Projects",
      analytics: "Analytics",
      settings: "Settings",
      lemonSqueezy: "Lemon Squeezy Integration",
      lemonApiKey: "API Key",
      lemonWebhook: "Webhook URL",
      save: "Save Settings",
      userManagement: "User Management",
      search: "Search users...",
      role: "Role",
      plan: "Plan",
      joined: "Joined",
      actions: "Actions",
    },
    common: {
      loading: "Loading...",
      error: "Something went wrong",
      success: "Success!",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      noResults: "No results found",
    },
  },
  tr: {
    nav: {
      home: "Ana Sayfa",
      builder: "Olusturucu",
      pricing: "Fiyatlandirma",
      docs: "Dokumantasyon",
      admin: "Yonetim",
      login: "Giris Yap",
      logout: "Cikis Yap",
      dashboard: "Panel",
      settings: "Ayarlar",
      profile: "Profil",
      language: "Dil",
    },
    hero: {
      title: "AI ile Web Siteleri Olusturun",
      subtitle: "Prompttan Uretime",
      cta: "Ucretsiz Baslayin",
      secondary: "Fiyatlari Gorun",
      description:
        "Web sitenizi duz metin olarak tanimlayin ve canlanmasini izleyin. Prompt2Web, saniyeler icinde uretim icin hazir web siteleri olusturmak, onizlemek ve dagitmak icin gelismis AI kullanir.",
    },
    features: {
      title: "Ihtiyaciniz Olan Her Sey",
      subtitle: "Herhangi bir web sitesi olusturmak icin guclu ozellikler",
      ai: "AI Destekli Olusturma",
      aiDesc: "Web sitenizi tanimlayin ve gerisini AI'a birakin. Birden fazla AI modeli parmaklarinizin ucunda.",
      fast: "Isik Hizinda",
      fastDesc: "Saniyeler icinde tam web siteleri olusturun. Olustururken gercek zamanli onizleme.",
      deploy: "Tek Tikla Dagitim",
      deployDesc: "Web sitenizi tek tikla uretim ortamina dagitin. Ozel alan adi destegi.",
      responsive: "Tam Duyarli",
      responsiveDesc: "Olusturulan her web sitesi mobil oncelikli ve tum cihazlarda harika gorunur.",
      secure: "Kurumsal Guvenlik",
      secureDesc: "En iyi guvenlik uygulamalariyla olusturulmustur. Kodunuz ve verileriniz her zaman korunur.",
      collab: "Takim Is Birligi",
      collabDesc: "Gercek zamanli birlikte calisin. Projeleri paylasin ve takim izinlerini yonetin.",
    },
    pricing: {
      title: "Basit, Seffaf Fiyatlandirma",
      subtitle: "Ihtiyaclariniza uygun plani secin",
      free: "Ucretsiz",
      plus: "Plus",
      pro: "Pro",
      month: "/ay",
      popular: "En Populer",
      current: "Mevcut Plan",
      upgrade: "Yukselt",
      getStarted: "Baslayalim",
      features: {
        projects: "proje",
        generations: "uretim/ay",
        support: "destek",
        deploy: "dagitim",
        customDomain: "Ozel alan adi",
        priorityQueue: "Oncelikli kuyruk",
        api: "API erisimi",
        teamCollab: "Takim is birligi",
        analytics: "Gelismis analitik",
        whiteLabel: "Beyaz etiket",
      },
    },
    builder: {
      placeholder: "Olusturmak istediginiz web sitesini tanimlayin...",
      send: "Gonder",
      preview: "Onizleme",
      code: "Kod",
      files: "Dosyalar",
      deploy: "Dagit",
      thinking: "Dusunuyor...",
      generating: "Olusturuluyor...",
      selectAi: "AI Modeli Secin",
      fast: "Hizli",
      planning: "Planli",
      fastDesc: "Hizli olusturma, aninda sonuc",
      planningDesc: "Analiz edilmis yaklasim, adim adim",
      steps: "Adimlar",
      analyzing: "Isteginiz analiz ediliyor...",
      building: "Bilesenler olusturuluyor...",
      complete: "Tamamlandi!",
    },
    auth: {
      login: "Giris Yap",
      register: "Kayit Ol",
      email: "E-posta",
      password: "Sifre",
      confirmPassword: "Sifre Onayi",
      googleLogin: "Google ile Devam Et",
      noAccount: "Hesabiniz yok mu?",
      hasAccount: "Zaten hesabiniz var mi?",
      welcomeBack: "Tekrar hosgeldiniz",
      createAccount: "Hesabinizi olusturun",
      forgotPassword: "Sifremi unuttum?",
    },
    admin: {
      title: "Yonetim Paneli",
      users: "Kullanicilar",
      totalUsers: "Toplam Kullanici",
      revenue: "Gelir",
      projects: "Projeler",
      analytics: "Analitik",
      settings: "Ayarlar",
      lemonSqueezy: "Lemon Squeezy Entegrasyonu",
      lemonApiKey: "API Anahtari",
      lemonWebhook: "Webhook URL",
      save: "Ayarlari Kaydet",
      userManagement: "Kullanici Yonetimi",
      search: "Kullanici ara...",
      role: "Rol",
      plan: "Plan",
      joined: "Katilim",
      actions: "Islemler",
    },
    common: {
      loading: "Yukleniyor...",
      error: "Bir hata olustu",
      success: "Basarili!",
      cancel: "Iptal",
      save: "Kaydet",
      delete: "Sil",
      edit: "Duzenle",
      back: "Geri",
      next: "Ileri",
      previous: "Onceki",
      search: "Ara",
      noResults: "Sonuc bulunamadi",
    },
  },
  ru: {
    nav: {
      home: "Glavnaya",
      builder: "Konstruktor",
      pricing: "Tseny",
      docs: "Dokumentatsiya",
      admin: "Admin",
      login: "Voyti",
      logout: "Vyyti",
      dashboard: "Panel",
      settings: "Nastroyki",
      profile: "Profil",
      language: "Yazyk",
    },
    hero: {
      title: "Sozdavayte sayty s II",
      subtitle: "Ot prompta do produktsii",
      cta: "Nachat besplatno",
      secondary: "Smotret tseny",
      description:
        "Opishite svoy sayt prostym tekstom i nablyudayte kak on ozhivaet. Prompt2Web ispolzuyet prodvinutyy II dlya sozdaniya, prosmotra i razvertyvaniya gotovykh saytov za sekundy.",
    },
    features: {
      title: "Vse chto vam nuzhno",
      subtitle: "Moshchnyye funktsii dlya sozdaniya lyubogo sayta",
      ai: "Generatsiya na baze II",
      aiDesc: "Opishite sayt i pozvolte II sdelat ostalnoe. Neskolko modeley II v vashem rasporyazhenii.",
      fast: "Molniyenosno bystro",
      fastDesc: "Sozdavayte polnyye sayty za sekundy. Prosmotr v realnom vremeni.",
      deploy: "Razvertyvaniye v odin klik",
      deployDesc: "Razvertyvayte sayt v prodakshen odnim klikom. Podderzhka polzovatelskikh domenov.",
      responsive: "Polnostyu adaptivnyy",
      responsiveDesc: "Kazhdyy sayt adaptivan i otlichno vyglyadit na vsekh ustroystvakh.",
      secure: "Korporativnaya bezopasnost",
      secureDesc: "Postroyeno s luchshimi praktikami bezopasnosti. Vash kod i dannyye vsegda zashchishcheny.",
      collab: "Komandnaya rabota",
      collabDesc: "Rabotayte vmeste v realnom vremeni. Delis proyektami i upravlyayte pravami komandy.",
    },
    pricing: {
      title: "Prostoye i prozrachnoye tsenoobrazovaniye",
      subtitle: "Vyberite plan kotoryy vam podkhodit",
      free: "Besplatnyy",
      plus: "Plyus",
      pro: "Pro",
      month: "/mesyats",
      popular: "Samyy populyarnyy",
      current: "Tekushchiy plan",
      upgrade: "Obnovit",
      getStarted: "Nachat",
      features: {
        projects: "proyektov",
        generations: "generatsiy/mesyats",
        support: "podderzhka",
        deploy: "razvertyvaniy",
        customDomain: "Polzovatelskiy domen",
        priorityQueue: "Prioritetnaya ochered",
        api: "Dostup k API",
        teamCollab: "Komandnaya rabota",
        analytics: "Prodvinutaya analitika",
        whiteLabel: "Belyy leybel",
      },
    },
    builder: {
      placeholder: "Opishite sayt kotoryy khotite sozdat...",
      send: "Otpravit",
      preview: "Prosmotr",
      code: "Kod",
      files: "Fayly",
      deploy: "Razvernut",
      thinking: "Dumayu...",
      generating: "Generatsiya...",
      selectAi: "Vybrat model II",
      fast: "Bystryy",
      planning: "Planirovaniye",
      fastDesc: "Bystraya generatsiya mgnovennyy rezultat",
      planningDesc: "Analizirovannyy podkhod shag za shagom",
      steps: "Shagi",
      analyzing: "Analiz vashego zaprosa...",
      building: "Sozdaniye komponentov...",
      complete: "Gotovo!",
    },
    auth: {
      login: "Voyti",
      register: "Registratsiya",
      email: "Email",
      password: "Parol",
      confirmPassword: "Podtverdite parol",
      googleLogin: "Voyti cherez Google",
      noAccount: "Net akkaunta?",
      hasAccount: "Uzhe yest akkount?",
      welcomeBack: "S vozvrashcheniyem",
      createAccount: "Sozdayte akkount",
      forgotPassword: "Zabyli parol?",
    },
    admin: {
      title: "Panel administratora",
      users: "Polzovateli",
      totalUsers: "Vsego polzovateley",
      revenue: "Dokhod",
      projects: "Proyekty",
      analytics: "Analitika",
      settings: "Nastroyki",
      lemonSqueezy: "Integratsiya Lemon Squeezy",
      lemonApiKey: "Klyuch API",
      lemonWebhook: "Webhook URL",
      save: "Sokhranit nastroyki",
      userManagement: "Upravleniye polzovatelyami",
      search: "Poisk polzovateley...",
      role: "Rol",
      plan: "Plan",
      joined: "Prisoyedinilsya",
      actions: "Deystviya",
    },
    common: {
      loading: "Zagruzka...",
      error: "Chto-to poshlo ne tak",
      success: "Uspeshno!",
      cancel: "Otmena",
      save: "Sokhranit",
      delete: "Udalit",
      edit: "Redaktirovat",
      back: "Nazad",
      next: "Dalee",
      previous: "Predydushchiy",
      search: "Poisk",
      noResults: "Nichego ne naydeno",
    },
  },
  zh: {
    nav: {
      home: "Shouye",
      builder: "Gouzaoqi",
      pricing: "Jiage",
      docs: "Wendang",
      admin: "Guanli",
      login: "Denglu",
      logout: "Tuichu",
      dashboard: "Yibiaopan",
      settings: "Shezhi",
      profile: "Geren ziliao",
      language: "Yuyan",
    },
    hero: {
      title: "Yong AI Goujian Wangzhan",
      subtitle: "Cong Tishi Dao Shengchan",
      cta: "Mianfei Kaishi",
      secondary: "Chakan Jiage",
      description: "Yong chunwenben miaoshu nin de wangzhan bing guankan ta bianwei xianshi. Prompt2Web shiyong xianjin de AI zai ji miao nei shengcheng yulan he bushu shengchan jiuxu de wangzhan.",
    },
    features: {
      title: "Nin suoxu de yiqie",
      subtitle: "Goujian renhe wangzhan de qiangda gongneng",
      ai: "AI Qudong Shengcheng",
      aiDesc: "Miaoshu nin de wangzhan rang AI chuli qiyu. Duozhong AI moxing gongning xuanze.",
      fast: "Jikuai Sudu",
      fastDesc: "Zai ji miao nei shengcheng wanzheng wangzhan. Goujian shi shishi yulan.",
      deploy: "Yijian Bushu",
      deployDesc: "Yijian jiang wangzhan bushu dao shengchan huanjing. Zhichi zidingyi yuming.",
      responsive: "Wanquan Xiangying",
      responsiveDesc: "Mei ge shengcheng de wangzhan dou shi yidong youxian de zai suoyou shebei shang dou henhaogan.",
      secure: "Qiye Ji Anquan",
      secureDesc: "Caiyong zuijia anquan shijian goujian. Nin de daima he shuju shijong shou baohu.",
      collab: "Tuandui Xiezuo",
      collabDesc: "Shishi xiezuo gongxiang xiangmu guanli tuandui quanxian.",
    },
    pricing: {
      title: "Jiandan Touming de Jiage",
      subtitle: "Xuanze shihe nin de jihua",
      free: "Mianfei",
      plus: "Gaoji",
      pro: "Zhuanye",
      month: "/yue",
      popular: "Zui Shouhuanying",
      current: "Dangqian Jihua",
      upgrade: "Shengji",
      getStarted: "Kaishi",
      features: {
        projects: "ge xiangmu",
        generations: "ci shengcheng/yue",
        support: "zhichi",
        deploy: "ci bushu",
        customDomain: "Zidingyi yuming",
        priorityQueue: "Youxian duilie",
        api: "API fangwen",
        teamCollab: "Tuandui xiezuo",
        analytics: "Gaoji fenxi",
        whiteLabel: "Baipai",
      },
    },
    builder: {
      placeholder: "Miaoshu nin xiang goujian de wangzhan...",
      send: "Fasong",
      preview: "Yulan",
      code: "Daima",
      files: "Wenjian",
      deploy: "Bushu",
      thinking: "Sikao zhong...",
      generating: "Shengcheng zhong...",
      selectAi: "Xuanze AI Moxing",
      fast: "Kuaisu",
      planning: "Guihua",
      fastDesc: "Kuaisu shengcheng jishi jieguo",
      planningDesc: "Fenxi fangfa zhubuzouguo",
      steps: "Buzhou",
      analyzing: "Fenxi nin de qingqiu...",
      building: "Goujian zujian...",
      complete: "Wancheng!",
    },
    auth: {
      login: "Denglu",
      register: "Zhuce",
      email: "Youxiang",
      password: "Mima",
      confirmPassword: "Queren mima",
      googleLogin: "Shiyong Google Denglu",
      noAccount: "Meiyou zhanghu?",
      hasAccount: "Yijing you zhanghu?",
      welcomeBack: "Huanying huili",
      createAccount: "Chuangjian zhanghu",
      forgotPassword: "Wangji mima?",
    },
    admin: {
      title: "Guanli Yibiaopan",
      users: "Yonghu",
      totalUsers: "Zong yonghu",
      revenue: "Shouru",
      projects: "Xiangmu",
      analytics: "Fenxi",
      settings: "Shezhi",
      lemonSqueezy: "Lemon Squeezy Jicheng",
      lemonApiKey: "API Miyao",
      lemonWebhook: "Webhook URL",
      save: "Baocun Shezhi",
      userManagement: "Yonghu Guanli",
      search: "Sousuo yonghu...",
      role: "Juese",
      plan: "Jihua",
      joined: "Jiaru",
      actions: "Caozuo",
    },
    common: {
      loading: "Jiazai zhong...",
      error: "Chuxian cuowu",
      success: "Chenggong!",
      cancel: "Quxiao",
      save: "Baocun",
      delete: "Shanchu",
      edit: "Bianji",
      back: "Fanhui",
      next: "Xiayige",
      previous: "Shangyige",
      search: "Sousuo",
      noResults: "Wei zhaodao jieguo",
    },
  },
  de: {
    nav: {
      home: "Startseite",
      builder: "Builder",
      pricing: "Preise",
      docs: "Dokumentation",
      admin: "Admin",
      login: "Anmelden",
      logout: "Abmelden",
      dashboard: "Dashboard",
      settings: "Einstellungen",
      profile: "Profil",
      language: "Sprache",
    },
    hero: {
      title: "Websites mit KI erstellen",
      subtitle: "Vom Prompt zur Produktion",
      cta: "Kostenlos starten",
      secondary: "Preise ansehen",
      description:
        "Beschreiben Sie Ihre Website in einfachem Text und sehen Sie wie sie zum Leben erwacht. Prompt2Web verwendet fortschrittliche KI um produktionsreife Websites in Sekunden zu erstellen.",
    },
    features: {
      title: "Alles was Sie brauchen",
      subtitle: "Leistungsstarke Funktionen fur jede Website",
      ai: "KI-gestutzte Generierung",
      aiDesc: "Beschreiben Sie Ihre Website und lassen Sie KI den Rest erledigen. Mehrere KI-Modelle zur Verfugung.",
      fast: "Blitzschnell",
      fastDesc: "Erstellen Sie komplette Websites in Sekunden. Echtzeit-Vorschau beim Erstellen.",
      deploy: "Ein-Klick-Bereitstellung",
      deployDesc: "Stellen Sie Ihre Website mit einem Klick bereit. Benutzerdefinierte Domains unterstutzt.",
      responsive: "Vollstandig responsiv",
      responsiveDesc: "Jede generierte Website ist Mobile-First und sieht auf allen Geraten grossartig aus.",
      secure: "Unternehmenssicherheit",
      secureDesc: "Mit bewehrten Sicherheitspraktiken erstellt. Ihr Code und Ihre Daten sind immer geschutzt.",
      collab: "Teamzusammenarbeit",
      collabDesc: "Arbeiten Sie in Echtzeit zusammen. Teilen Sie Projekte und verwalten Sie Teamberechtigungen.",
    },
    pricing: {
      title: "Einfache transparente Preise",
      subtitle: "Wahlen Sie den Plan der zu Ihnen passt",
      free: "Kostenlos",
      plus: "Plus",
      pro: "Pro",
      month: "/Monat",
      popular: "Am beliebtesten",
      current: "Aktueller Plan",
      upgrade: "Upgrade",
      getStarted: "Loslegen",
      features: {
        projects: "Projekte",
        generations: "Generierungen/Monat",
        support: "Support",
        deploy: "Bereitstellungen",
        customDomain: "Benutzerdefinierte Domain",
        priorityQueue: "Prioritatswarteschlange",
        api: "API-Zugang",
        teamCollab: "Teamzusammenarbeit",
        analytics: "Erweiterte Analytik",
        whiteLabel: "White-Label",
      },
    },
    builder: {
      placeholder: "Beschreiben Sie die Website die Sie erstellen mochten...",
      send: "Senden",
      preview: "Vorschau",
      code: "Code",
      files: "Dateien",
      deploy: "Bereitstellen",
      thinking: "Denke nach...",
      generating: "Generiere...",
      selectAi: "KI-Modell wahlen",
      fast: "Schnell",
      planning: "Planung",
      fastDesc: "Schnelle Generierung sofortige Ergebnisse",
      planningDesc: "Analysierter Ansatz Schritt fur Schritt",
      steps: "Schritte",
      analyzing: "Analysiere Ihre Anfrage...",
      building: "Erstelle Komponenten...",
      complete: "Fertig!",
    },
    auth: {
      login: "Anmelden",
      register: "Registrieren",
      email: "E-Mail",
      password: "Passwort",
      confirmPassword: "Passwort bestatigen",
      googleLogin: "Mit Google fortfahren",
      noAccount: "Kein Konto?",
      hasAccount: "Bereits ein Konto?",
      welcomeBack: "Willkommen zuruck",
      createAccount: "Konto erstellen",
      forgotPassword: "Passwort vergessen?",
    },
    admin: {
      title: "Admin-Dashboard",
      users: "Benutzer",
      totalUsers: "Gesamt Benutzer",
      revenue: "Umsatz",
      projects: "Projekte",
      analytics: "Analytik",
      settings: "Einstellungen",
      lemonSqueezy: "Lemon Squeezy Integration",
      lemonApiKey: "API-Schlussel",
      lemonWebhook: "Webhook-URL",
      save: "Einstellungen speichern",
      userManagement: "Benutzerverwaltung",
      search: "Benutzer suchen...",
      role: "Rolle",
      plan: "Plan",
      joined: "Beigetreten",
      actions: "Aktionen",
    },
    common: {
      loading: "Laden...",
      error: "Etwas ist schiefgelaufen",
      success: "Erfolgreich!",
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "Loschen",
      edit: "Bearbeiten",
      back: "Zuruck",
      next: "Weiter",
      previous: "Vorherige",
      search: "Suche",
      noResults: "Keine Ergebnisse gefunden",
    },
  },
}

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] || translations.en
}

export const defaultLocale: Locale = "en"
