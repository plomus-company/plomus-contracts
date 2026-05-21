# Benchmark Results

`scripts/summary-benchmarks.mjs`가 `contracts/benchmarks/v1/`에서 생성합니다. 수정은 계약 데이터에서 하고 재생성하세요.

## Methodology

- **대상(targets)**: 실행 가능한 계약 = 스킬 + 커머스 워크플로. 각 타깃은 실재 계약을 참조합니다.
- **measured**: 실제 모델 실행 측정값 (`tools/run-experiment.mjs`). 지연은 1회성 모델 로드를 제외한 추론 시간, 처리량은 출력토큰/평가시간, 비용은 모델 가격(로컬은 0). `accuracy`는 골드셋이 없어 미측정.
- **illustrative**: 결정론적 합성 시드 (`tools/generate-benchmarks.mjs`). 구조 시연/회귀 베이스라인용이며 실측이 아닙니다.

## Models

| modelId | vendor | status | context | in $/Mtok | out $/Mtok |
| --- | --- | --- | --- | --- | --- |
| `claude-opus-4-7` | anthropic | frontier | 200000 | 15 | 75 |
| `claude-sonnet-4-6` | anthropic | balanced | 200000 | 3 | 15 |
| `claude-haiku-4-5` | anthropic | fast | 200000 | 1 | 5 |
| `gpt-4o` | openai | frontier | 128000 | 2.5 | 10 |
| `gpt-4o-mini` | openai | fast | 128000 | 0.15 | 0.6 |
| `o3-mini` | openai | balanced | 200000 | 1.1 | 4.4 |
| `gemini-2.5-pro` | google | frontier | 1000000 | 1.25 | 10 |
| `gemini-2.5-flash` | google | fast | 1000000 | 0.3 | 2.5 |
| `llama-3.3-70b` | meta | balanced | 128000 | 0.6 | 0.6 |
| `qwen-2.5-72b` | alibaba | balanced | 131072 | 0.4 | 0.4 |
| `deepseek-v3` | deepseek | balanced | 128000 | 0.27 | 1.1 |
| `mixtral-8x22b` | mistral | fast | 64000 | 2 | 6 |
| `qwen3.6-27b` | alibaba | balanced | 262144 | 0 | 0 |
| `qwen-2.5-0.5b` | alibaba | fast | 32768 | 0 | 0 |

_가격은 indicative(참고용)이며 로컬 모델은 0._

## Measured model comparison

동일 타깃을 여러 모델로 실행한 도메인 롤업 비교입니다.

| domain | model | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| commerce | `qwen-2.5-0.5b` | 21 | 730.75 | 496.32 | 236.48 | 100 |
| commerce | `qwen3.6-27b` | 21 | 19761.91 | 12.61 | 239.48 | 100 |
| skills | `qwen-2.5-0.5b` | 86 | 538.51 | 522.57 | 187.35 | 100 |
| skills | `qwen3.6-27b` | 86 | 5316.76 | 13.62 | 65.52 | 100 |

_성공률은 비어 있지 않은 응답 비율(품질/정확도는 미측정)._

## Measured baseline — `qwen3.6-27b`

Qwen3.6 27B (Ollama Q4_K_M) · 측정 타깃 107개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| skills | 86 | 5316.76 | 13.62 | 99.98 | 65.52 | 100 |
| commerce | 21 | 19761.91 | 12.61 | 59.9 | 239.48 | 100 |

### Skills by category

| category | n | 지연 p50(ms) | 처리량(tps) | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- |
| commerce | 12 | 5148.75 | 13.31 | 60.25 | 100 |
| documents | 3 | 5891.88 | 15.56 | 84.67 | 100 |
| finance | 5 | 5872.06 | 13.52 | 72 | 100 |
| food | 5 | 4700.72 | 13.27 | 56.6 | 100 |
| government | 5 | 4718.66 | 15.56 | 67 | 100 |
| health | 4 | 5280.93 | 11.85 | 56.75 | 100 |
| legal | 5 | 5262.07 | 14.89 | 71.4 | 100 |
| media | 6 | 5354.9 | 12.83 | 63.17 | 100 |
| mobility | 6 | 5534.09 | 13.66 | 67.67 | 100 |
| real-estate | 6 | 5865.02 | 14.08 | 76.17 | 100 |
| sports | 5 | 4733.45 | 14.08 | 61.4 | 100 |
| tooling | 3 | 5363.66 | 12.7 | 62.67 | 100 |
| travel | 7 | 6626.15 | 12.34 | 75.57 | 100 |
| utility | 11 | 5017.93 | 13.35 | 60.18 | 100 |
| writing | 3 | 4008.98 | 15.4 | 56 | 100 |

### All targets

| target | kind | group | 지연 p50(ms) | 출력tok | tps | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| `skill:bunjang-search` | skill | commerce | 5850.72 | 57 | 13.48 | 100 |
| `skill:coupang-product-search` | skill | commerce | 6901.63 | 87 | 13.16 | 100 |
| `skill:daangn-cars-search` | skill | commerce | 4489.37 | 57 | 14.05 | 100 |
| `skill:daangn-jobs-search` | skill | commerce | 4115.06 | 49 | 13.07 | 100 |
| `skill:daangn-used-goods-search` | skill | commerce | 4396.37 | 48 | 11.67 | 100 |
| `skill:daiso-product-search` | skill | commerce | 5883.95 | 56 | 10.42 | 100 |
| `skill:danawa-price-search` | skill | commerce | 8568.2 | 77 | 9.5 | 100 |
| `skill:market-kurly-search` | skill | commerce | 4560.43 | 55 | 13.35 | 100 |
| `skill:naver-shopping-search` | skill | commerce | 4087.89 | 63 | 16.72 | 100 |
| `skill:ohou-today-deal` | skill | commerce | 4566.97 | 58 | 13.75 | 100 |
| `skill:olive-young-search` | skill | commerce | 4222.46 | 60 | 15.84 | 100 |
| `skill:used-car-price-search` | skill | commerce | 4142 | 56 | 14.75 | 100 |
| `skill:hwp` | skill | documents | 6999.95 | 83 | 12.61 | 100 |
| `skill:rhwp-advanced` | skill | documents | 5411.49 | 87 | 17.05 | 100 |
| `skill:rhwp-edit` | skill | documents | 5264.21 | 84 | 17.01 | 100 |
| `skill:daishin-report-search` | skill | finance | 7393.31 | 67 | 9.86 | 100 |
| `skill:k-dart` | skill | finance | 6155.21 | 90 | 15.63 | 100 |
| `skill:korean-jangbu-for` | skill | finance | 5988.53 | 65 | 12.38 | 100 |
| `skill:korean-stock-search` | skill | finance | 5882.08 | 91 | 16.5 | 100 |
| `skill:toss-securities` | skill | finance | 3941.16 | 47 | 13.23 | 100 |
| `skill:blue-ribbon-nearby` | skill | food | 3755.09 | 41 | 13.49 | 100 |
| `skill:catchtable-sniper` | skill | food | 4177.77 | 49 | 12.63 | 100 |
| `skill:hola-poke-yeoksam` | skill | food | 5820.6 | 69 | 12.82 | 100 |
| `skill:k-schoollunch-menu` | skill | food | 5120.69 | 72 | 15.13 | 100 |
| `skill:kakao-bar-nearby` | skill | food | 4629.45 | 52 | 12.26 | 100 |
| `skill:korean-scholarship-search` | skill | government | 4532.02 | 68 | 16.55 | 100 |
| `skill:kosis-stats` | skill | government | 3914.96 | 60 | 16.91 | 100 |
| `skill:kstartup-search` | skill | government | 5881 | 88 | 15.87 | 100 |
| `skill:local-election-candidate-search` | skill | government | 5406.96 | 64 | 12.76 | 100 |
| `skill:nts-business-registration` | skill | government | 3858.37 | 55 | 15.71 | 100 |
| `skill:emergency-room-beds` | skill | health | 6496.41 | 56 | 9.23 | 100 |
| `skill:gangnamunni-clinic-search` | skill | health | 5223.46 | 57 | 11.87 | 100 |
| `skill:mfds-drug-safety` | skill | health | 4532.99 | 57 | 13.39 | 100 |
| `skill:mfds-food-safety` | skill | health | 4870.88 | 57 | 12.92 | 100 |
| `skill:corporate-registration-consulting` | skill | legal | 5227.07 | 66 | 13.53 | 100 |
| `skill:iros-registry-automation` | skill | legal | 7471.37 | 89 | 12.81 | 100 |
| `skill:korean-law-search` | skill | legal | 3582.38 | 49 | 14.96 | 100 |
| `skill:korean-patent-search` | skill | legal | 3313.38 | 51 | 17.09 | 100 |
| `skill:korean-privacy-terms` | skill | legal | 6716.14 | 102 | 16.07 | 100 |
| `skill:geeknews-search` | skill | media | 4279.84 | 48 | 12.5 | 100 |
| `skill:joseon-sillok-search` | skill | media | 5398.78 | 61 | 12.27 | 100 |
| `skill:korean-cinema-search` | skill | media | 5954.24 | 67 | 12.15 | 100 |
| `skill:naver-blog-research` | skill | media | 5163.02 | 58 | 12.24 | 100 |
| `skill:naver-news-search` | skill | media | 6008.07 | 79 | 14.35 | 100 |
| `skill:ticket-availability` | skill | media | 5325.48 | 66 | 13.44 | 100 |
| `skill:cheap-gas-nearby` | skill | mobility | 3729.58 | 46 | 13.53 | 100 |
| `skill:delivery-tracking` | skill | mobility | 7108.95 | 65 | 9.85 | 100 |
| `skill:hipass-receipt` | skill | mobility | 4494.76 | 54 | 13.33 | 100 |
| `skill:korean-transit-route` | skill | mobility | 4479.37 | 67 | 16.33 | 100 |
| `skill:seoul-subway-arrival` | skill | mobility | 4234.4 | 62 | 15.88 | 100 |
| `skill:subway-lost-property` | skill | mobility | 9157.47 | 112 | 13.03 | 100 |
| `skill:court-auction-notice-search` | skill | real-estate | 6487.09 | 80 | 13.64 | 100 |
| `skill:daangn-realty-search` | skill | real-estate | 7093.17 | 85 | 12.73 | 100 |
| `skill:gongsijiga-search` | skill | real-estate | 4186.17 | 47 | 12.05 | 100 |
| `skill:lh-notice-search` | skill | real-estate | 5800.87 | 65 | 12.45 | 100 |
| `skill:real-estate-search` | skill | real-estate | 6043.4 | 91 | 16.26 | 100 |
| `skill:sh-notice-search` | skill | real-estate | 5579.43 | 89 | 17.32 | 100 |
| `skill:kbl-results` | skill | sports | 4205.84 | 48 | 12.68 | 100 |
| `skill:kbo-results` | skill | sports | 4127.95 | 50 | 13.42 | 100 |
| `skill:kleague-results` | skill | sports | 4199.55 | 49 | 12.67 | 100 |
| `skill:korean-marathon-schedule` | skill | sports | 5259.01 | 82 | 17.34 | 100 |
| `skill:lck-analytics` | skill | sports | 5874.88 | 78 | 14.3 | 100 |
| `skill:k-skill-cleaner` | skill | tooling | 8208.43 | 96 | 12.28 | 100 |
| `skill:k-skill-setup` | skill | tooling | 4162.91 | 48 | 12.62 | 100 |
| `skill:kakaotalk-mac` | skill | tooling | 3719.65 | 44 | 13.2 | 100 |
| `skill:express-bus-booking` | skill | travel | 9274.55 | 90 | 10.2 | 100 |
| `skill:flight-ticket-search` | skill | travel | 5096.23 | 49 | 10.86 | 100 |
| `skill:foresttrip-vacancy` | skill | travel | 6764.01 | 66 | 10.53 | 100 |
| `skill:intercity-bus-booking` | skill | travel | 6427.76 | 77 | 12.79 | 100 |
| `skill:ktx-booking` | skill | travel | 5901.59 | 93 | 16.61 | 100 |
| `skill:myrealtrip-search` | skill | travel | 5707.47 | 68 | 12.71 | 100 |
| `skill:srt-booking` | skill | travel | 7211.46 | 86 | 12.66 | 100 |
| `skill:donation-place-search` | skill | utility | 6577.02 | 68 | 10.9 | 100 |
| `skill:fine-dust-location` | skill | utility | 6442.57 | 57 | 9.54 | 100 |
| `skill:han-river-water-level` | skill | utility | 4748 | 52 | 11.96 | 100 |
| `skill:household-waste-info` | skill | utility | 5033.22 | 67 | 14.24 | 100 |
| `skill:korea-weather` | skill | utility | 5049.82 | 54 | 11.78 | 100 |
| `skill:library-book-search` | skill | utility | 6785.39 | 81 | 12.73 | 100 |
| `skill:lotto-results` | skill | utility | 5389.71 | 62 | 12.39 | 100 |
| `skill:parking-lot-search` | skill | utility | 3177.57 | 49 | 16.83 | 100 |
| `skill:public-restroom-nearby` | skill | utility | 3086.45 | 47 | 16.66 | 100 |
| `skill:seoul-density` | skill | utility | 4490.17 | 67 | 15.96 | 100 |
| `skill:zipcode-search` | skill | utility | 4417.27 | 58 | 13.91 | 100 |
| `skill:korean-character-count` | skill | writing | 3882.78 | 48 | 13.89 | 100 |
| `skill:korean-slang-writing` | skill | writing | 4336.03 | 65 | 16.25 | 100 |
| `skill:korean-spell-check` | skill | writing | 3808.12 | 55 | 16.07 | 100 |
| `workflow:app-release-review` | workflow | APP_RELEASE | 20533.22 | 256 | 12.81 | 100 |
| `workflow:app-store-review` | workflow | APP_STORE | 16810.43 | 256 | 15.71 | 100 |
| `workflow:apply-change-plan` | workflow | CHANGE_PLAN | 16068.93 | 256 | 16.32 | 100 |
| `workflow:claim-created` | workflow | CLAIM | 16239.88 | 256 | 16.1 | 100 |
| `workflow:contract-review` | workflow | CONTRACT | 19286.53 | 233 | 12.41 | 100 |
| `workflow:daily-briefing` | workflow | DAILY_BRIEFING | 17606.52 | 207 | 12.14 | 100 |
| `workflow:finance-review` | workflow | FINANCE | 21581.4 | 242 | 11.45 | 100 |
| `workflow:general-company-review` | workflow | GENERAL_COMPANY | 21089.51 | 236 | 11.52 | 100 |
| `workflow:hr-review` | workflow | HR | 19708.97 | 256 | 13.24 | 100 |
| `workflow:inventory-review` | workflow | INVENTORY | 17308.28 | 215 | 12.7 | 100 |
| `workflow:stock-low` | workflow | INVENTORY | 20314.61 | 217 | 10.98 | 100 |
| `workflow:legal-policy-review` | workflow | LEGAL_POLICY | 23602.2 | 256 | 11.11 | 100 |
| `workflow:operations-review` | workflow | OPERATIONS | 21298.7 | 247 | 11.92 | 100 |
| `workflow:order-delay-review` | workflow | ORDER_DELAY | 20290.73 | 226 | 11.47 | 100 |
| `workflow:partner-review` | workflow | PARTNER | 19038.85 | 218 | 11.8 | 100 |
| `workflow:product-review` | workflow | PRODUCT | 19307.28 | 215 | 11.56 | 100 |
| `workflow:recurring-review` | workflow | RECURRING | 18780.08 | 213 | 11.67 | 100 |
| `workflow:settlement-check` | workflow | SETTLEMENT | 22824.29 | 256 | 11.53 | 100 |
| `workflow:si-project-review` | workflow | SI_PROJECT | 24360.94 | 256 | 10.76 | 100 |
| `workflow:task-approved` | workflow | TASK | 22765.61 | 256 | 11.5 | 100 |
| `workflow:commerce-review` | workflow | WORKSPACE | 16183.16 | 256 | 16.15 | 100 |

## Measured baseline — `qwen-2.5-0.5b`

Qwen2.5 0.5B (Ollama) · 측정 타깃 107개.

### Domain rollups

| domain | n | 지연 p50(ms) | 처리량(tps) | 입력tok | 출력tok | 성공률(%) |
| --- | --- | --- | --- | --- | --- | --- |
| skills | 86 | 538.51 | 522.57 | 135.43 | 187.35 | 100 |
| commerce | 21 | 730.75 | 496.32 | 99.57 | 236.48 | 100 |

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

## Illustrative leaderboard (synthetic seed)

_합성 시드 — 절대 비교가 아닌 구조/회귀 참조용._

### skills

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.10417 | 15478.23 | 90.01 | 98.24 |
| `gpt-4o` | 0.01513 | 10822.59 | 85.87 | 97.29 |
| `gemini-2.5-pro` | 0.01247 | 9929.07 | 84.9 | 96.32 |
| `deepseek-v3` | 0.00163 | 13805.8 | 81.2 | 95.28 |

### commerce

| model | 비용($/run) | 지연 p50(ms) | 정확도(%) | 성공률(%) |
| --- | --- | --- | --- | --- |
| `claude-opus-4-7` | 0.14071 | 20557.24 | 90.13 | 98.22 |
| `gpt-4o` | 0.02003 | 14203.19 | 86.23 | 97.19 |
| `gemini-2.5-pro` | 0.01796 | 14465.24 | 85.11 | 96.42 |
| `deepseek-v3` | 0.00224 | 19135.38 | 81.46 | 95.29 |

