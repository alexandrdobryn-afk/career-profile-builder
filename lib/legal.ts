import { Lang } from './i18n'

export interface LegalSection {
  title: string
  body: string[]
  list?: string[]
}

export interface LegalDocument {
  title: string
  description: string
  updatedAt: string
  intro: string[]
  sections: LegalSection[]
}

export const legalDocuments: Record<Lang, { privacy: LegalDocument; terms: LegalDocument }> = {
  ru: {
    privacy: {
      title: 'Политика конфиденциальности',
      description: 'Как JobProfile собирает, хранит и использует данные пользователей.',
      updatedAt: '4 июня 2026 г.',
      intro: [
        'JobProfile помогает пользователям создавать публичные профессиональные профили с резюме, портфолио, сертификатами, фото профиля и ссылками. Эта политика объясняет, какие данные мы обрабатываем и как они используются.',
      ],
      sections: [
        {
          title: '1. Какие данные мы собираем',
          body: ['Мы можем обрабатывать данные, которые пользователь сам добавляет в сервис:'],
          list: [
            'email и пароль для регистрации и входа;',
            'имя, фамилию, профессию, навыки, описание профиля и локацию;',
            'резюме, фото профиля, проекты, сертификаты и прикрепленные файлы;',
            'контактный email и публичные ссылки, например LinkedIn, GitHub, YouTube или Facebook;',
            'технические данные, необходимые для работы сессии, безопасности и выбора языка.',
          ],
        },
        {
          title: '2. Как мы используем данные',
          body: ['Данные используются для создания профиля, авторизации пользователя, отображения публичной страницы, выдачи разрешенных файлов и поддержки стабильной работы сервиса.'],
        },
        {
          title: '3. Публичная информация',
          body: ['Если профиль опубликован, посетители могут видеть информацию, которую пользователь добавил в публичный профиль. Резюме, ссылки и отдельные блоки отображаются только если пользователь добавил их и разрешил публичный показ. Пустые поля не показываются.'],
        },
        {
          title: '4. Пароли и безопасность',
          body: ['Пароли не хранятся в открытом виде. Для входа используются защищенные cookies. Пользователь отвечает за надежность своего пароля и за материалы, которые публикует на своей странице.'],
        },
        {
          title: '5. Файлы и хранение',
          body: ['Загруженные файлы хранятся в файловом хранилище сервиса. Мы ограничиваем размер файлов, чтобы сервис оставался быстрым и стабильным. Пользователь может заменить или удалить свои файлы в личном кабинете.'],
        },
        {
          title: '6. Передача данных третьим лицам',
          body: ['Мы не продаем персональные данные. Данные могут технически обрабатываться провайдерами хостинга, базы данных, хранения файлов и инфраструктуры, если это необходимо для работы сервиса.'],
        },
        {
          title: '7. Удаление данных',
          body: ['Пользователь может удалять резюме, фото, проекты, сертификаты и ссылки. При удалении профиля связанные с ним данные и файлы должны быть удалены из активного хранилища сервиса.'],
        },
        {
          title: '8. Изменения политики',
          body: ['Мы можем обновлять эту политику по мере развития проекта. Актуальная версия всегда доступна на этой странице.'],
        },
        {
          title: '9. Контакты',
          body: ['По вопросам конфиденциальности используйте контактные данные владельца проекта или каналы связи, указанные на сайте.'],
        },
      ],
    },
    terms: {
      title: 'Правила пользования',
      description: 'Условия использования сервиса JobProfile.',
      updatedAt: '4 июня 2026 г.',
      intro: [
        'Эти правила описывают условия использования JobProfile. Используя сервис, пользователь соглашается с этими правилами.',
      ],
      sections: [
        {
          title: '1. Назначение сервиса',
          body: ['JobProfile предназначен для создания и публикации профессиональных профилей. Пользователь может добавлять резюме, фото, описание, портфолио, сертификаты, контактные данные и ссылки.'],
        },
        {
          title: '2. Аккаунт пользователя',
          body: ['Пользователь отвечает за достоверность данных, безопасность своего аккаунта и сохранность пароля. Запрещено использовать чужие данные или создавать профили от имени другого человека без разрешения.'],
        },
        {
          title: '3. Публикация профилей',
          body: ['Пользователь сам выбирает, публиковать профиль или скрыть его. Опубликованный профиль доступен по публичной ссылке. Отдельные материалы, например резюме и ссылки, могут иметь собственные настройки публичного показа.'],
        },
        {
          title: '4. Контент пользователя',
          body: ['Пользователь не должен размещать:'],
          list: [
            'незаконные, мошеннические или вводящие в заблуждение материалы;',
            'чужие резюме, сертификаты, фото или проекты без права использования;',
            'вредоносные файлы, спам, фишинговые ссылки или материалы, нарушающие права других лиц;',
            'персональные данные третьих лиц без их согласия.',
          ],
        },
        {
          title: '5. Файлы и ограничения',
          body: ['Сервис может ограничивать размер и тип загружаемых файлов. Эти ограничения нужны для стабильной работы проекта. Файлы могут быть удалены пользователем из личного кабинета.'],
        },
        {
          title: '6. Ответственность',
          body: ['JobProfile предоставляет инструмент для размещения профиля, но не проверяет автоматически достоверность резюме, сертификатов, опыта, ссылок или портфолио. Пользователь отвечает за опубликованную информацию.'],
        },
        {
          title: '7. Доступность сервиса',
          body: ['Мы стараемся поддерживать сервис в рабочем состоянии, но не гарантируем непрерывную работу без ошибок, перерывов или технических ограничений. Некоторые функции могут изменяться по мере развития проекта.'],
        },
        {
          title: '8. Удаление и ограничение доступа',
          body: ['Мы можем ограничить доступ к аккаунту или удалить материалы, если они нарушают эти правила, закон, безопасность сервиса или права других людей.'],
        },
        {
          title: '9. Изменения правил',
          body: ['Правила могут обновляться. Актуальная версия публикуется на этой странице. Продолжение использования сервиса после обновления означает согласие с новой версией.'],
        },
        {
          title: '10. Контакты',
          body: ['По вопросам использования сервиса обращайтесь через контактные данные владельца проекта или каналы связи, указанные на сайте.'],
        },
      ],
    },
  },
  uk: {
    privacy: {
      title: 'Політика конфіденційності',
      description: 'Як JobProfile збирає, зберігає та використовує дані користувачів.',
      updatedAt: '4 червня 2026 р.',
      intro: [
        'JobProfile допомагає користувачам створювати публічні професійні профілі з резюме, портфоліо, сертифікатами, фото профілю та посиланнями. Ця політика пояснює, які дані ми обробляємо і як вони використовуються.',
      ],
      sections: [
        {
          title: '1. Які дані ми збираємо',
          body: ['Ми можемо обробляти дані, які користувач сам додає до сервісу:'],
          list: [
            'email і пароль для реєстрації та входу;',
            'ім’я, прізвище, професію, навички, опис профілю та локацію;',
            'резюме, фото профілю, проєкти, сертифікати та прикріплені файли;',
            'контактний email і публічні посилання, наприклад LinkedIn, GitHub, YouTube або Facebook;',
            'технічні дані, потрібні для роботи сесії, безпеки та вибору мови.',
          ],
        },
        {
          title: '2. Як ми використовуємо дані',
          body: ['Дані використовуються для створення профілю, авторизації користувача, показу публічної сторінки, видачі дозволених файлів і підтримки стабільної роботи сервісу.'],
        },
        {
          title: '3. Публічна інформація',
          body: ['Якщо профіль опубліковано, відвідувачі можуть бачити інформацію, яку користувач додав у публічний профіль. Резюме, посилання та окремі блоки показуються лише тоді, коли користувач додав їх і дозволив публічний показ. Порожні поля не відображаються.'],
        },
        {
          title: '4. Паролі та безпека',
          body: ['Паролі не зберігаються у відкритому вигляді. Для входу використовуються захищені cookies. Користувач відповідає за надійність свого пароля та матеріали, які публікує на своїй сторінці.'],
        },
        {
          title: '5. Файли та зберігання',
          body: ['Завантажені файли зберігаються у файловому сховищі сервісу. Ми обмежуємо розмір файлів, щоб сервіс залишався швидким і стабільним. Користувач може замінити або видалити свої файли в особистому кабінеті.'],
        },
        {
          title: '6. Передача даних третім особам',
          body: ['Ми не продаємо персональні дані. Дані можуть технічно оброблятися провайдерами хостингу, бази даних, зберігання файлів та інфраструктури, якщо це потрібно для роботи сервісу.'],
        },
        {
          title: '7. Видалення даних',
          body: ['Користувач може видаляти резюме, фото, проєкти, сертифікати та посилання. Після видалення профілю пов’язані з ним дані та файли мають бути видалені з активного сховища сервісу.'],
        },
        {
          title: '8. Зміни політики',
          body: ['Ми можемо оновлювати цю політику в міру розвитку проєкту. Актуальна версія завжди доступна на цій сторінці.'],
        },
        {
          title: '9. Контакти',
          body: ['З питань конфіденційності використовуйте контактні дані власника проєкту або канали зв’язку, зазначені на сайті.'],
        },
      ],
    },
    terms: {
      title: 'Правила користування',
      description: 'Умови використання сервісу JobProfile.',
      updatedAt: '4 червня 2026 р.',
      intro: [
        'Ці правила описують умови використання JobProfile. Користуючись сервісом, користувач погоджується з цими правилами.',
      ],
      sections: [
        {
          title: '1. Призначення сервісу',
          body: ['JobProfile призначений для створення та публікації професійних профілів. Користувач може додавати резюме, фото, опис, портфоліо, сертифікати, контактні дані та посилання.'],
        },
        {
          title: '2. Акаунт користувача',
          body: ['Користувач відповідає за достовірність даних, безпеку свого акаунта та збереження пароля. Заборонено використовувати чужі дані або створювати профілі від імені іншої людини без дозволу.'],
        },
        {
          title: '3. Публікація профілів',
          body: ['Користувач сам обирає, публікувати профіль чи приховати його. Опублікований профіль доступний за публічним посиланням. Окремі матеріали, наприклад резюме та посилання, можуть мати власні налаштування публічного показу.'],
        },
        {
          title: '4. Контент користувача',
          body: ['Користувач не повинен розміщувати:'],
          list: [
            'незаконні, шахрайські або такі, що вводять в оману, матеріали;',
            'чужі резюме, сертифікати, фото або проєкти без права використання;',
            'шкідливі файли, спам, фішингові посилання або матеріали, що порушують права інших осіб;',
            'персональні дані третіх осіб без їхньої згоди.',
          ],
        },
        {
          title: '5. Файли та обмеження',
          body: ['Сервіс може обмежувати розмір і тип завантажуваних файлів. Ці обмеження потрібні для стабільної роботи проєкту. Файли можуть бути видалені користувачем з особистого кабінету.'],
        },
        {
          title: '6. Відповідальність',
          body: ['JobProfile надає інструмент для розміщення профілю, але не перевіряє автоматично достовірність резюме, сертифікатів, досвіду, посилань або портфоліо. Користувач відповідає за опубліковану інформацію.'],
        },
        {
          title: '7. Доступність сервісу',
          body: ['Ми намагаємося підтримувати сервіс у робочому стані, але не гарантуємо безперервну роботу без помилок, перерв або технічних обмежень. Деякі функції можуть змінюватися в міру розвитку проєкту.'],
        },
        {
          title: '8. Видалення та обмеження доступу',
          body: ['Ми можемо обмежити доступ до акаунта або видалити матеріали, якщо вони порушують ці правила, закон, безпеку сервісу або права інших людей.'],
        },
        {
          title: '9. Зміни правил',
          body: ['Правила можуть оновлюватися. Актуальна версія публікується на цій сторінці. Продовження використання сервісу після оновлення означає згоду з новою версією.'],
        },
        {
          title: '10. Контакти',
          body: ['З питань використання сервісу звертайтеся через контактні дані власника проєкту або канали зв’язку, зазначені на сайті.'],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      description: 'How JobProfile collects, stores, and uses user data.',
      updatedAt: 'June 4, 2026',
      intro: [
        'JobProfile helps users create public professional profiles with a resume, portfolio, certificates, profile photo, and links. This policy explains what data we process and how it is used.',
      ],
      sections: [
        {
          title: '1. Data we collect',
          body: ['We may process data that the user adds to the service:'],
          list: [
            'email and password for registration and sign-in;',
            'first name, last name, profession, skills, profile description, and location;',
            'resume, profile photo, projects, certificates, and attached files;',
            'contact email and public links such as LinkedIn, GitHub, YouTube, or Facebook;',
            'technical data needed for sessions, security, and language selection.',
          ],
        },
        {
          title: '2. How we use data',
          body: ['Data is used to create profiles, authorize users, display public pages, serve permitted files, and keep the service stable.'],
        },
        {
          title: '3. Public information',
          body: ['If a profile is published, visitors can see the information the user added to the public profile. Resumes, links, and separate sections are shown only when the user added them and allowed public display. Empty fields are not shown.'],
        },
        {
          title: '4. Passwords and security',
          body: ['Passwords are not stored in plain text. Secure cookies are used for sign-in. The user is responsible for password strength and for the materials published on their page.'],
        },
        {
          title: '5. Files and storage',
          body: ['Uploaded files are stored in the service file storage. We limit file sizes so the service stays fast and stable. Users can replace or delete their files in the dashboard.'],
        },
        {
          title: '6. Third-party processing',
          body: ['We do not sell personal data. Data may be technically processed by hosting, database, file storage, and infrastructure providers when needed to operate the service.'],
        },
        {
          title: '7. Data deletion',
          body: ['Users can delete resumes, photos, projects, certificates, and links. When a profile is deleted, related data and files should be removed from the active service storage.'],
        },
        {
          title: '8. Policy changes',
          body: ['We may update this policy as the project evolves. The current version is always available on this page.'],
        },
        {
          title: '9. Contacts',
          body: ['For privacy questions, use the project owner contact details or communication channels listed on the site.'],
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      description: 'Terms for using the JobProfile service.',
      updatedAt: 'June 4, 2026',
      intro: [
        'These terms describe the rules for using JobProfile. By using the service, the user agrees to these terms.',
      ],
      sections: [
        {
          title: '1. Service purpose',
          body: ['JobProfile is intended for creating and publishing professional profiles. Users can add a resume, photo, description, portfolio, certificates, contact details, and links.'],
        },
        {
          title: '2. User account',
          body: ['The user is responsible for data accuracy, account security, and password safety. It is forbidden to use someone else’s data or create profiles on behalf of another person without permission.'],
        },
        {
          title: '3. Profile publication',
          body: ['The user decides whether to publish or hide a profile. A published profile is available through a public link. Separate materials such as resumes and links may have their own public display settings.'],
        },
        {
          title: '4. User content',
          body: ['The user must not publish:'],
          list: [
            'illegal, fraudulent, or misleading materials;',
            'someone else’s resumes, certificates, photos, or projects without usage rights;',
            'malicious files, spam, phishing links, or materials that violate the rights of others;',
            'personal data of third parties without their consent.',
          ],
        },
        {
          title: '5. Files and limits',
          body: ['The service may limit uploaded file size and type. These limits are needed for project stability. Files may be deleted by the user from the dashboard.'],
        },
        {
          title: '6. Responsibility',
          body: ['JobProfile provides a tool for publishing a profile but does not automatically verify resumes, certificates, experience, links, or portfolio items. The user is responsible for published information.'],
        },
        {
          title: '7. Service availability',
          body: ['We try to keep the service working, but we do not guarantee uninterrupted operation without errors, outages, or technical limitations. Some features may change as the project develops.'],
        },
        {
          title: '8. Removal and access restriction',
          body: ['We may restrict account access or remove materials if they violate these terms, the law, service security, or the rights of other people.'],
        },
        {
          title: '9. Terms changes',
          body: ['These terms may be updated. The current version is published on this page. Continued use of the service after an update means acceptance of the new version.'],
        },
        {
          title: '10. Contacts',
          body: ['For service usage questions, use the project owner contact details or communication channels listed on the site.'],
        },
      ],
    },
  },
}
