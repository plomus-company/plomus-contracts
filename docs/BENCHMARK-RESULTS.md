# Benchmark Results

`scripts/summary-benchmarks.mjs`가 `contracts/benchmarks/`에서 생성합니다. 수정은 계약 데이터에서 하고 재생성하세요.

## Methodology

- **대상(targets)**: 실행 가능한 계약 = 스킬 · 커머스 워크플로 · gameops 에이전트/playbook · distribution preset. 각 타깃은 실재 계약(`kind`별 skills-catalog·commerce-workflows·gameops-agents·gameops-playbooks·distribution-presets)을 참조합니다.
- **measured**: 실제 모델 실행 측정값 (`tools/run-experiment.mjs`). 지연은 1회성 모델 로드를 제외한 추론 시간, 처리량은 출력토큰/평가시간, 비용은 모델 가격(로컬은 0). `accuracy`는 골드셋이 없어 미측정.
- **illustrative**: 결정론적 합성 시드 (`tools/generate-benchmarks.mjs`). 구조 시연/회귀 베이스라인용이며 실측이 아닙니다.

## Models

| modelId | vendor | status | context | in $/Mtok | out $/Mtok |
| --- | --- | --- | --- | --- | --- |
| `qwen-2.5-72b` | alibaba | balanced | 131072 | 0.4 | 0.4 |
| `qwen3.6-27b` | alibaba | balanced | 262144 | 0 | 0 |
| `qwen-2.5-0.5b` | alibaba | fast | 32768 | 0 | 0 |
| `claude-opus-4-7` | anthropic | frontier | 200000 | 15 | 75 |
| `claude-sonnet-4-6` | anthropic | balanced | 200000 | 3 | 15 |
| `claude-haiku-4-5` | anthropic | fast | 200000 | 1 | 5 |
| `deepseek-v3` | deepseek | balanced | 128000 | 0.27 | 1.1 |
| `gemini-2.5-pro` | google | frontier | 1000000 | 1.25 | 10 |
| `gemini-2.5-flash` | google | fast | 1000000 | 0.3 | 2.5 |
| `llama-3.3-70b` | meta | balanced | 128000 | 0.6 | 0.6 |
| `mixtral-8x22b` | mistral | fast | 64000 | 2 | 6 |
| `gpt-4o` | openai | frontier | 128000 | 2.5 | 10 |
| `gpt-4o-mini` | openai | fast | 128000 | 0.15 | 0.6 |
| `o3-mini` | openai | balanced | 200000 | 1.1 | 4.4 |

_가격은 indicative(참고용)이며 로컬 모델은 0._

## Measured model comparison

동일 타깃을 여러 모델로 실행한 도메인 롤업 비교입니다.

| domain | model | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | `qwen-2.5-0.5b` | 21 | 730.75 | 496.32 | 236.48 | 100 |
| commerce | `qwen3.6-27b` | 21 | 5036.78 | 50.45 | 236.29 | 100 |
| distribution | `qwen-2.5-0.5b` | 1 | 3870.16 | 72.25 | 256 | 100 |
| distribution | `qwen3.6-27b` | 1 | 4936.12 | 55.88 | 256 | 100 |
| gameops | `qwen-2.5-0.5b` | 6 | 2214.92 | 70.55 | 134.5 | 100 |
| gameops | `qwen3.6-27b` | 6 | 3942.25 | 51.61 | 184.5 | 100 |
| skills | `qwen-2.5-0.5b` | 86 | 538.51 | 522.57 | 187.35 | 100 |
| skills | `qwen3.6-27b` | 86 | 3501.13 | 20.69 | 65.49 | 100 |

_성공률은 비어 있지 않은 응답 비율(품질/정확도는 미측정)._

## Measured baseline — `qwen-2.5-0.5b`

Qwen2.5 0.5B (Ollama) · 측정 타깃 114개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | 21 | 730.75 | 496.32 | 99.57 | 236.48 | 100 |
| distribution | 1 | 3870.16 | 72.25 | 139 | 256 | 100 |
| gameops | 6 | 2214.92 | 70.55 | 102.5 | 134.5 | 100 |
| skills | 86 | 538.51 | 522.57 | 135.43 | 187.35 | 100 |

### Skills by category

| category | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- |
| commerce | 12 | 568.65 | 529.14 | 203.33 | 100 |
| documents | 3 | 716.78 | 491.37 | 238.67 | 100 |
| finance | 5 | 536.9 | 550.38 | 193.6 | 100 |
| food | 5 | 507.01 | 533.45 | 187.2 | 100 |
| government | 5 | 528.43 | 513.62 | 174 | 100 |
| health | 4 | 494.87 | 494.21 | 166 | 100 |
| legal | 5 | 507.92 | 530.63 | 175.2 | 100 |
| media | 6 | 595.15 | 503.79 | 201.5 | 100 |
| mobility | 6 | 535.24 | 532.03 | 191.33 | 100 |
| real-estate | 6 | 666.91 | 521.68 | 226.83 | 100 |
| sports | 5 | 567.61 | 564.17 | 214.8 | 100 |
| tooling | 3 | 246.83 | 478.3 | 75.33 | 100 |
| travel | 7 | 581.03 | 512.77 | 202.29 | 100 |
| utility | 11 | 403.03 | 531.33 | 138.18 | 100 |
| writing | 3 | 697.96 | 488.34 | 229.33 | 100 |

### All targets

| target | kind | group | 지연 p50(ms) | 출력tok | tps | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| `agent:cs` | agent | agent | 1164.1 | 73 | 77.54 | 100 |
| `agent:dashboard` | agent | agent | 1613.88 | 103 | 72.7 | 100 |
| `agent:incident` | agent | agent | 1021.2 | 55 | 65.84 | 100 |
| `agent:notice` | agent | agent | 1100.4 | 64 | 73.78 | 100 |
| `playbook:payment_missing_response_v1` | playbook | high | 4101.19 | 256 | 68.85 | 100 |
| `playbook:daily_ops_brief_v1` | playbook | low | 4288.75 | 256 | 64.61 | 100 |
| `preset:PLOMUS_DISTRIBUTION` | preset | preset | 3870.16 | 256 | 72.25 | 100 |
| `skill:bunjang-search` | skill | commerce | 648.77 | 256 | 613.66 | 100 |
| `skill:coupang-product-search` | skill | commerce | 685.65 | 256 | 562.94 | 100 |
| `skill:daangn-cars-search` | skill | commerce | 729.66 | 256 | 496.41 | 100 |
| `skill:daangn-jobs-search` | skill | commerce | 610.71 | 256 | 603.24 | 100 |
| `skill:daangn-used-goods-search` | skill | commerce | 283.83 | 96 | 506.26 | 100 |
| `skill:daiso-product-search` | skill | commerce | 695.03 | 256 | 545.22 | 100 |
| `skill:danawa-price-search` | skill | commerce | 401.18 | 150 | 535.78 | 100 |
| `skill:market-kurly-search` | skill | commerce | 298.16 | 90 | 465.97 | 100 |
| `skill:naver-shopping-search` | skill | commerce | 766.63 | 256 | 494.68 | 100 |
| `skill:ohou-today-deal` | skill | commerce | 791.36 | 256 | 481.3 | 100 |
| `skill:olive-young-search` | skill | commerce | 419.46 | 137 | 513.21 | 100 |
| `skill:used-car-price-search` | skill | commerce | 493.33 | 175 | 531.02 | 100 |
| `skill:hwp` | skill | documents | 645.06 | 256 | 574.98 | 100 |
| `skill:rhwp-advanced` | skill | documents | 823.63 | 256 | 457.09 | 100 |
| `skill:rhwp-edit` | skill | documents | 681.65 | 204 | 442.04 | 100 |
| `skill:daishin-report-search` | skill | finance | 734.24 | 256 | 492.98 | 100 |
| `skill:k-dart` | skill | finance | 615.64 | 256 | 606.6 | 100 |
| `skill:korean-jangbu-for` | skill | finance | 386.56 | 119 | 553.64 | 100 |
| `skill:korean-stock-search` | skill | finance | 233.04 | 81 | 558.98 | 100 |
| `skill:toss-securities` | skill | finance | 715.01 | 256 | 539.7 | 100 |
| `skill:blue-ribbon-nearby` | skill | food | 511.27 | 134 | 345.08 | 100 |
| `skill:catchtable-sniper` | skill | food | 519.1 | 218 | 607.35 | 100 |
| `skill:hola-poke-yeoksam` | skill | food | 642.87 | 256 | 562.89 | 100 |
| `skill:k-schoollunch-menu` | skill | food | 680.13 | 256 | 536.91 | 100 |
| `skill:kakao-bar-nearby` | skill | food | 181.69 | 72 | 615 | 100 |
| `skill:korean-scholarship-search` | skill | government | 784.54 | 256 | 508.66 | 100 |
| `skill:kosis-stats` | skill | government | 253.97 | 82 | 550.75 | 100 |
| `skill:kstartup-search` | skill | government | 316.25 | 109 | 540.83 | 100 |
| `skill:local-election-candidate-search` | skill | government | 533.61 | 167 | 470.04 | 100 |
| `skill:nts-business-registration` | skill | government | 753.78 | 256 | 497.83 | 100 |
| `skill:emergency-room-beds` | skill | health | 160.39 | 53 | 528.77 | 100 |
| `skill:gangnamunni-clinic-search` | skill | health | 685.65 | 256 | 528.26 | 100 |
| `skill:mfds-drug-safety` | skill | health | 515.9 | 163 | 468.05 | 100 |
| `skill:mfds-food-safety` | skill | health | 617.53 | 192 | 451.78 | 100 |
| `skill:corporate-registration-consulting` | skill | legal | 320.95 | 123 | 585.89 | 100 |
| `skill:iros-registry-automation` | skill | legal | 672.35 | 256 | 579.54 | 100 |
| `skill:korean-law-search` | skill | legal | 318.36 | 122 | 571.35 | 100 |
| `skill:korean-patent-search` | skill | legal | 387.52 | 119 | 478.01 | 100 |
| `skill:korean-privacy-terms` | skill | legal | 840.44 | 256 | 438.36 | 100 |
| `skill:geeknews-search` | skill | media | 705.2 | 236 | 482.74 | 100 |
| `skill:joseon-sillok-search` | skill | media | 189.54 | 71 | 600.75 | 100 |
| `skill:korean-cinema-search` | skill | media | 671.88 | 256 | 546.03 | 100 |
| `skill:naver-blog-research` | skill | media | 436.93 | 134 | 447.34 | 100 |
| `skill:naver-news-search` | skill | media | 796.87 | 256 | 461.1 | 100 |
| `skill:ticket-availability` | skill | media | 770.5 | 256 | 484.79 | 100 |
| `skill:cheap-gas-nearby` | skill | mobility | 183.51 | 71 | 616.76 | 100 |
| `skill:delivery-tracking` | skill | mobility | 654.72 | 256 | 536.07 | 100 |
| `skill:hipass-receipt` | skill | mobility | 617.42 | 256 | 591.94 | 100 |
| `skill:korean-transit-route` | skill | mobility | 757.84 | 256 | 496.17 | 100 |
| `skill:seoul-subway-arrival` | skill | mobility | 536.89 | 178 | 487.33 | 100 |
| `skill:subway-lost-property` | skill | mobility | 461.06 | 131 | 463.9 | 100 |
| `skill:court-auction-notice-search` | skill | real-estate | 610.08 | 256 | 615.88 | 100 |
| `skill:daangn-realty-search` | skill | real-estate | 358.26 | 122 | 504.92 | 100 |
| `skill:gongsijiga-search` | skill | real-estate | 785.57 | 256 | 541.83 | 100 |
| `skill:lh-notice-search` | skill | real-estate | 787.59 | 256 | 462.87 | 100 |
| `skill:real-estate-search` | skill | real-estate | 625.21 | 215 | 538.07 | 100 |
| `skill:sh-notice-search` | skill | real-estate | 834.77 | 256 | 466.52 | 100 |
| `skill:kbl-results` | skill | sports | 635.55 | 232 | 536.96 | 100 |
| `skill:kbo-results` | skill | sports | 658.1 | 256 | 580.11 | 100 |
| `skill:kleague-results` | skill | sports | 639.86 | 256 | 596.75 | 100 |
| `skill:korean-marathon-schedule` | skill | sports | 500.42 | 208 | 611.54 | 100 |
| `skill:lck-analytics` | skill | sports | 404.14 | 122 | 495.5 | 100 |
| `skill:k-skill-cleaner` | skill | tooling | 349.82 | 114 | 491.47 | 100 |
| `skill:k-skill-setup` | skill | tooling | 208.56 | 50 | 365.57 | 100 |
| `skill:kakaotalk-mac` | skill | tooling | 182.11 | 62 | 577.86 | 100 |
| `skill:express-bus-booking` | skill | travel | 693.61 | 256 | 512.68 | 100 |
| `skill:flight-ticket-search` | skill | travel | 429.36 | 141 | 497.89 | 100 |
| `skill:foresttrip-vacancy` | skill | travel | 479.44 | 158 | 497.9 | 100 |
| `skill:intercity-bus-booking` | skill | travel | 602.84 | 245 | 591.21 | 100 |
| `skill:ktx-booking` | skill | travel | 597.16 | 215 | 536.09 | 100 |
| `skill:myrealtrip-search` | skill | travel | 792.83 | 256 | 465.11 | 100 |
| `skill:srt-booking` | skill | travel | 471.95 | 145 | 488.54 | 100 |
| `skill:donation-place-search` | skill | utility | 394.02 | 138 | 490.91 | 100 |
| `skill:fine-dust-location` | skill | utility | 262.16 | 82 | 544.05 | 100 |
| `skill:han-river-water-level` | skill | utility | 659.27 | 256 | 551.12 | 100 |
| `skill:household-waste-info` | skill | utility | 164.73 | 66 | 639.97 | 100 |
| `skill:korea-weather` | skill | utility | 200.4 | 77 | 578.92 | 100 |
| `skill:library-book-search` | skill | utility | 464.67 | 152 | 499.74 | 100 |
| `skill:lotto-results` | skill | utility | 623.35 | 196 | 468.83 | 100 |
| `skill:parking-lot-search` | skill | utility | 252.9 | 82 | 535.3 | 100 |
| `skill:public-restroom-nearby` | skill | utility | 700 | 256 | 538.18 | 100 |
| `skill:seoul-density` | skill | utility | 539.68 | 162 | 449.35 | 100 |
| `skill:zipcode-search` | skill | utility | 172.1 | 53 | 548.27 | 100 |
| `skill:korean-character-count` | skill | writing | 668.32 | 256 | 575.73 | 100 |
| `skill:korean-slang-writing` | skill | writing | 779.89 | 256 | 470.86 | 100 |
| `skill:korean-spell-check` | skill | writing | 645.67 | 176 | 418.43 | 100 |
| `workflow:app-release-review` | workflow | APP_RELEASE | 747.86 | 256 | 515.2 | 100 |
| `workflow:app-store-review` | workflow | APP_STORE | 798.3 | 256 | 518.71 | 100 |
| `workflow:apply-change-plan` | workflow | CHANGE_PLAN | 712.46 | 231 | 505.64 | 100 |
| `workflow:claim-created` | workflow | CLAIM | 776.55 | 256 | 527.81 | 100 |
| `workflow:contract-review` | workflow | CONTRACT | 718.49 | 228 | 502.59 | 100 |
| `workflow:daily-briefing` | workflow | DAILY_BRIEFING | 684.92 | 256 | 562.1 | 100 |
| `workflow:finance-review` | workflow | FINANCE | 729.28 | 256 | 549.36 | 100 |
| `workflow:general-company-review` | workflow | GENERAL_COMPANY | 765.09 | 256 | 505.11 | 100 |
| `workflow:hr-review` | workflow | HR | 876.31 | 256 | 442.34 | 100 |
| `workflow:inventory-review` | workflow | INVENTORY | 757.46 | 233 | 470.27 | 100 |
| `workflow:stock-low` | workflow | INVENTORY | 790.45 | 256 | 490.09 | 100 |
| `workflow:legal-policy-review` | workflow | LEGAL_POLICY | 332.63 | 113 | 559.56 | 100 |
| `workflow:operations-review` | workflow | OPERATIONS | 729.4 | 233 | 483.03 | 100 |
| `workflow:order-delay-review` | workflow | ORDER_DELAY | 662.04 | 199 | 466.36 | 100 |
| `workflow:partner-review` | workflow | PARTNER | 785.83 | 256 | 479.96 | 100 |
| `workflow:product-review` | workflow | PRODUCT | 484.87 | 145 | 443.92 | 100 |
| `workflow:recurring-review` | workflow | RECURRING | 758.2 | 256 | 504.51 | 100 |
| `workflow:settlement-check` | workflow | SETTLEMENT | 844.44 | 256 | 451.11 | 100 |
| `workflow:si-project-review` | workflow | SI_PROJECT | 759.39 | 256 | 490.02 | 100 |
| `workflow:task-approved` | workflow | TASK | 782.84 | 256 | 486.77 | 100 |
| `workflow:commerce-review` | workflow | WORKSPACE | 848.95 | 256 | 468.16 | 100 |

## Measured baseline — `qwen3.6-27b`

Qwen3.6 27B (Ollama Q4_K_M) · 측정 타깃 114개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | 21 | 5036.78 | 50.45 | 59.9 | 236.29 | 100 |
| distribution | 1 | 4936.12 | 55.88 | 99 | 256 | 100 |
| gameops | 6 | 3942.25 | 51.61 | 75.67 | 184.5 | 100 |
| skills | 86 | 3501.13 | 20.69 | 99.98 | 65.49 | 100 |

### Skills by category

| category | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- |
| commerce | 12 | 3179.95 | 20.64 | 60.25 | 100 |
| documents | 3 | 4596.72 | 19.74 | 84.67 | 100 |
| finance | 5 | 3798.3 | 20.36 | 71.8 | 100 |
| food | 5 | 3206.9 | 19.52 | 56.6 | 100 |
| government | 5 | 3551.14 | 20.5 | 67 | 100 |
| health | 4 | 3155.59 | 19.96 | 56.75 | 100 |
| legal | 5 | 3780.15 | 20.48 | 71.4 | 100 |
| media | 6 | 3409.02 | 20.34 | 63.17 | 100 |
| mobility | 6 | 3717.01 | 19.7 | 67.67 | 100 |
| real-estate | 6 | 3987.35 | 20.59 | 76.17 | 100 |
| sports | 5 | 3278.66 | 20.49 | 61.4 | 100 |
| tooling | 3 | 3449.04 | 20.54 | 62.67 | 100 |
| travel | 7 | 4040.61 | 20.04 | 75.57 | 100 |
| utility | 11 | 3234.76 | 20.29 | 60 | 100 |
| writing | 3 | 2518.48 | 32.27 | 56 | 100 |

### All targets

| target | kind | group | 지연 p50(ms) | 출력tok | tps | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| `agent:cs` | agent | agent | 4862.68 | 256 | 55.91 | 100 |
| `agent:dashboard` | agent | agent | 5477.6 | 256 | 49.71 | 100 |
| `agent:incident` | agent | agent | 1073.99 | 46 | 51.18 | 100 |
| `agent:notice` | agent | agent | 1390.43 | 56 | 49.96 | 100 |
| `playbook:payment_missing_response_v1` | playbook | high | 6081.68 | 256 | 47.87 | 100 |
| `playbook:daily_ops_brief_v1` | playbook | low | 4767.11 | 237 | 55.01 | 100 |
| `preset:PLOMUS_DISTRIBUTION` | preset | preset | 4936.12 | 256 | 55.88 | 100 |
| `skill:bunjang-search` | skill | commerce | 2965.2 | 57 | 21.13 | 100 |
| `skill:coupang-product-search` | skill | commerce | 4411.73 | 87 | 21.22 | 100 |
| `skill:daangn-cars-search` | skill | commerce | 2964.38 | 57 | 21.25 | 100 |
| `skill:daangn-jobs-search` | skill | commerce | 2603.46 | 49 | 20.63 | 100 |
| `skill:daangn-used-goods-search` | skill | commerce | 2573.84 | 48 | 20.69 | 100 |
| `skill:daiso-product-search` | skill | commerce | 3005.23 | 56 | 20.83 | 100 |
| `skill:danawa-price-search` | skill | commerce | 4019.2 | 77 | 20.26 | 100 |
| `skill:market-kurly-search` | skill | commerce | 2954.14 | 55 | 20.55 | 100 |
| `skill:naver-shopping-search` | skill | commerce | 3411.46 | 63 | 20.25 | 100 |
| `skill:ohou-today-deal` | skill | commerce | 3084.89 | 58 | 20.37 | 100 |
| `skill:olive-young-search` | skill | commerce | 3140.94 | 60 | 20.5 | 100 |
| `skill:used-car-price-search` | skill | commerce | 3024.93 | 56 | 20.01 | 100 |
| `skill:hwp` | skill | documents | 4472.06 | 83 | 20.17 | 100 |
| `skill:rhwp-advanced` | skill | documents | 4805.67 | 87 | 19.38 | 100 |
| `skill:rhwp-edit` | skill | documents | 4512.43 | 84 | 19.67 | 100 |
| `skill:daishin-report-search` | skill | finance | 3511.76 | 67 | 20.39 | 100 |
| `skill:k-dart` | skill | finance | 4715.61 | 90 | 20.36 | 100 |
| `skill:korean-jangbu-for` | skill | finance | 3525.09 | 65 | 20.43 | 100 |
| `skill:korean-stock-search` | skill | finance | 4683.59 | 90 | 20.47 | 100 |
| `skill:toss-securities` | skill | finance | 2555.45 | 47 | 20.15 | 100 |
| `skill:blue-ribbon-nearby` | skill | food | 2366.3 | 41 | 20.07 | 100 |
| `skill:catchtable-sniper` | skill | food | 3478.73 | 49 | 15.95 | 100 |
| `skill:hola-poke-yeoksam` | skill | food | 3601.35 | 69 | 20.4 | 100 |
| `skill:k-schoollunch-menu` | skill | food | 3791.95 | 72 | 20.5 | 100 |
| `skill:kakao-bar-nearby` | skill | food | 2796.17 | 52 | 20.69 | 100 |
| `skill:korean-scholarship-search` | skill | government | 3570.39 | 68 | 20.63 | 100 |
| `skill:kosis-stats` | skill | government | 3272.19 | 60 | 20.51 | 100 |
| `skill:kstartup-search` | skill | government | 4516.1 | 88 | 20.61 | 100 |
| `skill:local-election-candidate-search` | skill | government | 3381.91 | 64 | 20.66 | 100 |
| `skill:nts-business-registration` | skill | government | 3015.12 | 55 | 20.1 | 100 |
| `skill:emergency-room-beds` | skill | health | 3462.74 | 56 | 17.76 | 100 |
| `skill:gangnamunni-clinic-search` | skill | health | 2995.08 | 57 | 20.95 | 100 |
| `skill:mfds-drug-safety` | skill | health | 2982.48 | 57 | 20.56 | 100 |
| `skill:mfds-food-safety` | skill | health | 3182.08 | 57 | 20.57 | 100 |
| `skill:corporate-registration-consulting` | skill | legal | 3436.33 | 66 | 21.62 | 100 |
| `skill:iros-registry-automation` | skill | legal | 4669.25 | 89 | 20.16 | 100 |
| `skill:korean-law-search` | skill | legal | 2617.69 | 49 | 20.39 | 100 |
| `skill:korean-patent-search` | skill | legal | 2779.83 | 51 | 19.9 | 100 |
| `skill:korean-privacy-terms` | skill | legal | 5397.64 | 102 | 20.31 | 100 |
| `skill:geeknews-search` | skill | media | 2530.67 | 48 | 20.66 | 100 |
| `skill:joseon-sillok-search` | skill | media | 3353.74 | 61 | 20.15 | 100 |
| `skill:korean-cinema-search` | skill | media | 3521.3 | 67 | 20.64 | 100 |
| `skill:naver-blog-research` | skill | media | 3214.42 | 58 | 20.55 | 100 |
| `skill:naver-news-search` | skill | media | 4163.17 | 79 | 20.45 | 100 |
| `skill:ticket-availability` | skill | media | 3670.83 | 66 | 19.6 | 100 |
| `skill:cheap-gas-nearby` | skill | mobility | 2841.81 | 46 | 18.22 | 100 |
| `skill:delivery-tracking` | skill | mobility | 3536.27 | 65 | 19.9 | 100 |
| `skill:hipass-receipt` | skill | mobility | 3027.36 | 54 | 20.25 | 100 |
| `skill:korean-transit-route` | skill | mobility | 3541.4 | 67 | 20.47 | 100 |
| `skill:seoul-subway-arrival` | skill | mobility | 3463.79 | 62 | 19.43 | 100 |
| `skill:subway-lost-property` | skill | mobility | 5891.43 | 112 | 19.93 | 100 |
| `skill:court-auction-notice-search` | skill | real-estate | 4060.02 | 80 | 21.4 | 100 |
| `skill:daangn-realty-search` | skill | real-estate | 4357.38 | 85 | 20.89 | 100 |
| `skill:gongsijiga-search` | skill | real-estate | 2486.59 | 47 | 20.69 | 100 |
| `skill:lh-notice-search` | skill | real-estate | 3392.02 | 65 | 20.64 | 100 |
| `skill:real-estate-search` | skill | real-estate | 4852.95 | 91 | 19.95 | 100 |
| `skill:sh-notice-search` | skill | real-estate | 4775.15 | 89 | 19.94 | 100 |
| `skill:kbl-results` | skill | sports | 2535.76 | 48 | 20.61 | 100 |
| `skill:kbo-results` | skill | sports | 2715.93 | 50 | 20.42 | 100 |
| `skill:kleague-results` | skill | sports | 2750.29 | 49 | 20.67 | 100 |
| `skill:korean-marathon-schedule` | skill | sports | 4304.79 | 82 | 20.18 | 100 |
| `skill:lck-analytics` | skill | sports | 4086.53 | 78 | 20.55 | 100 |
| `skill:k-skill-cleaner` | skill | tooling | 5019.48 | 96 | 20.36 | 100 |
| `skill:k-skill-setup` | skill | tooling | 2650.69 | 48 | 20.73 | 100 |
| `skill:kakaotalk-mac` | skill | tooling | 2676.96 | 44 | 20.53 | 100 |
| `skill:express-bus-booking` | skill | travel | 4978.2 | 90 | 19.26 | 100 |
| `skill:flight-ticket-search` | skill | travel | 2713.35 | 49 | 19.81 | 100 |
| `skill:foresttrip-vacancy` | skill | travel | 3510.33 | 66 | 20.15 | 100 |
| `skill:intercity-bus-booking` | skill | travel | 4002.46 | 77 | 20.47 | 100 |
| `skill:ktx-booking` | skill | travel | 4843.34 | 93 | 20.48 | 100 |
| `skill:myrealtrip-search` | skill | travel | 3664.39 | 68 | 20.18 | 100 |
| `skill:srt-booking` | skill | travel | 4572.18 | 86 | 19.91 | 100 |
| `skill:donation-place-search` | skill | utility | 3564.98 | 68 | 20.29 | 100 |
| `skill:fine-dust-location` | skill | utility | 3052.7 | 57 | 20.01 | 100 |
| `skill:han-river-water-level` | skill | utility | 2776.42 | 52 | 20.22 | 100 |
| `skill:household-waste-info` | skill | utility | 3775.02 | 65 | 20.17 | 100 |
| `skill:korea-weather` | skill | utility | 2927.91 | 54 | 20.5 | 100 |
| `skill:library-book-search` | skill | utility | 4220.11 | 81 | 20.49 | 100 |
| `skill:lotto-results` | skill | utility | 3310.65 | 62 | 20.44 | 100 |
| `skill:parking-lot-search` | skill | utility | 2633.55 | 49 | 20.65 | 100 |
| `skill:public-restroom-nearby` | skill | utility | 2559.91 | 47 | 20.52 | 100 |
| `skill:seoul-density` | skill | utility | 3674.89 | 67 | 19.59 | 100 |
| `skill:zipcode-search` | skill | utility | 3086.19 | 58 | 20.29 | 100 |
| `skill:korean-character-count` | skill | writing | 2523.39 | 48 | 20.75 | 100 |
| `skill:korean-slang-writing` | skill | writing | 3662.02 | 65 | 20.24 | 100 |
| `skill:korean-spell-check` | skill | writing | 1370.03 | 55 | 55.82 | 100 |
| `workflow:app-release-review` | workflow | APP_RELEASE | 5528.24 | 256 | 50.5 | 100 |
| `workflow:app-store-review` | workflow | APP_STORE | 5412.38 | 256 | 50.25 | 100 |
| `workflow:apply-change-plan` | workflow | CHANGE_PLAN | 5506.2 | 256 | 50.44 | 100 |
| `workflow:claim-created` | workflow | CLAIM | 4229.64 | 201 | 50.49 | 100 |
| `workflow:contract-review` | workflow | CONTRACT | 4963.54 | 233 | 49.9 | 100 |
| `workflow:daily-briefing` | workflow | DAILY_BRIEFING | 4527.19 | 207 | 50.38 | 100 |
| `workflow:finance-review` | workflow | FINANCE | 5105.43 | 244 | 50.44 | 100 |
| `workflow:general-company-review` | workflow | GENERAL_COMPANY | 5026.67 | 236 | 50.23 | 100 |
| `workflow:hr-review` | workflow | HR | 5376.65 | 239 | 48.59 | 100 |
| `workflow:inventory-review` | workflow | INVENTORY | 5501.18 | 256 | 50.59 | 100 |
| `workflow:stock-low` | workflow | INVENTORY | 4794.29 | 217 | 50.37 | 100 |
| `workflow:legal-policy-review` | workflow | LEGAL_POLICY | 5318.2 | 256 | 50.69 | 100 |
| `workflow:operations-review` | workflow | OPERATIONS | 4662.28 | 224 | 50.75 | 100 |
| `workflow:order-delay-review` | workflow | ORDER_DELAY | 4354.54 | 226 | 55.85 | 100 |
| `workflow:partner-review` | workflow | PARTNER | 4600.6 | 218 | 50.62 | 100 |
| `workflow:product-review` | workflow | PRODUCT | 4975.18 | 215 | 47.9 | 100 |
| `workflow:recurring-review` | workflow | RECURRING | 4511.88 | 215 | 50.29 | 100 |
| `workflow:settlement-check` | workflow | SETTLEMENT | 5054.26 | 239 | 49.98 | 100 |
| `workflow:si-project-review` | workflow | SI_PROJECT | 5453.92 | 256 | 50.87 | 100 |
| `workflow:task-approved` | workflow | TASK | 5520.72 | 256 | 49.95 | 100 |
| `workflow:commerce-review` | workflow | WORKSPACE | 5349.38 | 256 | 50.45 | 100 |

## Illustrative leaderboard (synthetic seed)

_합성 시드 — 절대 비교가 아닌 구조/회귀 참조용._

### commerce

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.14071 | 20557.24 | 90.13 | 98.22 |
| `gpt-4o` | 0.02003 | 14203.19 | 86.23 | 97.19 |
| `gemini-2.5-pro` | 0.01796 | 14465.24 | 85.11 | 96.42 |
| `deepseek-v3` | 0.00224 | 19135.38 | 81.46 | 95.29 |

### distribution

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.12829 | 21994 | 91.2 | 97.7 |
| `gpt-4o` | 0.01087 | 6656 | 88 | 97.5 |
| `gemini-2.5-pro` | 0.01453 | 12850 | 86.8 | 96.3 |
| `deepseek-v3` | 0.00166 | 13357 | 80.5 | 95 |

### gameops

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.11097 | 16794.5 | 89.8 | 98.13 |
| `gpt-4o` | 0.01772 | 12296.33 | 86.2 | 97.53 |
| `gemini-2.5-pro` | 0.01545 | 12311.67 | 85.53 | 96.03 |
| `deepseek-v3` | 0.00179 | 15176 | 81.23 | 95.57 |

### skills

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.10417 | 15478.23 | 90.01 | 98.24 |
| `gpt-4o` | 0.01513 | 10822.59 | 85.87 | 97.29 |
| `gemini-2.5-pro` | 0.01247 | 9929.07 | 84.9 | 96.32 |
| `deepseek-v3` | 0.00163 | 13805.8 | 81.2 | 95.28 |

