export type Lang = 'en' | 'uk' | 'ru'

export const languages: { code: Lang; label: string; shortLabel: string }[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'uk', label: 'Українська', shortLabel: 'UA' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU' },
]

export const defaultLang: Lang = 'ru'

export function normalizeLang(value?: string | null): Lang {
  if (value === 'ua') return 'uk'
  if (value === 'en' || value === 'uk' || value === 'ru') return value
  return defaultLang
}

export function isSupportedLang(value?: string | null): value is Lang {
  return value === 'en' || value === 'uk' || value === 'ru'
}

export function detectLangFromCountry(country?: string | null): Lang | null {
  const code = country?.trim().toUpperCase()
  if (code === 'UA') return 'uk'
  if (code === 'RU') return 'ru'
  return null
}

export function detectLangFromAcceptLanguage(value?: string | null): Lang | null {
  if (!value) return null

  const preferences = value
    .split(',')
    .map(item => item.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean)

  for (const preference of preferences) {
    if (preference === 'uk' || preference.startsWith('uk-') || preference === 'ua') return 'uk'
    if (preference === 'ru' || preference.startsWith('ru-')) return 'ru'
    if (preference === 'en' || preference.startsWith('en-')) return 'en'
  }

  return null
}

export const dict = {
  ru: {
    nav: {
      dashboard: 'Кабинет',
      login: 'Войти',
      register: 'Создать профиль',
      logout: 'Выйти',
      theme: 'Переключить тему',
      searchPlaceholder: 'Поиск по специалистам',
      search: 'Искать',
      language: 'Язык',
    },
    home: {
      aboutTitle: 'JobProfile хранит вашу профессиональную страницу в одном месте',
      aboutText: 'Это простой сервис для личного профиля специалиста: резюме, портфолио, сертификаты, контакты и базовая информация доступны по одной публичной ссылке.',
      howTitle: 'Как это работает',
      howText: 'Вы создаете профиль, добавляете резюме, проекты и сертификаты, а затем обновляете страницу, когда нужно. Другой человек открывает ссылку, видит актуальную информацию и скачивает резюме.',
      usefulTitle: 'Чем полезен сервис',
      usefulText: 'Профиль не теряется в файлах и переписках, его легко дополнять после новых проектов, обучения или смены специализации. Поиск сверху помогает находить специалистов по имени, профессии, навыкам и описанию профиля.',
      resumeFeature: 'Резюме для скачивания',
      portfolioFeature: 'Портфолио для просмотра онлайн',
      certificatesFeature: 'Сертификаты и подтверждения обучения',
      results: 'Результаты поиска',
      create: 'Создать свой профиль',
      empty: 'Пока ничего не найдено. Попробуйте другой навык, имя или профессию.',
      projects: 'проектов',
      certificates: 'сертификатов',
      resume: 'резюме',
    },
    public: {
      back: 'Поиск специалистов',
      resume: 'Скачать резюме',
      viewPortfolio: 'Посмотреть портфолио',
      contact: 'Написать',
      info: 'Информация',
      portfolio: 'Портфолио',
      openProject: 'Открыть проект',
      openPdf: 'Открыть PDF',
      certificates: 'Сертификаты',
      verify: 'Проверить',
      openFile: 'Открыть файл',
      contacts: 'Контакты',
      website: 'Сайт / профиль',
    },
    auth: {
      loginTitle: 'Вход в аккаунт',
      registerTitle: 'Создать аккаунт',
      loginSubtitle: 'Введите email и пароль',
      registerSubtitle: 'Заполните данные для регистрации',
      password: 'Пароль',
      passwordPlaceholder: 'Минимум 8 символов',
      confirmPassword: 'Подтвердите пароль',
      confirmPlaceholder: 'Повторите пароль',
      loading: 'Загрузка...',
      login: 'Войти',
      register: 'Зарегистрироваться',
      noAccount: 'Нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
    },
    legal: {
      privacyTitle: 'Политика конфиденциальности',
      termsTitle: 'Правила пользования',
      updated: 'Последнее обновление',
      backHome: '← На главную',
    },
  },
  uk: {
    nav: {
      dashboard: 'Кабінет',
      login: 'Увійти',
      register: 'Створити профіль',
      logout: 'Вийти',
      theme: 'Перемкнути тему',
      searchPlaceholder: 'Пошук фахівців',
      search: 'Шукати',
      language: 'Мова',
    },
    home: {
      aboutTitle: 'JobProfile зберігає вашу професійну сторінку в одному місці',
      aboutText: 'Це простий сервіс для особистого профілю фахівця: резюме, портфоліо, сертифікати, контакти й базова інформація доступні за одним публічним посиланням.',
      howTitle: 'Як це працює',
      howText: 'Ви створюєте профіль, додаєте резюме, проєкти й сертифікати, а потім оновлюєте сторінку, коли потрібно. Інша людина відкриває посилання, бачить актуальну інформацію та завантажує резюме.',
      usefulTitle: 'Чим корисний сервіс',
      usefulText: 'Профіль не губиться у файлах і листуванні, його легко доповнювати після нових проєктів, навчання або зміни спеціалізації. Пошук зверху допомагає знаходити фахівців за іменем, професією, навичками й описом профілю.',
      resumeFeature: 'Резюме для завантаження',
      portfolioFeature: 'Портфоліо для перегляду онлайн',
      certificatesFeature: 'Сертифікати та підтвердження навчання',
      results: 'Результати пошуку',
      create: 'Створити свій профіль',
      empty: 'Поки нічого не знайдено. Спробуйте іншу навичку, ім’я або професію.',
      projects: 'проєктів',
      certificates: 'сертифікатів',
      resume: 'резюме',
    },
    public: {
      back: 'Пошук фахівців',
      resume: 'Завантажити резюме',
      viewPortfolio: 'Переглянути портфоліо',
      contact: 'Написати',
      info: 'Інформація',
      portfolio: 'Портфоліо',
      openProject: 'Відкрити проєкт',
      openPdf: 'Відкрити PDF',
      certificates: 'Сертифікати',
      verify: 'Перевірити',
      openFile: 'Відкрити файл',
      contacts: 'Контакти',
      website: 'Сайт / профіль',
    },
    auth: {
      loginTitle: 'Вхід в акаунт',
      registerTitle: 'Створити акаунт',
      loginSubtitle: 'Введіть email і пароль',
      registerSubtitle: 'Заповніть дані для реєстрації',
      password: 'Пароль',
      passwordPlaceholder: 'Мінімум 8 символів',
      confirmPassword: 'Підтвердьте пароль',
      confirmPlaceholder: 'Повторіть пароль',
      loading: 'Завантаження...',
      login: 'Увійти',
      register: 'Зареєструватися',
      noAccount: 'Немає акаунта?',
      hasAccount: 'Вже є акаунт?',
    },
    legal: {
      privacyTitle: 'Політика конфіденційності',
      termsTitle: 'Правила користування',
      updated: 'Останнє оновлення',
      backHome: '← На головну',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      login: 'Sign in',
      register: 'Create profile',
      logout: 'Log out',
      theme: 'Toggle theme',
      searchPlaceholder: 'Search specialists',
      search: 'Search',
      language: 'Language',
    },
    home: {
      aboutTitle: 'JobProfile keeps your professional page in one place',
      aboutText: 'A simple service for a specialist profile: resume, portfolio, certificates, contacts, and basic information are available through one public link.',
      howTitle: 'How it works',
      howText: 'Create a profile, add your resume, projects, and certificates, then update the page whenever needed. Visitors open the link, see current information, and download your resume.',
      usefulTitle: 'Why it helps',
      usefulText: 'Your profile does not get lost in files or messages, and it is easy to update after new projects, training, or a changed specialization. The top search helps find specialists by name, profession, skills, and profile details.',
      resumeFeature: 'Downloadable resume',
      portfolioFeature: 'Online portfolio viewing',
      certificatesFeature: 'Certificates and training proof',
      results: 'Search results',
      create: 'Create your profile',
      empty: 'Nothing found yet. Try another skill, name, or profession.',
      projects: 'projects',
      certificates: 'certificates',
      resume: 'resume',
    },
    public: {
      back: 'Specialist search',
      resume: 'Download resume',
      viewPortfolio: 'View portfolio',
      contact: 'Contact',
      info: 'Information',
      portfolio: 'Portfolio',
      openProject: 'Open project',
      openPdf: 'Open PDF',
      certificates: 'Certificates',
      verify: 'Verify',
      openFile: 'Open file',
      contacts: 'Contacts',
      website: 'Website / profile',
    },
    auth: {
      loginTitle: 'Sign in',
      registerTitle: 'Create account',
      loginSubtitle: 'Enter your email and password',
      registerSubtitle: 'Fill in your registration details',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPassword: 'Confirm password',
      confirmPlaceholder: 'Repeat password',
      loading: 'Loading...',
      login: 'Sign in',
      register: 'Register',
      noAccount: 'No account?',
      hasAccount: 'Already have an account?',
    },
    legal: {
      privacyTitle: 'Privacy Policy',
      termsTitle: 'Terms of Use',
      updated: 'Last updated',
      backHome: '← Home',
    },
  },
} as const

export function t(lang: Lang) {
  return dict[lang]
}
