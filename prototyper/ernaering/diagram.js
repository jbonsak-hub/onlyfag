// Original schematic for the OnlyFag nutrition practice module.
// Marker positions use the SVG viewBox coordinate system: 640 × 690.
export const organs = [
  { id: 'mouth', label: 'Munn', number: 1, x: 64, y: 102, side: 'left' },
  { id: 'esophagus', label: 'Spiserør', number: 2, x: 576, y: 208, side: 'right' },
  { id: 'stomach', label: 'Magesekk', number: 3, x: 576, y: 334, side: 'right' },
  { id: 'liver', label: 'Lever', number: 4, x: 64, y: 302, side: 'left' },
  { id: 'gallbladder', label: 'Galleblære', number: 5, x: 64, y: 365, side: 'left' },
  { id: 'pancreas', label: 'Bukspyttkjertel', number: 6, x: 576, y: 407, side: 'right' },
  { id: 'duodenum', label: 'Tolvfingertarm', number: 7, x: 64, y: 428, side: 'left' },
  { id: 'small', label: 'Tynntarm', number: 8, x: 576, y: 520, side: 'right' },
  { id: 'large', label: 'Tykktarm', number: 9, x: 64, y: 520, side: 'left' },
  { id: 'rectum', label: 'Endetarm', number: 10, x: 576, y: 620, side: 'right' },
];

export function digestiveSVG() {
  const lines = [
    ['mouth', 64, 102, 308, 102],
    ['esophagus', 576, 208, 329, 208],
    ['stomach', 576, 334, 403, 334],
    ['liver', 64, 302, 253, 302],
    ['gallbladder', 64, 365, 260, 365],
    ['pancreas', 576, 407, 377, 407],
    ['duodenum', 64, 428, 284, 428],
    ['small', 576, 520, 366, 520],
    ['large', 64, 520, 233, 520],
    ['rectum', 576, 620, 334, 620],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 690" class="digestive-svg" role="img" aria-labelledby="digestive-title digestive-desc">
    <title id="digestive-title">Fordøyelsessystemet med ti nummererte punkter</title>
    <desc id="digestive-desc">Skjematisk frontvisning av kroppens fordøyelsessystem. Lederlinjer forbinder hvert nummer med en del av systemet. Figuren viser plassering og sammenheng, ikke riktige størrelsesforhold.</desc>
    <defs>
      <filter id="organ-depth" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#51412e" flood-opacity=".07"/></filter>
    </defs>
    <g class="body-outline" fill="#f4f2ec" stroke="#e1e2da" stroke-width="1.5">
      <path d="M286 131 C270 119 263 98 267 74 C271 44 291 27 318 27 C347 27 366 45 370 73 C375 99 365 121 351 133 L352 156 C374 168 411 174 438 192 C457 205 467 223 473 250 L486 319 C488 330 480 336 471 330 L453 291 L453 457 C454 515 445 562 431 609 L424 655 L218 655 L211 609 C197 562 188 515 189 457 L189 291 L170 330 C163 336 153 330 156 319 L170 250 C175 223 185 205 204 192 C231 174 267 168 286 156Z"/>
    </g>
    <path d="M286 155 Q320 172 352 155" stroke="#e1e2da" stroke-width="1.5" fill="none"/>

    <g data-organ="mouth" class="organ organ-mouth" filter="url(#organ-depth)">
      <path d="M292 99 Q313 91 340 101 Q329 110 304 109Z" fill="#b77468" stroke="#986154" stroke-width="1.4"/>
      <path d="M298 99 Q319 99 335 102" fill="none" stroke="#fff7eb" stroke-width="3" stroke-linecap="round"/>
      <path d="M310 107 Q324 111 335 106" fill="none" stroke="#d89d8e" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g data-organ="esophagus" class="organ organ-esophagus">
      <path d="M337 106 C343 128 337 160 332 180 C327 205 327 244 337 268 L346 296" fill="none" stroke="#ad8769" stroke-width="15" stroke-linecap="round"/>
      <path d="M337 106 C343 128 337 160 332 180 C327 205 327 244 337 268 L346 296" fill="none" stroke="#d5b596" stroke-width="11" stroke-linecap="round"/>
    </g>
    <g data-organ="liver" class="organ organ-liver" filter="url(#organ-depth)">
      <path d="M213 305 C218 281 245 278 274 288 C297 295 328 291 351 309 C357 315 356 321 349 324 C323 322 308 331 292 345 C272 364 248 375 219 366 C205 353 207 327 213 305Z" fill="#b16d59" stroke="#925641" stroke-width="1.5"/>
      <path d="M216 318 C244 311 268 320 291 328 C307 314 329 309 349 316" fill="none" stroke="#8d513f" stroke-width="1.4" opacity=".58"/>
      <path d="M229 296 C245 289 258 293 267 296" fill="none" stroke="#d2967b" stroke-width="3" stroke-linecap="round" opacity=".75"/>
    </g>
    <g data-organ="stomach" class="organ organ-stomach" filter="url(#organ-depth)">
      <path d="M340 285 L352 282 C351 306 352 317 359 321 C373 305 398 307 412 321 C431 339 434 364 419 386 C407 405 384 415 361 407 C340 399 320 385 317 365 C314 349 322 338 339 334 C349 327 347 309 340 285Z" fill="#d5a879" stroke="#ae8157" stroke-width="1.5"/>
      <path d="M403 326 C422 346 418 374 398 386" fill="none" stroke="#ebc8a4" stroke-width="6" stroke-linecap="round" opacity=".75"/>
      <path d="M334 347 C345 341 353 341 361 343 M339 359 C351 352 361 354 369 357 M349 374 C362 368 375 371 382 376" fill="none" stroke="#b9885e" stroke-width="1.4" opacity=".6"/>
    </g>
    <g data-organ="gallbladder" class="organ organ-gallbladder">
      <path d="M250 354 C238 352 234 361 241 368 C249 375 264 374 272 367 L281 361 L276 356 C267 355 261 355 250 354Z" fill="#73965f" stroke="#526f43" stroke-width="1.4"/>

    </g>
    <g data-organ="duodenum" class="organ organ-duodenum">
      <path d="M332 381 C307 375 283 383 280 404 C276 426 286 446 307 449 C325 453 341 441 350 451" fill="none" stroke="#aa855e" stroke-width="17" stroke-linecap="round"/>
      <path d="M332 381 C307 375 283 383 280 404 C276 426 286 446 307 449 C325 453 341 441 350 451" fill="none" stroke="#dfbf93" stroke-width="13" stroke-linecap="round"/>
    </g>
    <g data-organ="pancreas" class="organ organ-pancreas" filter="url(#organ-depth)">
      <path d="M296 400 C299 392 306 391 312 396 C316 388 327 388 331 396 C337 389 348 393 352 399 C359 394 369 398 375 402 C382 399 392 405 399 407 C391 416 376 416 368 413 C359 420 349 416 342 414 C333 421 323 417 317 415 C308 420 297 416 296 409 C289 408 289 401 296 400Z" fill="#d0b567" stroke="#ab9049" stroke-width="1.4"/>
      <path d="M302 405 C326 407 357 404 385 408" stroke="#ac8e4c" stroke-width="1.3" fill="none" opacity=".65"/>
    </g>
    <!-- Secretory ducts join the inside of the duodenal loop, not the food route. -->
    <g class="secretory-ducts" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M276 361 C290 366 289 384 290 394 L291 410 L281 415" stroke="#4c773f" stroke-width="4"/>
      <path d="M385 408 C351 404 320 409 301 405 Q294 404 291 410 L281 415" stroke="#8b6a29" stroke-width="3"/>
      <path d="m285 409-6 7 9 1" stroke="#576e4c" stroke-width="2"/>
    </g>
    <g data-organ="small" class="organ organ-small">
      <path d="M350 451 C367 455 388 464 387 479 C386 493 359 490 340 483 C322 476 275 469 264 480 C250 494 286 501 307 497 C331 493 370 495 380 508 C392 524 358 531 336 520 C311 507 272 512 270 527 C267 540 300 542 320 534 C344 526 381 536 381 549 C380 563 349 564 326 552 C307 542 270 550 272 563 C274 576 311 575 327 569 C342 562 357 575 348 584 C335 597 302 584 285 587 C265 590 256 579 245 572" fill="none" stroke="#b5916b" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M350 451 C367 455 388 464 387 479 C386 493 359 490 340 483 C322 476 275 469 264 480 C250 494 286 501 307 497 C331 493 370 495 380 508 C392 524 358 531 336 520 C311 507 272 512 270 527 C267 540 300 542 320 534 C344 526 381 536 381 549 C380 563 349 564 326 552 C307 542 270 550 272 563 C274 576 311 575 327 569 C342 562 357 575 348 584 C335 597 302 584 285 587 C265 590 256 579 245 572" fill="none" stroke="#e0bd95" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g data-organ="large" class="organ organ-large">
      <path d="M238 580 C231 568 232 542 233 517 L233 467 C232 448 246 437 263 442 C291 451 342 444 372 439 C397 434 413 445 414 465 L414 552 C415 575 412 587 397 592 C381 598 354 580 344 596 L334 609" fill="none" stroke="#598881" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M238 580 C231 568 232 542 233 517 L233 467 C232 448 246 437 263 442 C291 451 342 444 372 439 C397 434 413 445 414 465 L414 552 C415 575 412 587 397 592 C381 598 354 580 344 596 L334 609" fill="none" stroke="#83aca3" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M228 565 Q236 570 245 565 M222 544 Q233 549 245 544 M221 521 Q233 526 246 521 M222 497 Q234 502 246 497 M222 473 Q234 478 246 473 M245 441 Q240 451 249 459 M267 435 Q262 447 267 454 M290 438 Q285 449 290 459 M315 436 Q310 448 315 458 M340 433 Q337 446 342 455 M367 428 Q363 441 368 451 M391 433 Q384 444 389 453 M403 462 Q414 467 426 462 M402 486 Q414 491 426 486 M402 510 Q414 515 426 510 M402 535 Q414 540 426 535 M401 560 Q412 565 424 560 M391 581 Q391 592 395 603 M368 579 Q363 590 366 601" fill="none" stroke="#5e8c84" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
      <path d="M233 590 Q227 606 233 615" fill="none" stroke="#6c9186" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g data-organ="rectum" class="organ organ-rectum">
      <path d="M334 609 L334 644" stroke="#598881" stroke-width="18" stroke-linecap="round"/>
      <path d="M334 609 L334 644" stroke="#83aca3" stroke-width="14" stroke-linecap="round"/>
    </g>

    <g class="map-leaders" fill="none" stroke="#a8b2a8" stroke-width="1.3">
      ${lines.map(([id, x, y, tx, ty]) => `<path data-leader="${id}" d="M${x < 320 ? x + 19 : x - 19} ${y}H${tx}"/><circle cx="${tx}" cy="${ty}" r="3" fill="#fffdf8" stroke="#66786d"/>`).join('')}
    </g>
    ${organs.map(o => `<g class="map-marker" data-marker="${o.id}" transform="translate(${o.x} ${o.y})"><circle r="18" fill="#fffdf8" stroke="#b5c4b7" stroke-width="1.5"/><text text-anchor="middle" dominant-baseline="central" fill="#345c4b" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${o.number}</text></g>`).join('')}
  </svg>`;
}

