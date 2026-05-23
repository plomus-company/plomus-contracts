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
| commerce | `qwen-2.5-0.5b` | 21 | 3552.93 | 74.71 | 243.24 | 100 |
| commerce | `qwen3.6-27b` | 21 | 5035.29 | 50.43 | 236.05 | 100 |
| distribution | `qwen-2.5-0.5b` | 1 | 1743.23 | 75.52 | 166 | 100 |
| distribution | `qwen3.6-27b` | 1 | 4962.79 | 55.81 | 256 | 100 |
| gameops | `qwen-2.5-0.5b` | 6 | 1721.3 | 79.18 | 126.83 | 100 |
| gameops | `qwen3.6-27b` | 6 | 3931 | 51.63 | 184.5 | 100 |
| skills | `qwen-2.5-0.5b` | 86 | 2601.22 | 76.07 | 183.27 | 100 |
| skills | `qwen3.6-27b` | 86 | 3468.79 | 21.16 | 65.47 | 100 |

_성공률은 비어 있지 않은 응답 비율(품질/정확도는 미측정)._

## Measured baseline — `qwen3.6-27b`

Qwen3.6 27B (Ollama Q4_K_M) · 측정 타깃 114개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | 21 | 5035.29 | 50.43 | 59.9 | 236.05 | 100 |
| distribution | 1 | 4962.79 | 55.81 | 99 | 256 | 100 |
| gameops | 6 | 3931 | 51.63 | 75.67 | 184.5 | 100 |
| skills | 86 | 3468.79 | 21.16 | 99.98 | 65.47 | 100 |

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
| media | 6 | 2975.34 | 26.61 | 62.83 | 100 |
| mobility | 6 | 3717.01 | 19.7 | 67.67 | 100 |
| real-estate | 6 | 3987.35 | 20.59 | 76.17 | 100 |
| sports | 5 | 3278.66 | 20.49 | 61.4 | 100 |
| tooling | 3 | 3449.04 | 20.54 | 62.67 | 100 |
| travel | 7 | 4040.61 | 20.04 | 75.57 | 100 |
| utility | 11 | 3234.76 | 20.29 | 60 | 100 |
| writing | 3 | 2458.81 | 33.44 | 56 | 100 |

### All targets

| target | kind | group | 지연 p50(ms) | 출력tok | tps | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| `agent:cs` | agent | agent | 4988.98 | 255 | 55.48 | 100 |
| `agent:dashboard` | agent | agent | 5477.6 | 256 | 49.71 | 100 |
| `agent:incident` | agent | agent | 1073.99 | 46 | 51.18 | 100 |
| `agent:notice` | agent | agent | 1390.43 | 56 | 49.96 | 100 |
| `playbook:payment_missing_response_v1` | playbook | high | 6081.68 | 256 | 47.87 | 100 |
| `playbook:daily_ops_brief_v1` | playbook | low | 4573.32 | 238 | 55.6 | 100 |
| `preset:PLOMUS_DISTRIBUTION` | preset | preset | 4962.79 | 256 | 55.81 | 100 |
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
| `skill:naver-news-search` | skill | media | 1561.11 | 77 | 58.03 | 100 |
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
| `skill:korean-spell-check` | skill | writing | 1191.02 | 55 | 59.32 | 100 |
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
| `workflow:order-delay-review` | workflow | ORDER_DELAY | 4323.31 | 221 | 55.32 | 100 |
| `workflow:partner-review` | workflow | PARTNER | 4600.6 | 218 | 50.62 | 100 |
| `workflow:product-review` | workflow | PRODUCT | 4975.18 | 215 | 47.9 | 100 |
| `workflow:recurring-review` | workflow | RECURRING | 4511.88 | 215 | 50.29 | 100 |
| `workflow:settlement-check` | workflow | SETTLEMENT | 5054.26 | 239 | 49.98 | 100 |
| `workflow:si-project-review` | workflow | SI_PROJECT | 5453.92 | 256 | 50.87 | 100 |
| `workflow:task-approved` | workflow | TASK | 5520.72 | 256 | 49.95 | 100 |
| `workflow:commerce-review` | workflow | WORKSPACE | 5349.38 | 256 | 50.45 | 100 |

## Measured baseline — `qwen-2.5-0.5b`

Qwen2.5 0.5B (Ollama) · 측정 타깃 114개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | 21 | 3552.93 | 74.71 | 99.57 | 243.24 | 100 |
| distribution | 1 | 1743.23 | 75.52 | 139 | 166 | 100 |
| gameops | 6 | 1721.3 | 79.18 | 102.5 | 126.83 | 100 |
| skills | 86 | 2601.22 | 76.07 | 135.43 | 183.27 | 100 |

### Skills by category

| category | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- |
| commerce | 12 | 2606.92 | 75.09 | 181 | 100 |
| documents | 3 | 3686.73 | 76.56 | 251.33 | 100 |
| finance | 5 | 2758.65 | 77.18 | 197.4 | 100 |
| food | 5 | 2808.71 | 75.9 | 176.4 | 100 |
| government | 5 | 2377.28 | 76.9 | 158.4 | 100 |
| health | 4 | 1829.85 | 77.29 | 139.5 | 100 |
| legal | 5 | 2706.46 | 77.23 | 194.8 | 100 |
| media | 6 | 2970.65 | 76.71 | 203 | 100 |
| mobility | 6 | 2347.42 | 76.13 | 170 | 100 |
| real-estate | 6 | 2619.68 | 74.21 | 186.67 | 100 |
| sports | 5 | 3123.67 | 75.29 | 231.8 | 100 |
| tooling | 3 | 2029.37 | 78.63 | 144.33 | 100 |
| travel | 7 | 2426.88 | 75.02 | 170.57 | 100 |
| utility | 11 | 2160.63 | 76.7 | 159 | 100 |
| writing | 3 | 3566.24 | 74.16 | 249.67 | 100 |

### All targets

| target | kind | group | 지연 p50(ms) | 출력tok | tps | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| `agent:cs` | agent | agent | 607.38 | 54 | 78.54 | 100 |
| `agent:dashboard` | agent | agent | 1476.75 | 106 | 79.63 | 100 |
| `agent:incident` | agent | agent | 745.59 | 55 | 81.54 | 100 |
| `agent:notice` | agent | agent | 778.92 | 59 | 80.37 | 100 |
| `playbook:payment_missing_response_v1` | playbook | high | 3208.05 | 231 | 76.6 | 100 |
| `playbook:daily_ops_brief_v1` | playbook | low | 3511.08 | 256 | 78.37 | 100 |
| `preset:PLOMUS_DISTRIBUTION` | preset | preset | 1743.23 | 166 | 75.52 | 100 |
| `skill:bunjang-search` | skill | commerce | 3144.93 | 218 | 74.57 | 100 |
| `skill:coupang-product-search` | skill | commerce | 3712.52 | 242 | 69.08 | 100 |
| `skill:daangn-cars-search` | skill | commerce | 2022.22 | 139 | 74.96 | 100 |
| `skill:daangn-jobs-search` | skill | commerce | 3597.84 | 256 | 77.2 | 100 |
| `skill:daangn-used-goods-search` | skill | commerce | 3564.84 | 218 | 72.45 | 100 |
| `skill:daiso-product-search` | skill | commerce | 1768.4 | 170 | 75.57 | 100 |
| `skill:danawa-price-search` | skill | commerce | 3290.81 | 226 | 72.69 | 100 |
| `skill:market-kurly-search` | skill | commerce | 1396.14 | 95 | 75.41 | 100 |
| `skill:naver-shopping-search` | skill | commerce | 3620.41 | 241 | 74.04 | 100 |
| `skill:ohou-today-deal` | skill | commerce | 1546.73 | 108 | 78.14 | 100 |
| `skill:olive-young-search` | skill | commerce | 1765.51 | 129 | 77.5 | 100 |
| `skill:used-car-price-search` | skill | commerce | 1852.74 | 130 | 79.51 | 100 |
| `skill:hwp` | skill | documents | 3747.72 | 256 | 76.37 | 100 |
| `skill:rhwp-advanced` | skill | documents | 3750.71 | 256 | 75.32 | 100 |
| `skill:rhwp-edit` | skill | documents | 3561.77 | 242 | 77.99 | 100 |
| `skill:daishin-report-search` | skill | finance | 3702.92 | 256 | 76.01 | 100 |
| `skill:k-dart` | skill | finance | 3120.88 | 236 | 78.16 | 100 |
| `skill:korean-jangbu-for` | skill | finance | 3548.38 | 256 | 77.4 | 100 |
| `skill:korean-stock-search` | skill | finance | 1248.75 | 87 | 80.04 | 100 |
| `skill:toss-securities` | skill | finance | 2172.34 | 152 | 74.31 | 100 |
| `skill:blue-ribbon-nearby` | skill | food | 2060.56 | 146 | 77.95 | 100 |
| `skill:catchtable-sniper` | skill | food | 3654.82 | 227 | 74.54 | 100 |
| `skill:hola-poke-yeoksam` | skill | food | 3541.32 | 211 | 77.61 | 100 |
| `skill:k-schoollunch-menu` | skill | food | 3717.41 | 219 | 70.28 | 100 |
| `skill:kakao-bar-nearby` | skill | food | 1069.46 | 79 | 79.13 | 100 |
| `skill:korean-scholarship-search` | skill | government | 3561.65 | 256 | 77.75 | 100 |
| `skill:kosis-stats` | skill | government | 1305.06 | 95 | 78.89 | 100 |
| `skill:kstartup-search` | skill | government | 3541.04 | 217 | 77.94 | 100 |
| `skill:local-election-candidate-search` | skill | government | 1946.24 | 117 | 72.68 | 100 |
| `skill:nts-business-registration` | skill | government | 1532.41 | 107 | 77.25 | 100 |
| `skill:emergency-room-beds` | skill | health | 670.48 | 46 | 79.03 | 100 |
| `skill:gangnamunni-clinic-search` | skill | health | 1256.85 | 146 | 78.58 | 100 |
| `skill:mfds-drug-safety` | skill | health | 1963.84 | 148 | 75.86 | 100 |
| `skill:mfds-food-safety` | skill | health | 3428.23 | 218 | 75.69 | 100 |
| `skill:corporate-registration-consulting` | skill | legal | 1489.32 | 153 | 74.51 | 100 |
| `skill:iros-registry-automation` | skill | legal | 3571.78 | 256 | 76.46 | 100 |
| `skill:korean-law-search` | skill | legal | 1413.11 | 104 | 79.49 | 100 |
| `skill:korean-patent-search` | skill | legal | 3491 | 205 | 78.45 | 100 |
| `skill:korean-privacy-terms` | skill | legal | 3567.09 | 256 | 77.23 | 100 |
| `skill:geeknews-search` | skill | media | 3490.93 | 217 | 78.49 | 100 |
| `skill:joseon-sillok-search` | skill | media | 3536.22 | 194 | 78.04 | 100 |
| `skill:korean-cinema-search` | skill | media | 3514.17 | 232 | 76.73 | 100 |
| `skill:naver-blog-research` | skill | media | 1493.32 | 139 | 71.82 | 100 |
| `skill:naver-news-search` | skill | media | 2270.63 | 180 | 77.51 | 100 |
| `skill:ticket-availability` | skill | media | 3518.63 | 256 | 77.68 | 100 |
| `skill:cheap-gas-nearby` | skill | mobility | 978.63 | 70 | 80.24 | 100 |
| `skill:delivery-tracking` | skill | mobility | 3549.85 | 256 | 77.63 | 100 |
| `skill:hipass-receipt` | skill | mobility | 1791.38 | 130 | 78.63 | 100 |
| `skill:korean-transit-route` | skill | mobility | 3686.42 | 256 | 75.38 | 100 |
| `skill:seoul-subway-arrival` | skill | mobility | 2363.13 | 142 | 68.47 | 100 |
| `skill:subway-lost-property` | skill | mobility | 1715.1 | 166 | 76.45 | 100 |
| `skill:court-auction-notice-search` | skill | real-estate | 1485.03 | 157 | 77.78 | 100 |
| `skill:daangn-realty-search` | skill | real-estate | 1988.36 | 142 | 78.82 | 100 |
| `skill:gongsijiga-search` | skill | real-estate | 3555.64 | 256 | 77.65 | 100 |
| `skill:lh-notice-search` | skill | real-estate | 1882.14 | 102 | 71.46 | 100 |
| `skill:real-estate-search` | skill | real-estate | 4080.46 | 256 | 65.85 | 100 |
| `skill:sh-notice-search` | skill | real-estate | 2726.48 | 207 | 73.7 | 100 |
| `skill:kbl-results` | skill | sports | 3606.26 | 256 | 75.67 | 100 |
| `skill:kbo-results` | skill | sports | 3639.61 | 250 | 71.79 | 100 |
| `skill:kleague-results` | skill | sports | 2743.75 | 215 | 76.42 | 100 |
| `skill:korean-marathon-schedule` | skill | sports | 3595.94 | 256 | 76.23 | 100 |
| `skill:lck-analytics` | skill | sports | 2032.79 | 182 | 76.36 | 100 |
| `skill:k-skill-cleaner` | skill | tooling | 3609.05 | 210 | 76.62 | 100 |
| `skill:k-skill-setup` | skill | tooling | 804.2 | 56 | 80.17 | 100 |
| `skill:kakaotalk-mac` | skill | tooling | 1674.85 | 167 | 79.09 | 100 |
| `skill:express-bus-booking` | skill | travel | 3729.81 | 256 | 74.28 | 100 |
| `skill:flight-ticket-search` | skill | travel | 1798.37 | 113 | 73.52 | 100 |
| `skill:foresttrip-vacancy` | skill | travel | 1702.01 | 129 | 72.03 | 100 |
| `skill:intercity-bus-booking` | skill | travel | 2106.41 | 162 | 76.59 | 100 |
| `skill:ktx-booking` | skill | travel | 3662.05 | 256 | 75.62 | 100 |
| `skill:myrealtrip-search` | skill | travel | 2057.56 | 145 | 76.2 | 100 |
| `skill:srt-booking` | skill | travel | 1931.95 | 133 | 76.87 | 100 |
| `skill:donation-place-search` | skill | utility | 3600.56 | 247 | 75.9 | 100 |
| `skill:fine-dust-location` | skill | utility | 1066.09 | 74 | 79.16 | 100 |
| `skill:han-river-water-level` | skill | utility | 3537.88 | 215 | 77.74 | 100 |
| `skill:household-waste-info` | skill | utility | 994.11 | 127 | 71.95 | 100 |
| `skill:korea-weather` | skill | utility | 1373.7 | 93 | 77.03 | 100 |
| `skill:library-book-search` | skill | utility | 3688.73 | 256 | 73.42 | 100 |
| `skill:lotto-results` | skill | utility | 2985.32 | 225 | 75.58 | 100 |
| `skill:parking-lot-search` | skill | utility | 1117.26 | 82 | 80 | 100 |
| `skill:public-restroom-nearby` | skill | utility | 2371.55 | 200 | 78.61 | 100 |
| `skill:seoul-density` | skill | utility | 2241.53 | 177 | 75.86 | 100 |
| `skill:zipcode-search` | skill | utility | 790.16 | 53 | 78.5 | 100 |
| `skill:korean-character-count` | skill | writing | 3650.5 | 256 | 76.14 | 100 |
| `skill:korean-slang-writing` | skill | writing | 3734.7 | 256 | 71.23 | 100 |
| `skill:korean-spell-check` | skill | writing | 3313.53 | 237 | 75.11 | 100 |
| `workflow:app-release-review` | workflow | APP_RELEASE | 3683.67 | 256 | 74.45 | 100 |
| `workflow:app-store-review` | workflow | APP_STORE | 3300.03 | 236 | 73.68 | 100 |
| `workflow:apply-change-plan` | workflow | CHANGE_PLAN | 3851.81 | 256 | 73 | 100 |
| `workflow:claim-created` | workflow | CLAIM | 3742.57 | 256 | 72.18 | 100 |
| `workflow:contract-review` | workflow | CONTRACT | 3714.53 | 251 | 73.69 | 100 |
| `workflow:daily-briefing` | workflow | DAILY_BRIEFING | 3712.27 | 256 | 73.81 | 100 |
| `workflow:finance-review` | workflow | FINANCE | 3770.92 | 256 | 73.64 | 100 |
| `workflow:general-company-review` | workflow | GENERAL_COMPANY | 3768.7 | 256 | 72.89 | 100 |
| `workflow:hr-review` | workflow | HR | 3688.48 | 256 | 73.66 | 100 |
| `workflow:inventory-review` | workflow | INVENTORY | 3734.49 | 229 | 73.88 | 100 |
| `workflow:stock-low` | workflow | INVENTORY | 4070.39 | 250 | 71.54 | 100 |
| `workflow:legal-policy-review` | workflow | LEGAL_POLICY | 2701.33 | 173 | 72.15 | 100 |
| `workflow:operations-review` | workflow | OPERATIONS | 3668.22 | 247 | 74.9 | 100 |
| `workflow:order-delay-review` | workflow | ORDER_DELAY | 3615.16 | 252 | 75.88 | 100 |
| `workflow:partner-review` | workflow | PARTNER | 3816.01 | 256 | 74.39 | 100 |
| `workflow:product-review` | workflow | PRODUCT | 1881.74 | 143 | 78.45 | 100 |
| `workflow:recurring-review` | workflow | RECURRING | 3564.94 | 256 | 77.91 | 100 |
| `workflow:settlement-check` | workflow | SETTLEMENT | 3691.55 | 256 | 75.45 | 100 |
| `workflow:si-project-review` | workflow | SI_PROJECT | 3527.04 | 255 | 76.93 | 100 |
| `workflow:task-approved` | workflow | TASK | 3522.26 | 256 | 78.48 | 100 |
| `workflow:commerce-review` | workflow | WORKSPACE | 3585.45 | 256 | 77.88 | 100 |

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

