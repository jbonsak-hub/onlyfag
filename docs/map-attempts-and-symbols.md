# Map questions and attempts

The shared click-map engine (Statle, counties, country regions, municipalities,
Oslo and physical geography) colours completed targets by attempts only:
first attempt green, second yellow, third orange, fourth or later red. A hint
appears after three wrong answers. Elapsed time is still displayed and remains
a leaderboard tie-breaker; it does not reduce the score or colour category.

New sessions send `scoring: "attempts-v1"`. The server excludes that marker
from normal board identity, preserving all existing scores. Previously started
sessions retain their original rules. Flag-only country rounds send
`mode: "flags"` and use a separate board. No database migration or score deletion
is required. Deploy the compatible Worker before publishing the frontend.

Country regions offer name-and-flag and flag-only prompts. In flag-only rounds,
the prompt and image alternative text do not reveal the country name. Other
normal map prompts show state flags or Norwegian county/municipal arms when the
area has such an emblem. Physical features and city variants retain text
prompts. Images keep their native proportions. Sources are recorded alongside
the symbol assets.

Validation: `node tests/geography-score-api.mjs` exercises legacy sessions,
existing board records, new attempt scoring and flag-only rankings.
`BROWSER_EXECUTABLE=/usr/bin/chromium node tests/map-attempts-symbols.cjs`
checks attempts, hint timing, local symbol loads, flag-only prompts, footer
layout and client session configurations on desktop and mobile. API requests
are intercepted and no public scores are submitted.
