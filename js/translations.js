/**
 * translations.js
 * Hand-picked English/Chinese pairs for the site's static UI chrome (nav,
 * filter bar, buttons, section labels). This is the whole translation
 * mechanism now — no Google Translate — because Google's servers are
 * blocked in mainland China, so importing that widget would silently
 * break the site there. Content that comes from the database (event
 * titles/descriptions, host bios, category/language/level names, city
 * names typed by hosts, etc.) is intentionally left untranslated.
 *
 * Look words up with t('key'). Static HTML can use
 * data-i18n="key" (sets textContent) or data-i18n-placeholder="key"
 * (sets the placeholder attribute) — see applyTranslations() in
 * translate.js, which walks the DOM for those attributes.
 */

const TRANSLATIONS = {
    // ---- header.html ----
    membershipCta: { en: "Get a Membership or Day Pass", zh: "购买会员卡或单日通行证" },
    membershipCtaEnglish: { en: "Choose Your English Package", zh: "选择英语课程套餐" },
    navHome: { en: "Home", zh: "首页" },
    navProfile: { en: "Profile", zh: "个人资料" },
    navLogin: { en: "Log In", zh: "登录" },
    navMyPlan: { en: "My Plan", zh: "我的套餐" },
    sectionEvents: { en: "Events", zh: "活动" },
    navAttending: { en: "Attending", zh: "已报名" },
    navHosting: { en: "Hosting", zh: "我主持的" },
    navAddEvent: { en: "+ Add Event", zh: "+ 添加活动" },
    sectionCommunity: { en: "Community", zh: "社区" },
    navLeaderboard: { en: "Leaderboard 🏆", zh: "排行榜 🏆" },
    navCommunityRules: { en: "Community Rules", zh: "社区规则" },
    sectionHelp: { en: "Help & Resources", zh: "帮助与资源" },
    navEnglishClass: { en: "English Class", zh: "英语课程" },
    navAbout: { en: "About", zh: "关于我们" },
    navFaq: { en: "FAQ", zh: "常见问题" },
    navContact: { en: "Contact", zh: "联系我们" },
    navBlog: { en: "Blog", zh: "博客" },

    // ---- index.html: location tabs / city picker ----
    tabOnline: { en: "Online", zh: "线上" },
    tabInPerson: { en: "In Person", zh: "线下" },
    cityBangkok: { en: "Bangkok", zh: "曼谷" },
    cityChiangMai: { en: "Chiang Mai", zh: "清迈" },
    cityPhuket: { en: "Phuket", zh: "普吉岛" },
    cityChengdu: { en: "Chengdu", zh: "成都" },
    cityHongKong: { en: "Hong Kong", zh: "香港" },
    countryThailand: { en: "THAILAND", zh: "泰国" },
    countryChina: { en: "CHINA", zh: "中国" },
    countryHongKong: { en: "HONG KONG", zh: "香港" },

    // ---- index.html: search bar / filter panel ----
    searchStart: { en: "Start exploring", zh: "开始探索" },
    moodPlaceholder: { en: "What are you feeling?", zh: "你想做点什么？" },
    langLevelPlaceholder: { en: "Which language?", zh: "选择语言？" },
    datePlaceholder: { en: "Anytime", zh: "随时" },
    rowLanguage: { en: "Language", zh: "语言" },
    rowLevel: { en: "Level", zh: "等级" },
    rowDate: { en: "Date", zh: "日期" },
    pickMany: { en: "Pick as many as you like.", zh: "可多选。" },
    btnReset: { en: "Reset", zh: "重置" },
    btnDone: { en: "Done", zh: "完成" },
    langLevelTitle: { en: "Language & Level", zh: "语言与等级" },
    langLevelHeadline: { en: "Which language?", zh: "选择哪种语言？" },
    pickAnyScroll: { en: "Pick any number — scroll for more.", zh: "可任意多选，滑动查看更多。" },
    comfortHeadline: { en: "How comfortable are you?", zh: "你的熟练程度如何？" },
    comfortSub: { en: "Pick the kind of conversation that feels right for you.", zh: "选择适合你的对话难度。" },
    whenTitle: { en: "When", zh: "时间" },
    calHint: { en: "Tap a day to pick one date, or tap a second day to select a range.", zh: "点击一天选择单个日期，或再点第二天选择一个日期范围。" },
    calToday: { en: "Today", zh: "今天" },
    calWeekend: { en: "This weekend", zh: "本周末" },
    calWeek: { en: "Next 7 days", zh: "未来7天" },
    calShowUpcoming: { en: "Show upcoming events", zh: "显示近期活动" },

    // ---- index.html: desktop search pill ----
    dtWhere: { en: "Where", zh: "地点" },
    dtInterests: { en: "Interests", zh: "兴趣" },
    dtLangLevel: { en: "Language & Level", zh: "语言与等级" },
    dtWhen: { en: "When", zh: "时间" },
    btnFilters: { en: "Filters", zh: "筛选" },

    // ---- index.html: modals ----
    membershipNeededTitle: { en: "Membership Needed", zh: "需要会员资格" },
    membershipNeededBody: { en: "Your membership or passes have been used up 😊 Renew your membership to continue booking sessions and joining discussions.", zh: "您的会员资格或课程券已用完 😊 请续费以继续预订活动和参与讨论。" },
    membershipExpiredBody: { en: "Your membership has expired or expires before this session 😊 Please renew to continue booking.", zh: "您的会员资格已过期，或将在此活动前到期 😊 请续费以继续预订。" },
    maybeLater: { en: "Maybe Later", zh: "以后再说" },
    promoWelcome: { en: "Welcome to Lingping Club ✨", zh: "欢迎来到凌平俱乐部 ✨" },
    promoFreeTrials: { en: "Log in for free trials in Bangkok, Phuket, Chengdu & online!", zh: "登录即可在曼谷、普吉岛、成都及线上免费试用！" },
    continueBrowsing: { en: "Continue browsing", zh: "继续浏览" },
    login: { en: "Login", zh: "登录" },

    // ---- event cards (event-card.js) ----
    attend: { en: "Attend", zh: "参加" },
    joinWaitlist: { en: "Join Waitlist", zh: "加入候补名单" },
    hostedBy: { en: "Hosted by", zh: "主办方：" },
    statusAvailable: { en: "Available", zh: "可预订" },
    statusFull: { en: "Full", zh: "已满" },
    statusCanceled: { en: "Canceled", zh: "已取消" },
    noSessions: { en: "No sessions", zh: "暂无活动" },

    // ---- event-detail.html ----
    backBtn: { en: "← Back", zh: "← 返回" },
    share: { en: "Share", zh: "分享" },
    labelTime: { en: "Time", zh: "时间" },
    labelJoinOnline: { en: "Join Online", zh: "线上加入方式" },
    labelLocation: { en: "Location", zh: "地点" },
    labelWith: { en: "With", zh: "主持人" },
    labelPerfectFor: { en: "Perfect For", zh: "适合人群" },
    labelWhatWeDo: { en: "What We’ll Do", zh: "活动内容" },
    labelOurTheme: { en: "Our Theme", zh: "活动主题" },
    labelAttendees: { en: "Attendees", zh: "参与者" },
    loading: { en: "Loading...", zh: "加载中..." },
    platformLabel: { en: "Platform", zh: "平台" },
    joinViaMeetingLink: { en: "🔗 Join via Meeting Link", zh: "🔗 点击链接加入会议" },
    meetingRoomNumber: { en: "Meeting Room Number:", zh: "会议号：" },
    loginForMeetingDetails: { en: "Log in to see meeting details & get your first free trial ✨", zh: "登录即可查看会议详情并获得首次免费试用 ✨" },
    viewLocation: { en: "View location", zh: "查看地点" },
    locationTBA: { en: "Location TBA", zh: "地点待定" },
    needHelpFinding: { en: "📍 Need help finding us?", zh: "📍 需要帮助找到我们吗？" },
    hostTBA: { en: "TBA", zh: "待定" },
    tapToKnowMembers: { en: "Tap to get to know fellow Lingping members 👇", zh: "点击认识其他凌平俱乐部成员 👇" },
    beFirstToJoin: { en: "Be the first to join—people will join soon!", zh: "成为第一个加入的人——很快会有更多人加入！" },
    peopleYoullMeet: { en: "People You'll Meet", zh: "你将认识的伙伴" },
    joinedFull: { en: "joined · full", zh: "人已加入 · 已满" },
    joinedSeatLeft: { en: "joined · 1 seat left", zh: "人已加入 · 剩1个名额" },
    joinedSeatsLeft: { en: "joined · {n} seats left", zh: "人已加入 · 剩{n}个名额" },
    linkCopied: { en: "Link copied ✅", zh: "链接已复制 ✅" },
    copied: { en: "Copied ✅", zh: "已复制 ✅" },
    meetingNumberCopied: { en: "Meeting number copied ✅", zh: "会议号已复制 ✅" },
    cancelBooking: { en: "Cancel Booking", zh: "取消预订" },
    hostHelpTitle: { en: "We’re happy to help you!", zh: "我们很乐意为您提供帮助！" },
    hostHelpCall: { en: "📞 Call", zh: "📞 致电" },
    hostHelpLine: { en: "💬 Message our LINE Official", zh: "💬 通过 LINE 官方账号联系我们" },
    close: { en: "Close", zh: "关闭" },

    // ---- login.html ----
    browserPopupTitle: { en: "Open in Browser for the Best Experience", zh: "在浏览器中打开以获得最佳体验" },
    browserPopupSteps: { en: "1. Tap <b>⋯</b> in the app.<br>2. Click <b>\"Open in Browser\"</b>", zh: "1. 点击应用中的 <b>⋯</b><br>2. 点击 <b>「在浏览器中打开」</b>" },
    browserPopupHint: { en: "If you don't see that option, copy the login link and open it in Chrome or Safari.", zh: "如果没有看到该选项，请复制登录链接并在 Chrome 或 Safari 中打开。" },
    copyLoginLink: { en: "Copy Login Link", zh: "复制登录链接" },
    linkCopiedOpenIn: { en: "Link copied! Open it in Safari or Chrome.", zh: "链接已复制！请在 Safari 或 Chrome 中打开。" },
    welcomeBack: { en: "Welcome Back", zh: "欢迎回来" },
    getUpdatesReminders: { en: "Get Updates & Reminders", zh: "获取更新与提醒" },
    orDivider: { en: "or", zh: "或" },
    continueWithPhone: { en: "Continue with phone number", zh: "使用手机号码继续" },
    continueWithEmail: { en: "Continue with email", zh: "使用邮箱继续" },
    recommendedMainlandChina: { en: "🇨🇳 Recommended for Mainland China users", zh: "🇨🇳 推荐中国大陆用户使用" },
    continueWithUsername: { en: "Continue with username", zh: "使用用户名继续" },
    continueBtn: { en: "Continue", zh: "继续" },
    pleaseWait: { en: "Please wait...", zh: "请稍候..." },
    sendOTP: { en: "Send OTP", zh: "发送验证码" },
    yourNameRequired: { en: "Your name (required)", zh: "您的姓名（必填）" },
    enterOTPPlaceholder: { en: "Enter OTP", zh: "输入验证码" },
    verify: { en: "Verify", zh: "验证" },
    loggedInTitle: { en: "🎉 You're logged in!", zh: "🎉 登录成功！" },
    loggedInBody: { en: "You can now get a membership and start booking activities!", zh: "现在您可以购买会员并开始预订活动了！" },
    ok: { en: "OK", zh: "好的" },
    invalidEmail: { en: "Please enter a valid email address.", zh: "请输入有效的电子邮箱地址。" },
    didYouMean: { en: "Did you mean", zh: "您是否想输入" },
    emailAlreadyRegistered: { en: "This email is already registered under a different login method. Try Google, phone, or username instead.", zh: "该邮箱已通过其他登录方式注册。请尝试使用谷歌账号、手机号或用户名登录。" },
    accountCreatedLoginFailed: { en: "Account created, but login failed. Please try again.", zh: "账户已创建，但登录失败，请重试。" },
    genericLoginFailed: { en: "Login failed. Please try again.", zh: "登录失败，请重试。" },
    enterUsernamePrompt: { en: "Enter your username:", zh: "请输入您的用户名：" },
    invalidUsername: { en: "Invalid username. Please check and try again.", zh: "用户名无效，请检查后重试。" },
    enterPhoneNumber: { en: "Please enter your phone number", zh: "请输入您的手机号码" },
    otpSentTo: { en: "OTP sent to", zh: "验证码已发送至" },
    otpSendFailed: { en: "Failed to send OTP. Please try again.", zh: "验证码发送失败，请重试。" },
    enterOTPAlert: { en: "Enter OTP", zh: "请输入验证码" },
    otpVerifyFailed: { en: "Login failed. The OTP may be incorrect or expired. Please try again.", zh: "登录失败，验证码可能有误或已过期，请重试。" },
    verificationFailed: { en: "Verification failed", zh: "验证失败" },

    // ---- english-sessions.html ----
    englishClassesTitle: { en: "📘 English Classes", zh: "📘 英语课程" },
    englishClassesSubtitle: { en: "Learn at your level, build your vocabulary, and join when it works for you.", zh: "根据自己的水平学习，积累词汇量，随时加入适合你的课程。" },
    levelAll: { en: "All", zh: "全部" },
    levelEasy: { en: "Easy", zh: "初级" },
    levelMedium: { en: "Medium", zh: "中级" },

    // ---- pre-booking confirmation modal ----
    confirmBooking: { en: "Confirm Booking", zh: "确认预订" },
    communityReminder: { en: "🌿 Community Reminder", zh: "🌿 社区提醒" },
    reminderOnTime: { en: "Be on time.", zh: "请准时参加。" },
    reminderPolite: { en: "Be polite and respectful.", zh: "请保持礼貌和尊重。" },
    reminderNoWalkIns: { en: "Only booked participants. No walk-ins.", zh: "仅限已预订者参加，谢绝临时加入。" },
    reminderOrderDrink: { en: "For in-person events, order at least one drink to support the venue.", zh: "线下活动请至少点一杯饮品以支持场地。" },
    cancellationPolicyTitle: { en: "📌 Cancellation Policy", zh: "📌 取消政策" },
    cancellationPolicyBody: { en: "Please cancel at least 3 hours before your session if you can’t join so others can take your spot and hosts can plan better.", zh: "如无法参加，请至少提前3小时取消，以便他人递补名额，主持人也能更好地安排活动。" },
    agreeReminders: { en: "I understand and agree to the community reminders and cancellation policy.", zh: "我已了解并同意社区提醒和取消政策。" },
    agreeRequiredAlert: { en: "Please agree to the community reminders and cancellation policy.", zh: "请先同意社区提醒和取消政策。" },
    readFullRules: { en: "Read full community rules", zh: "查看完整社区规则" },
    cancel: { en: "Cancel", zh: "取消" },
    okBook: { en: "OK, Book", zh: "确认预订" },

    // ---- booking-success modal ----
    bookingConfirmed: { en: "Booking Confirmed 🎉", zh: "预订成功 🎉" },
    addToGoogleCalendar: { en: "📅 Add to Google Calendar", zh: "📅 添加到 Google 日历" },
    imOk: { en: "I'm OK", zh: "好的" },

    // ---- language / level chips (event cards + event-detail) ----
    // Keyed by the API's stable code, not the label text, so it applies
    // whether the label came from our own LANG_META/LEVEL_META (index.html
    // cards) or the live /reading-sessions/options API (event-detail).
    lang_en: { en: "English", zh: "英语" },
    lang_th: { en: "Thai", zh: "泰语" },
    lang_zh: { en: "Chinese", zh: "中文" },
    lang_yue: { en: "Cantonese", zh: "粤语" },
    lang_ja: { en: "Japanese", zh: "日语" },
    lang_es: { en: "Spanish", zh: "西班牙语" },
    lang_fr: { en: "French", zh: "法语" },
    lang_ru: { en: "Russian", zh: "俄语" },
    lang_it: { en: "Italian", zh: "意大利语" },
    lang_de: { en: "German", zh: "德语" },
    level_beginner: { en: "Beginner", zh: "初级" },
    level_upper_beginner: { en: "Upper Beginner", zh: "中初级" },
    level_intermediate: { en: "Intermediate", zh: "中级" },
    level_advanced: { en: "Advanced-Native", zh: "高级-母语" },

    // ---- category chips / picker list (mood filter) — icon is always
    // rendered separately (CATEGORY_ICONS), so these stay plain text.
    cat_discussion: { en: "Discussion", zh: "讨论" },
    cat_language: { en: "Language", zh: "语言" },
    cat_sports: { en: "Sports", zh: "运动" },
    cat_explore_the_city: { en: "Explore the city", zh: "探索城市" },
    cat_culture: { en: "Culture", zh: "文化" },
    cat_food: { en: "Food", zh: "美食" },
    cat_movie: { en: "Movie", zh: "电影" },
    cat_book: { en: "Book club", zh: "读书会" },
    cat_music: { en: "Music", zh: "音乐" },
    cat_arts: { en: "Arts", zh: "艺术" },
    cat_social: { en: "Social", zh: "社交" },

    // ---- my-bookings.html ----
    upcomingSessions: { en: "Upcoming Sessions", zh: "近期活动" },
    eventsHosting: { en: "Events I'm Hosting", zh: "我主持的活动" },
    eventsAttending: { en: "Events I'm Attending", zh: "我参加的活动" },
    helloUser: { en: "Hello", zh: "你好" },
    logout: { en: "Logout", zh: "退出登录" },
    logIn: { en: "Log in", zh: "登录" },
    pleaseLogInBookings: { en: "Please log in to see your bookings.", zh: "请登录以查看您的预订。" },
    noUpcomingBookings: { en: "You have no upcoming bookings.", zh: "您暂无即将进行的预订。" },
    noUpcomingHosted: { en: "You have no upcoming hosted events.", zh: "您暂无即将主持的活动。" },
    hosting: { en: "Hosting", zh: "主持中" },
    joining: { en: "Joining", zh: "已参加" },
    edit: { en: "Edit", zh: "编辑" },

    // ---- subscriptions.html (My Plan) ----
    pleaseLogInSubs: { en: "Please log in to see your subscriptions.", zh: "请登录以查看您的会员计划。" },
    noSubscriptions: { en: "You have no subscriptions.", zh: "您暂无任何会员计划。" },
    failedLoadSubs: { en: "Failed to load subscriptions.", zh: "加载会员计划失败。" },
    learningLabel: { en: "LEARNING", zh: "学习中" },
    unlimitedAccess: { en: "Unlimited access", zh: "无限次数" },
    passesLeft: { en: "Passes Left", zh: "剩余次数" },
    active: { en: "Active", zh: "生效中" },
    expiredNoPasses: { en: "Expired/No Passes Left", zh: "已过期/次数已用完" },
    validThrough: { en: "Valid through", zh: "有效期至" },
    dayOfFirstUse: { en: "Day of first use", zh: "首次使用当天起算" },
    activatedLabel: { en: "Activated", zh: "生效时间" },
    notActivatedYet: { en: "Not activated yet", zh: "尚未生效" },
};

function t(key) {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    const lang = (window.getSiteLanguage && window.getSiteLanguage()) || 'en';
    return entry[lang] || entry.en;
}

window.t = t;
