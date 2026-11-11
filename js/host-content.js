/**
 * host-content.js
 * All static copy for "Host anything, anytime" in one place: the events-list
 * nudges (js/host-nudges.js), the start page (host-event.html) and the
 * hosting guide (hosting-guide.html). Edit wording here, not in the pages.
 *
 *   HostContent.icon(name, size)  → inline SVG string
 *   HostContent.categoryStyle(value) → { tint, ink, icon }
 *   NUDGE / START / GUIDE come out in the site language (en / zh / th), see I18N below.
 */
(function () {
    // Inline SVG paths (24×24, stroke icons). No emoji in these pages.
    const ICON_PATHS = {
        chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
        language: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
        globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
        landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
        soup: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/><path d="M7 21h10"/><path d="M16 3c.3.1.8.5.8 1.4 0 .8-1 1.2-1 2 0 .8.3 1.2.7 1.6"/><path d="M11.3 3c.3.1.8.5.7 1.4 0 .8-.9 1.2-1 2 0 .8.3 1.2.7 1.6"/><path d="M6.5 3c.3.1.8.5.8 1.4-.1.8-1 1.2-1 2 0 .8.3 1.2.7 1.6"/>',
        tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z"/>',
        laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/>',
        briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
        close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        check: '<polyline points="20 6 9 17 4 12"/>',
        back: '<polyline points="15 18 9 12 15 6"/>',
        chevronRight: '<polyline points="9 18 15 12 9 6"/>',
        chevronUp: '<polyline points="18 15 12 9 6 15"/>',
        chevronDown: '<polyline points="6 9 12 15 18 9"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
        bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.1 14c.2-1 .6-1.7 1.4-2.5A4.7 4.7 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.8.8 1.2 1.5 1.4 2.5"/>',
        star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
        ban: '<circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>',
        mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
        dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/>',
        run: '<circle cx="14" cy="4" r="2"/><path d="M5 22l4-7 3 2 1 5"/><path d="M7 11l4-4 3 3 3 1"/><path d="M11 7l1 9"/>',
        cocktail: '<path d="M8 22h8"/><path d="M12 11v11"/><path d="M19 3l-7 8-7-8z"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    };

    function icon(name, size = 20, strokeWidth = 1.8) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.tag}</svg>`;
    }

    // One soft, warm palette shared by every tile and chip: same lightness for all
    // tints, same depth for all inks, so no colour shouts louder than the others.
    const PALETTE = {
        amber: { tint: "#FCF1DF", ink: "#8C5A14" },
        terracotta: { tint: "#FAEBE3", ink: "#97492C" },
        rose: { tint: "#F8ECEC", ink: "#8E4150" },
        sage: { tint: "#EDF1E7", ink: "#4F6A3B" },
        teal: { tint: "#E8F0EE", ink: "#36635D" },
        slate: { tint: "#ECEFF4", ink: "#47567A" },
        plum: { tint: "#F1ECF2", ink: "#6A4D72" },
        sand: { tint: "#F3EFE8", ink: "#5E5547" }
    };

    // Tile colour + icon per category value from GET /reading-sessions/options.
    // A category not listed here still shows, with the neutral style.
    const CATEGORY_STYLE = {
        discussion: { ...PALETTE.amber, icon: "chat" },
        language: { ...PALETTE.slate, icon: "language" },
        sports: { ...PALETTE.teal, icon: "globe" },
        explore_the_city: { ...PALETTE.sage, icon: "pin" },
        culture: { ...PALETTE.terracotta, icon: "landmark" },
        food: { ...PALETTE.amber, icon: "soup" },
        movie: { ...PALETTE.plum, icon: "tv" },
        book: { ...PALETTE.sand, icon: "book" },
        social: { ...PALETTE.rose, icon: "users" },
        music: { ...PALETTE.slate, icon: "music" },
        arts: { ...PALETTE.sage, icon: "palette" },
        tech: { ...PALETTE.teal, icon: "laptop" },
        business: { ...PALETTE.sand, icon: "briefcase" }
    };
    const DEFAULT_CATEGORY_STYLE = { ...PALETTE.sand, icon: "tag" };

    function categoryStyle(value) {
        return CATEGORY_STYLE[value] || DEFAULT_CATEGORY_STYLE;
    }

    const LINKS = {
        startPage: "host-event.html",
        guide: "hosting-guide.html",
        createForm: "add-event.html",
        // The Contact us page (same as "Contact" in the menu).
        askTeam: "join-us.html"
    };

    // ---- Events list (index.html) ----
    const NUDGE = {
        noMatch: "No events match your filters.",
        title: "Something you want to do or talk about?",
        text: "Invite others to join! It's not just about language — host anything, anytime!",
        moreLabel: "More ideas",
        fewerLabel: "Fewer ideas",
        // How many chips show before "More ideas" (the first ones in the list below).
        visibleChips: 3,
        // category: a value from /reading-sessions/options, or null for none.
        // tint/ink/icon: the chip's look (null tint = white dashed chip).
        chips: [
            { label: "Discussion", category: "discussion", icon: "chat", ...PALETTE.amber },
            { label: "Run", category: "sports", icon: "run", ...PALETTE.teal },
            { label: "Game night", category: "social", icon: "dice", ...PALETTE.plum },
            { label: "Park walk", category: "explore_the_city", icon: "mountain", ...PALETTE.sage },
            { label: "Friday night out", category: "social", icon: "cocktail", ...PALETTE.rose },
            { label: "Book club", category: "book", icon: "book", ...PALETTE.slate },
            { label: "Something else", category: null, icon: "plus", tint: null, ink: "#3A3A3A" }
        ]
    };

    // ---- Start page (host-event.html) ----
    const START = {
        pageTitle: "Host an event",
        backLabel: "Back",
        h1: "Host anything, anytime.",
        intro: "It doesn't have to be about language. If it brings people together, it's a Lingping event. Pick your time and place, and members who are free will join.",
        somethingElse: "Something else",
        moreCategories: "More categories",
        loadError: "Couldn't load the categories. You can still host an event:",
        loadErrorLink: "Open the event form",
        links: [
            { label: "What can I host?", tab: "rules", icon: "shield", ink: "#2F6B34" },
            { label: "Tips for a great event", tab: "tips", icon: "bulb", ink: "#9A5D0C" }
        ]
    };

    // ---- Hosting guide (hosting-guide.html) ----
    const GUIDE = {
        pageTitle: "Hosting guide",
        backLabel: "Back",
        tabs: { rules: "What can I host?", tips: "Tips" },

        rules: {
            h2: "If it brings people together, host it.",
            intro: "Any day, any time, anywhere. It doesn't have to match Lingping's schedule.",
            allowedTitle: "Great to host",
            allowed: [
                "Language exchange & conversation",
                "Cultural sharing",
                "Book clubs & big discussions",
                "Knowledge sharing",
                "Walks, hikes & sports",
                "Meals & hobbies",
                "Creative workshops"
            ],
            callout: {
                title: "Any topic is OK to talk about",
                text: "Politics, religion, relationships, money: these make great conversations. What's not OK is campaigning, soliciting, selling, or unsafe behaviour."
            },
            notAllowedTitle: "Not allowed",
            notAllowed: [
                { title: "Gambling & betting", text: "Casinos, poker, betting, or games played for money." },
                { title: "Adult entertainment", text: "Strip clubs, sexually explicit shows, or sexual activities." },
                { title: "Selling & recruiting", text: "Sales pitches, MLM, business recruiting, paid courses or services." },
                { title: "Illegal or unsafe activities", text: "Anything against the law or risky, like dangerous stunts or illegal substances." },
                { title: "Political or religious campaigning", text: "Rallies, party recruiting, or pressuring people to adopt beliefs." },
                { title: "Hate, harassment & discrimination", text: "Targeting or bullying anyone, or making people feel unwelcome." },
                { title: "Fundraising & investment pitches", text: "Collecting donations or soliciting investments without approval." },
                { title: "Invading privacy", text: "Recording, photographing, or sharing personal info without consent." },
                { title: "Brand or promo events", text: "Events mainly to promote a business, product, or personal agenda." }
            ],
            smallPrint: "Lingping may decline or stop any activity that doesn't fit our community values, makes members uncomfortable, or puts their safety or well-being at risk.",
            askPrefix: "Not sure?",
            askLink: "Ask the Lingping team"
        },

        tips: {
            general: {
                title: "Hosting a great session",
                sub: "10 tips for any event",
                // Tips shown before the list scrolls.
                visibleCount: 5,
                items: [
                    { title: "Choose something you're genuinely interested in", text: "Your excitement is contagious." },
                    { title: "Choose an easy-to-find meeting spot", text: "Near a BTS/MRT, with a pin and \"I'll wear a yellow cap\"." },
                    { title: "Be upfront about the cost", text: "Free, or \"~150 THB, pay on the spot\". No surprises." },
                    { title: "Post a few days ahead", text: "2–3 days gives people time to plan." },
                    { title: "Keep the group small", text: "4–8 people is the sweet spot." },
                    { title: "Make everyone feel welcome", text: "Quick intros at the start, and bring newcomers in." },
                    { title: "Make sure everyone gets a chance to speak", text: "Leave space for quieter members." },
                    { title: "Start and finish on time", text: "Respect everyone's plans." },
                    { title: "Communicate clearly if plans change", text: "Update the event as early as you can." },
                    { title: "Share a photo afterward", text: "Post it to the Feed. It's the best invite for your next one." }
                ]
            },
            discussion: {
                title: "Extra tips for a discussion",
                sub: "For conversation events",
                intro: "Create a welcoming space for members to share, learn, and build connections.",
                feelsLike: {
                    title: "A great session feels like…",
                    text: "A relaxed conversation with friends, where you get to hear what others think.",
                    chips: ["Everyone gets to share", "New perspectives", "Positive vibe", "Learn something new"]
                },
                checklist: [
                    { title: "Welcome everyone warmly", text: "Get to know them: where they're from, and what brought them to Thailand. Introduce newcomers to members who've been before." },
                    { title: "Use the session language as much as you can", text: "It helps everyone get into it. Adjust your speed and words to the group's level." },
                    { title: "Stay curious: a conversation, not a Q&A", text: "Ask follow-up questions and explore the interesting stories, rather than moving from question to question." },
                    { title: "Give everyone a turn", text: "Make space for quieter members, and gently balance anyone who's talking a lot." },
                    { title: "Keep it to one conversation", text: "No side chats, so everyone can follow along." },
                    { title: "Let it flow, but stay on topic", text: "If something off-topic comes up (like a detailed grammar question), save it for the end." },
                    { title: "Keep it respectful", text: "Help with interruptions so everyone gets to speak. If someone breaks the community guidelines, kindly remind them, then let Pim know after the session. Lingping will follow up." },
                    { title: "Connection over perfection", text: "Focus on sharing cultures and getting to know each other. Mistakes are part of it." }
                ],
                notALesson: {
                    title: "Not a language lesson",
                    paragraphs: [
                        "Lingping is for cultural exchange, not a language school. We care about communication, curiosity and connection, not perfection.",
                        "Skip the textbook teaching, grammar lectures and constant corrections. Only correct a mistake when it gets in the way of understanding."
                    ],
                    footnote: "Members who want structured lessons or intensive correction can find that in language classes. Lingping is different."
                }
            },
            cta: "Host an event"
        }
    };

    // ---- Chinese and Thai ----
    // Same shape as the English above, text only. Anything left out falls back
    // to English; list items line up by position (icons, links etc. stay as above).
    const I18N = {
        zh: {
            NUDGE: {
                noMatch: "没有符合筛选条件的活动。",
                title: "有想做的事或想聊的话题吗？",
                text: "邀请大家一起来！不只是语言交流——任何活动，随时都能办！",
                moreLabel: "更多点子",
                fewerLabel: "收起",
                chips: [{ label: "讨论" }, { label: "跑步" }, { label: "游戏之夜" }, { label: "公园散步" },
                    { label: "周五晚上聚会" }, { label: "读书会" }, { label: "其他" }]
            },
            START: {
                pageTitle: "主持活动",
                backLabel: "返回",
                h1: "随时随地，想办就办。",
                intro: "不一定要和语言有关。只要能把大家聚在一起，就是 Lingping 活动。选好时间和地点，有空的会员就会来参加。",
                somethingElse: "其他",
                moreCategories: "更多类别",
                loadError: "无法加载活动类别。你仍然可以发起活动：",
                loadErrorLink: "打开活动表单",
                links: [{ label: "可以办什么活动？" }, { label: "办好活动的小贴士" }]
            },
            GUIDE: {
                pageTitle: "主持指南",
                backLabel: "返回",
                tabs: { rules: "可以办什么？", tips: "小贴士" },
                rules: {
                    h2: "只要能把大家聚在一起，就可以办。",
                    intro: "任何一天、任何时间、任何地点都可以，不必配合 Lingping 的日程。",
                    allowedTitle: "推荐举办",
                    allowed: ["语言交换与聊天", "文化分享", "读书会与深度讨论", "知识分享", "散步、徒步与运动", "聚餐与兴趣爱好", "创意工作坊"],
                    callout: {
                        title: "任何话题都可以聊",
                        text: "政治、宗教、感情、金钱：这些都是很好的话题。不可以的是拉票宣传、招揽、推销，或不安全的行为。"
                    },
                    notAllowedTitle: "不允许",
                    notAllowed: [
                        { title: "赌博与博彩", text: "赌场、扑克、下注，或任何赌钱的游戏。" },
                        { title: "成人娱乐", text: "脱衣舞俱乐部、色情表演或性相关活动。" },
                        { title: "推销与招募", text: "推销、传销（MLM）、商业招募、付费课程或服务。" },
                        { title: "违法或危险活动", text: "任何违法或有风险的活动，例如危险特技或违禁药物。" },
                        { title: "政治或宗教宣传", text: "集会、招募党员，或向他人施压要求接受某种信仰。" },
                        { title: "仇恨、骚扰与歧视", text: "针对或欺凌任何人，或让别人感到不受欢迎。" },
                        { title: "募捐与投资推介", text: "未经批准募集捐款或拉投资。" },
                        { title: "侵犯隐私", text: "未经同意录音、拍照或分享个人信息。" },
                        { title: "品牌或推广活动", text: "主要目的是推广某个企业、产品或个人目的的活动。" }
                    ],
                    smallPrint: "对于不符合社区价值观、让会员感到不适，或危及其安全与健康的活动，Lingping 有权拒绝或叫停。",
                    askPrefix: "不确定？",
                    askLink: "问问 Lingping 团队"
                },
                tips: {
                    general: {
                        title: "办好一场活动",
                        sub: "适用于任何活动的 10 个小贴士",
                        items: [
                            { title: "选择你真正感兴趣的内容", text: "你的热情会感染别人。" },
                            { title: "选一个容易找到的集合地点", text: "靠近 BTS/MRT，附上定位，并说明“我会戴黄色帽子”。" },
                            { title: "提前说明费用", text: "免费，或“约 150 泰铢，现场付”。不要有意外。" },
                            { title: "提前几天发布", text: "提前 2–3 天，大家才有时间安排。" },
                            { title: "人数不要太多", text: "4–8 人最合适。" },
                            { title: "让每个人都感到受欢迎", text: "开场先简单自我介绍，带新朋友融入。" },
                            { title: "确保每个人都有机会发言", text: "给比较安静的会员留出空间。" },
                            { title: "准时开始、准时结束", text: "尊重每个人的时间安排。" },
                            { title: "计划有变要及时说明", text: "尽早更新活动信息。" },
                            { title: "活动后分享照片", text: "发到动态（Feed）。这是下一次活动最好的邀请。" }
                        ]
                    },
                    discussion: {
                        title: "讨论活动的额外小贴士",
                        sub: "适用于聊天类活动",
                        intro: "为会员营造一个可以分享、学习和建立联系的温暖空间。",
                        feelsLike: {
                            title: "一场好的活动感觉像……",
                            text: "和朋友轻松聊天，听听别人的想法。",
                            chips: ["每个人都能分享", "新的视角", "积极的氛围", "学到新东西"]
                        },
                        checklist: [
                            { title: "热情欢迎每个人", text: "了解他们：来自哪里、为什么来泰国。把新朋友介绍给来过的会员。" },
                            { title: "尽量使用活动语言", text: "这能帮助大家进入状态。根据大家的水平调整语速和用词。" },
                            { title: "保持好奇：是聊天，不是问答", text: "多追问，深入有趣的故事，而不是一个问题接一个问题。" },
                            { title: "让每个人都有机会", text: "给安静的会员留出空间，温和地平衡说得很多的人。" },
                            { title: "只保持一个对话", text: "不要私下聊小话题，让每个人都能跟上。" },
                            { title: "自然交流，但不跑题", text: "如果出现跑题的内容（比如很细的语法问题），留到最后再说。" },
                            { title: "保持尊重", text: "帮忙处理插话，让每个人都能发言。如果有人违反社区准则，礼貌提醒，活动后告诉 Pim，Lingping 会跟进。" },
                            { title: "连接比完美更重要", text: "重点是分享文化、互相认识。犯错也是其中的一部分。" }
                        ],
                        notALesson: {
                            title: "不是语言课",
                            paragraphs: [
                                "Lingping 是文化交流，不是语言学校。我们重视沟通、好奇心和连接，而不是完美。",
                                "不要照着课本教学、讲语法或不停纠错。只有当错误影响理解时才去纠正。"
                            ],
                            footnote: "想要系统课程或密集纠错的会员，可以去上语言课。Lingping 不一样。"
                        }
                    },
                    cta: "发起活动"
                }
            }
        },
        th: {
            NUDGE: {
                noMatch: "ไม่มีกิจกรรมที่ตรงกับตัวกรอง",
                title: "มีอะไรอยากทำหรืออยากคุยไหม?",
                text: "ชวนคนอื่นมาร่วมกัน! ไม่ใช่แค่เรื่องภาษา จัดอะไรก็ได้ เมื่อไหร่ก็ได้!",
                moreLabel: "ไอเดียเพิ่มเติม",
                fewerLabel: "ย่อลง",
                chips: [{ label: "สนทนา" }, { label: "วิ่ง" }, { label: "คืนเล่นเกม" }, { label: "เดินเล่นในสวน" },
                    { label: "ปาร์ตี้คืนวันศุกร์" }, { label: "ชมรมหนังสือ" }, { label: "อย่างอื่น" }]
            },
            START: {
                pageTitle: "จัดกิจกรรม",
                backLabel: "กลับ",
                h1: "จัดอะไรก็ได้ เมื่อไหร่ก็ได้",
                intro: "ไม่จำเป็นต้องเกี่ยวกับภาษา ถ้าทำให้ผู้คนได้มาเจอกัน ก็คือกิจกรรมของ Lingping เลือกเวลาและสถานที่ แล้วสมาชิกที่ว่างจะมาร่วมเอง",
                somethingElse: "อย่างอื่น",
                moreCategories: "หมวดหมู่เพิ่มเติม",
                loadError: "โหลดหมวดหมู่ไม่สำเร็จ แต่คุณยังจัดกิจกรรมได้:",
                loadErrorLink: "เปิดฟอร์มกิจกรรม",
                links: [{ label: "จัดอะไรได้บ้าง?" }, { label: "เคล็ดลับจัดกิจกรรมให้ดี" }]
            },
            GUIDE: {
                pageTitle: "คู่มือการจัดกิจกรรม",
                backLabel: "กลับ",
                tabs: { rules: "จัดอะไรได้บ้าง?", tips: "เคล็ดลับ" },
                rules: {
                    h2: "ถ้าทำให้ผู้คนได้มาเจอกัน ก็จัดได้เลย",
                    intro: "วันไหน เวลาไหน ที่ไหนก็ได้ ไม่จำเป็นต้องตรงกับตารางของ Lingping",
                    allowedTitle: "จัดได้เลย",
                    allowed: ["แลกเปลี่ยนภาษาและสนทนา", "แบ่งปันวัฒนธรรม", "ชมรมหนังสือและวงถกเรื่องใหญ่", "แบ่งปันความรู้", "เดินเล่น เดินป่า และกีฬา", "มื้ออาหารและงานอดิเรก", "เวิร์กช็อปงานสร้างสรรค์"],
                    callout: {
                        title: "คุยได้ทุกหัวข้อ",
                        text: "การเมือง ศาสนา ความสัมพันธ์ เรื่องเงิน หัวข้อเหล่านี้คุยกันได้สนุก สิ่งที่ไม่โอเคคือการหาเสียง ชักชวน ขายของ หรือพฤติกรรมที่ไม่ปลอดภัย"
                    },
                    notAllowedTitle: "ไม่อนุญาต",
                    notAllowed: [
                        { title: "การพนันและการเดิมพัน", text: "คาสิโน โป๊กเกอร์ การเดิมพัน หรือเกมที่เล่นเอาเงิน" },
                        { title: "ความบันเทิงสำหรับผู้ใหญ่", text: "สตริปคลับ การแสดงที่มีเนื้อหาทางเพศอย่างโจ่งแจ้ง หรือกิจกรรมทางเพศ" },
                        { title: "การขายและการชักชวน", text: "การขายของ ธุรกิจเครือข่าย (MLM) การชวนทำธุรกิจ คอร์สหรือบริการที่ต้องจ่ายเงิน" },
                        { title: "กิจกรรมผิดกฎหมายหรือไม่ปลอดภัย", text: "ทุกอย่างที่ผิดกฎหมายหรือมีความเสี่ยง เช่น การผาดโผนอันตรายหรือสารเสพติด" },
                        { title: "การรณรงค์ทางการเมืองหรือศาสนา", text: "การชุมนุม การหาสมาชิกพรรค หรือการกดดันให้ผู้อื่นเชื่อตาม" },
                        { title: "ความเกลียดชัง การคุกคาม และการเลือกปฏิบัติ", text: "การมุ่งร้ายหรือกลั่นแกล้งใคร หรือทำให้ผู้อื่นรู้สึกไม่เป็นที่ต้อนรับ" },
                        { title: "การระดมทุนและการชวนลงทุน", text: "การเรี่ยไรเงินบริจาคหรือชวนลงทุนโดยไม่ได้รับอนุญาต" },
                        { title: "การละเมิดความเป็นส่วนตัว", text: "การบันทึกเสียง ถ่ายรูป หรือเผยแพร่ข้อมูลส่วนตัวโดยไม่ได้รับความยินยอม" },
                        { title: "กิจกรรมโปรโมตแบรนด์", text: "กิจกรรมที่มุ่งโปรโมตธุรกิจ สินค้า หรือวาระส่วนตัวเป็นหลัก" }
                    ],
                    smallPrint: "Lingping อาจปฏิเสธหรือยุติกิจกรรมที่ไม่สอดคล้องกับคุณค่าของชุมชน ทำให้สมาชิกรู้สึกอึดอัด หรือเป็นอันตรายต่อความปลอดภัยและความเป็นอยู่ที่ดีของสมาชิก",
                    askPrefix: "ไม่แน่ใจ?",
                    askLink: "ถามทีม Lingping"
                },
                tips: {
                    general: {
                        title: "จัดกิจกรรมให้ดี",
                        sub: "10 เคล็ดลับสำหรับทุกกิจกรรม",
                        items: [
                            { title: "เลือกสิ่งที่คุณสนใจจริงๆ", text: "ความตื่นเต้นของคุณจะส่งต่อถึงคนอื่น" },
                            { title: "เลือกจุดนัดพบที่หาง่าย", text: "ใกล้ BTS/MRT พร้อมปักหมุด และบอกว่า \"จะใส่หมวกสีเหลือง\"" },
                            { title: "บอกค่าใช้จ่ายให้ชัดตั้งแต่แรก", text: "ฟรี หรือ \"ประมาณ 150 บาท จ่ายหน้างาน\" ไม่มีเซอร์ไพรส์" },
                            { title: "โพสต์ล่วงหน้าสักหน่อย", text: "ล่วงหน้า 2–3 วัน ให้ทุกคนมีเวลาวางแผน" },
                            { title: "กลุ่มเล็กกำลังดี", text: "4–8 คนกำลังพอดี" },
                            { title: "ทำให้ทุกคนรู้สึกเป็นที่ต้อนรับ", text: "แนะนำตัวสั้นๆ ตอนเริ่ม และชวนคนใหม่เข้าวง" },
                            { title: "ให้ทุกคนได้มีโอกาสพูด", text: "เว้นที่ให้สมาชิกที่เงียบกว่า" },
                            { title: "เริ่มและจบตรงเวลา", text: "เคารพเวลาของทุกคน" },
                            { title: "แจ้งให้ชัดเจนถ้าแผนเปลี่ยน", text: "อัปเดตกิจกรรมให้เร็วที่สุด" },
                            { title: "แชร์รูปหลังกิจกรรม", text: "โพสต์ลงฟีด เป็นคำเชิญที่ดีที่สุดสำหรับครั้งหน้า" }
                        ]
                    },
                    discussion: {
                        title: "เคล็ดลับเพิ่มเติมสำหรับวงสนทนา",
                        sub: "สำหรับกิจกรรมสนทนา",
                        intro: "สร้างพื้นที่อบอุ่นให้สมาชิกได้แบ่งปัน เรียนรู้ และสร้างความสัมพันธ์",
                        feelsLike: {
                            title: "วงที่ดีจะรู้สึกเหมือน…",
                            text: "นั่งคุยสบายๆ กับเพื่อน ได้ฟังว่าคนอื่นคิดอย่างไร",
                            chips: ["ทุกคนได้แบ่งปัน", "มุมมองใหม่ๆ", "บรรยากาศดี", "ได้เรียนรู้สิ่งใหม่"]
                        },
                        checklist: [
                            { title: "ต้อนรับทุกคนอย่างอบอุ่น", text: "ทำความรู้จักกัน: มาจากไหน และอะไรพาให้มาเมืองไทย แนะนำคนใหม่ให้รู้จักสมาชิกที่เคยมาแล้ว" },
                            { title: "ใช้ภาษาของกิจกรรมให้มากที่สุด", text: "ช่วยให้ทุกคนอินไปด้วยกัน ปรับความเร็วและคำศัพท์ให้เหมาะกับระดับของกลุ่ม" },
                            { title: "อยากรู้อยากเห็น: เป็นการคุย ไม่ใช่ถาม-ตอบ", text: "ถามต่อยอดและเจาะลึกเรื่องที่น่าสนใจ แทนที่จะข้ามจากคำถามหนึ่งไปอีกคำถาม" },
                            { title: "ให้ทุกคนได้ผลัดกันพูด", text: "เว้นที่ให้คนที่เงียบกว่า และค่อยๆ สร้างสมดุลกับคนที่พูดเยอะ" },
                            { title: "คุยกันวงเดียว", text: "ไม่แยกคุยกันเอง ทุกคนจะได้ตามทัน" },
                            { title: "ปล่อยให้ไหลไป แต่อย่าออกนอกเรื่อง", text: "ถ้ามีเรื่องนอกประเด็น (เช่น คำถามไวยากรณ์ละเอียดๆ) เก็บไว้คุยตอนท้าย" },
                            { title: "ให้เกียรติกันและกัน", text: "ช่วยจัดการเวลามีคนพูดแทรก ให้ทุกคนได้พูด ถ้ามีใครทำผิดแนวปฏิบัติของชุมชน เตือนอย่างสุภาพ แล้วแจ้ง Pim หลังจบกิจกรรม Lingping จะติดตามต่อ" },
                            { title: "ความสัมพันธ์สำคัญกว่าความสมบูรณ์แบบ", text: "เน้นแบ่งปันวัฒนธรรมและทำความรู้จักกัน การพูดผิดเป็นเรื่องปกติ" }
                        ],
                        notALesson: {
                            title: "ไม่ใช่คลาสเรียนภาษา",
                            paragraphs: [
                                "Lingping คือการแลกเปลี่ยนวัฒนธรรม ไม่ใช่โรงเรียนสอนภาษา เราให้ความสำคัญกับการสื่อสาร ความอยากรู้ และความสัมพันธ์ ไม่ใช่ความสมบูรณ์แบบ",
                                "ไม่ต้องสอนตามตำรา บรรยายไวยากรณ์ หรือแก้คำผิดตลอดเวลา แก้เฉพาะเมื่อความผิดพลาดทำให้เข้าใจกันไม่ได้"
                            ],
                            footnote: "สมาชิกที่อยากเรียนแบบมีโครงสร้างหรืออยากให้แก้คำผิดอย่างเข้มข้น สามารถเรียนคลาสภาษาได้ Lingping แตกต่างออกไป"
                        }
                    },
                    cta: "จัดกิจกรรม"
                }
            }
        }
    };

    // Site language from translate.js (stored in localStorage as lp_lang); English otherwise.
    function siteLang() {
        try {
            if (window.getSiteLanguage) return window.getSiteLanguage();
            return localStorage.getItem("lp_lang") || "en";
        } catch (e) {
            return "en";
        }
    }

    // English copy with the translated text laid over it, keeping everything else.
    function overlay(base, over) {
        if (over === undefined) return base;
        if (Array.isArray(base)) {
            return base.map((item, i) => overlay(item, Array.isArray(over) ? over[i] : undefined));
        }
        if (base && typeof base === "object") {
            const out = { ...base };
            Object.keys(over).forEach(k => { out[k] = overlay(base[k], over[k]); });
            return out;
        }
        return over;
    }

    const lang = I18N[siteLang()] || {};

    window.HostContent = {
        icon, categoryStyle, LINKS,
        lang: siteLang(),
        NUDGE: overlay(NUDGE, lang.NUDGE),
        START: overlay(START, lang.START),
        GUIDE: overlay(GUIDE, lang.GUIDE)
    };
})();
