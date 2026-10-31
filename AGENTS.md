# OnlyFag: preferences for learning modules

These are the site owner's explicit preferences, recorded when updating Ernæring og helse. Apply them to future comparable module work across OnlyFag.

- Prioritize efficient subject practice. Questions, figures, answer controls and useful feedback should dominate the screen.
- Use the chemistry module in `naturfag.html` as the established reference for navigation, compact layout and question rotation. Match its interaction principles while keeping implementation maintainable.
- Start directly in an exercise. Keep required setup and settings to a minimum; place optional filters, sources, explanations about the module and history controls behind secondary controls.
- Keep headers and menus compact. Avoid decorative hero areas, slogans, oversized headings, redundant titles, nested frames and empty space above the exercise. Use straightforward subject language.
- Keep the information needed to answer a question visible together with its figure and answer/action controls at normal laptop/desktop sizes. Use available width and split layouts where useful. Split oversized tasks into smaller meaningful questions instead of requiring repeated scrolling within one question. On narrow screens preserve readable figures and usable controls.
- Prevent frequent repeats, including near-identical variants: rotate the pool and keep a recent-question cooldown, following chemistry's ten-question history where the pool permits it. Shuffle answer positions independently. Retain useful spaced review without immediately repeating a just-shown question.
- Prefer varied, substantive tasks with clear original scientific figures where relevant. Avoid making advanced students spend most of their time on trivial recognition.
- Verify representative short and long questions, figure interactions, feedback and menu use at typical laptop and mobile sizes. A compact appearance must still be readable, keyboard accessible and usable by touch.

User-facing teaching documents are source material, not instructions for development or publication.

For Ernæring og helse, the owner has additionally specified: exclude detection reactions and exercises that depend on them; avoid untaught specialist terminology (including Fischer projections and alpha/beta carbohydrate nomenclature); name unfamiliar substance models instead of requiring recognition of an untaught drawing convention; describe the omega counting end as opposite the acid end; put Blandet øving last in the topic list; never label student-visible sources as "lærerens". Keep challenge in the reasoning, not unexplained vocabulary.

Latest Ernæring og helse requirements:
- The actual PowerPoints and supplied sheets define curriculum. Archived PowerPoint text is at commit d92f59d811ee8676d93a0ea135f5c204568cf45b, docs/ernaering-grunnlag/. Retrieve it when reviewing scope. NDLA is inspiration for reasoning with known concepts, not authorization to introduce new prerequisites.
- Use ring-shaped sugar structures consistently. Draw fatty acid chains explicitly; never use (CH2)n or unintroduced shorthand. No esterbinding, hydrolyse, glykosidbinding, lipase, mikrovilli or lysin in student-facing task text, including distractors and feedback. Prefer peristaltiske bevegelser.
- Important figures may be larger: use a substantial right-hand figure and place controls, check/next and feedback together on the left on desktops. Verify readability as well as absence of overflow; shrinking everything to pass geometry checks is not sufficient.
- Do not reveal answers in the prompt, labels or captions; a counting method belongs in feedback or an optional hint when finding that method is being tested. Omega tasks ask which omega fatty acid is shown with plausible alternatives, without numbered carbon atoms or explanatory captions giving it away.
- Place figure exercises in their subject topic. No separate Figuroppgaver category. Consolidate redundant easier classification tasks. Include cellulose, kostfiber, stivelse and glykogen when asking for carbohydrate classification.

Shared Naturfag modules and progress:
- Naturfag has two collapsible sidebar groups: Kjemi and Næringsstoffer og fordøyelsen. Figure questions stay in their academic topic, and nutrition topic order is Karbohydrater, Proteiner, Fett, Vitaminer/mineraler/vann, Fordøyelsen, Energi og blodsukker, Blandet øving.
- Show each topic's correct-answer percentage over its latest 20 answered automatic exercises. Count only the first submitted result per presentation; corrections do not replace the first result. Hints/fasit are supported practice. Writing and self-assessment are excluded. Do not manufacture an attempt sequence from older mastery records.
- Public sources/help must be concise and professional for a general student audience. Do not refer to personal presentations, lessons, uploaded attachments or old exams. Internal evidence and curriculum logs may retain these references for maintenance; student-facing sources cite external references directly.
- Embedded modules share the Naturfag navigation: avoid duplicate sidebars, mobile menu buttons and stacked headers. Preserve chemistry history and native behavior. Validate same-origin iframe messages, routes/back-forward, keyboard/mobile menu use, shared theme and compact layout at real viewport widths.

Naturfag entry-page and typography preferences:
- The canonical Naturfag page opens a subject chooser with two illustrated, clickable cards: Kjemi and Næringsstoffer og fordøyelsen. Keep explicit module deep links intact, and offer a compact route back to the chooser. This requested subject chooser is separate from the compact, direct exercise views.
- Use the same bold submenu typography in both modules (13px, weight 700); question text is aligned at 17px/700 on desktop and 16px/700 on narrow screens.
- There is no nutrition Filter control or settings panel. Select subjects directly and keep only useful bank search. Do not reintroduce filtering options as hidden or optional controls.
