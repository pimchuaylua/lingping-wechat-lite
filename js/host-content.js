/**
 * host-content.js
 * All static copy for "Host anything, anytime" in one place: the events-list
 * nudges (js/host-nudges.js), the start page (host-event.html) and the
 * hosting guide (hosting-guide.html). Edit wording here, not in the pages.
 *
 *   HostContent.icon(name, size)  → inline SVG string
 *   HostContent.categoryStyle(value) → { tint, ink, icon }
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

    window.HostContent = { icon, categoryStyle, LINKS, NUDGE, START, GUIDE };
})();
