# blog-api 구조 설계

> 이 문서는 `blog`(프론트) 저장소에 임시로 작성됨 — 백엔드 저장소(`blog-api`) 생성 후 그쪽으로 옮길 것. 프론트 설계는 `docs/blog-structure-plan.md` 참고.

## 개요

- **Spring Boot** + **Spring Security** + **Spring Data JPA** + **PostgreSQL**
- 배포: **Render 무료 웹서비스** (512MB RAM, 0.1 CPU, 월 750시간 — 개인 블로그엔 충분. 15분 미사용 시 슬립, 재요청 시 30~60초 콜드스타트)
- DB: **Neon 무료 Postgres 우선 추천** (0.5GB 저장공간, 월 100 CU-hour, 미사용 시 컴퓨트가 자동으로 잠들었다가 다음 쿼리 때 자동으로 깨어남 — 사람 개입 불필요). Supabase(500MB 저장공간)도 무료지만 **7일 미사용 시 프로젝트가 일시정지되고 대시보드에서 수동으로 복구해야 함** — 개인 블로그처럼 트래픽이 뜸할 수 있는 서비스엔 운영 리스크라 후순위. 둘 다 Render 자체 DB(무료 티어 만료 정책 있음)보다 나음
- Redis: 조회수 중복방지 + 로그인 브루트포스 방어용. **Upstash 무료 티어**(256MB, 월 50만 명령 — 이 프로젝트 트래픽엔 충분히 넉넉함) 확인 완료
- 이미지/이력서 저장: **Cloudflare R2** (S3 호환 API)
- API 문서화: **springdoc-openapi** → `/swagger-ui.html`

## 브라우저는 이 서버를 직접 호출하지 않음

프론트가 BFF(Next.js Route Handler) 패턴이라, 이 서버로 오는 모든 요청은 **Next.js 서버가 대신 보내는 서버-to-서버 요청**임 (딱 하나 예외: 없음 — 전부 프록시 경유). 그래서:

- **CORS 설정 불필요** — 브라우저發 크로스 오리진 요청 자체가 없음
- 하지만 이게 "아무나 이 API를 직접 못 부른다"는 뜻은 아님 — Render에 배포되면 공개 URL이 생기고, `curl`이나 Postman으로 누구든 직접 호출 가능함. CORS는 브라우저만 막는 정책이라 서버 대 서버(또는 임의의 클라이언트) 호출은 못 막음
- 그래서 진짜 보호는 **엔드포인트별 인증/인가**로 함 (아래 "엔드포인트 보호 정책" 참고)

## 엔드포인트 보호 정책

| 종류 | 보호 방식 |
|---|---|
| 공개 조회 (글 목록/상세, 댓글 목록, 검색, 이력서 URL, 통계) | 없음 — 원래 공개 데이터 |
| `POST /posts/{slug}/like` | 없음 — 인증 개념 자체가 없는 기능, Redis IP+day로만 가벼운 어뷰징 방지 |
| `POST /auth/login` | 비밀번호 자체가 보호 수단 + Redis 기반 IP별 시도 횟수 제한 |
| `POST /auth/google` | **`X-Internal-Secret` 헤더 필수** — Next.js BFF만 아는 공유 시크릿. 이게 없으면 "이 이메일로 로그인시켜줘"라는 요청을 아무나 보낼 수 있어서(신원을 자체적으로 증명 안 하고 그냥 믿어주는 구조라) 반드시 필요 |
| `GET /auth/me` | 없음(그냥 토큰 유효성만 검사, 유효하지 않으면 401) |
| 글 CRUD, 이력서 업로드 | JWT + `role: OWNER` |
| 이미지 업로드 | JWT + `role: OWNER` (글 작성은 소유자만 하므로) |
| 댓글 작성 | JWT + `role: VISITOR` 또는 `OWNER` (누구든 로그인만 하면) |
| 댓글 삭제(모더레이션) | JWT + `role: OWNER` |
| `POST /revalidate` 호출(이 서버 → Next.js) | 반대 방향 — 이 서버가 Next.js의 `x-revalidate-secret` 헤더를 붙여서 호출 |

`X-Internal-Secret`, `REVALIDATE_SECRET`은 서로 다른 값. 둘 다 Vercel/Render 양쪽 환경변수에 동일하게 등록해둬야 함.

## 인증 설계

```
[소유자 로그인]
프론트 BFF → POST /auth/login { email, password }
  → Redis에서 이 IP의 실패 횟수 확인, 초과 시 429
  → 비밀번호 검증(BCrypt) → JWT(role: OWNER, sub: email) 발급 → 200 { token }
  → 프론트가 이 token을 httpOnly 쿠키로 저장

[방문자 로그인]
프론트가 Google과 직접 OAuth 코드 교환 → 프로필(email, name, avatarUrl, googleId) 확보
프론트 BFF → POST /auth/google { email, name, avatarUrl, googleId } + X-Internal-Secret 헤더
  → 시크릿 검증
  → googleId로 User 조회, 없으면 role: VISITOR로 새로 생성
  → JWT(role: VISITOR, sub: userId) 발급 → 200 { token }
  → 프론트가 이 token을 httpOnly 쿠키로 저장

[세션 확인 / 이후 모든 인증 요청]
프론트 BFF → GET /auth/me (또는 다른 보호된 엔드포인트) + Authorization: Bearer <token>
  → JWT 서명/만료 검증 (Spring Security 필터)
  → 유효하면 SecurityContext에 role 설정, 유효하지 않으면 401
```

- JWT: 서명 시크릿(`JWT_SECRET`)은 이 서버만 가짐 — 프론트와 공유 안 함(프론트는 서명 검증을 안 하고 이 서버에 위임하기로 했으므로)
- 만료: 짧게(예: 1시간), 리프레시 토큰 없음 — 만료되면 401, 프론트가 재로그인 유도
- 비밀번호: BCrypt 해시로 저장(평문 저장 금지), 애초에 owner 계정은 1개뿐이라 DB에 시드 데이터로 직접 넣거나 최초 기동 시 환경변수(`OWNER_EMAIL`, `OWNER_PASSWORD_HASH`)로 생성

## 데이터 모델 (JPA 엔티티)

```java
User {
  id (UUID, PK)
  email (unique)
  name
  avatarUrl (nullable)
  role (OWNER | VISITOR)
  passwordHash (nullable — OWNER만 사용)
  googleId (nullable, unique — VISITOR만 사용)
  createdAt
}

Post {
  id (UUID, PK)
  slug (unique)
  title
  summary
  body (text, 마크다운 원문)
  categorySlug (FK 아님, Category.slug 참조용 문자열)
  tags (List<String>, @ElementCollection)
  seriesSlug (nullable)
  seriesTitle (nullable)
  seriesOrder (nullable, int)  // 클라이언트가 안 보냄 — 저장 시 같은 seriesSlug의 기존 최대 order + 1로 서버가 계산
  pinned (boolean)
  hidden (boolean)
  viewCount (long)
  likeCount (long)  // 로그인 불필요 — 인증된 유저 개념이 없어서 "누가 눌렀는지"는 아예 저장 안 함, 카운트만
  createdAt, updatedAt
}
// 삭제는 하드 삭제 (댓글과 달리 모더레이션 대상이 아니라 소유자 본인이 관리하는 콘텐츠라 소프트 삭제 불필요)

Category {
  slug (PK)
  label
}
// 자유 생성 — 글 저장 시 categorySlug가 없는 값이면 Category를 upsert (label로 slugify)

Comment {
  id (UUID, PK)
  postId (FK → Post)
  authorId (FK → User)
  body (text)
  deleted (boolean, default false)  // 소프트 삭제
  createdAt
}

Resume {
  id (PK, 항상 1행만 유지)
  url
  uploadedAt
}

DailyVisit {
  date (PK)
  count (long)
}
// 조회수 중복방지 통과한 요청마다 오늘 날짜 row를 +1 (홈페이지 방문 추이 그래프용)
```

## API 엔드포인트

| 메서드 | 경로 | 보호 | 설명 |
|---|---|---|---|
| GET | `/posts` | 공개 | 목록 (hidden 제외, 카테고리/태그/시리즈 필터) |
| GET | `/posts/{slug}` | 공개* | 상세 (*hidden인 글은 OWNER만) |
| POST | `/posts` | OWNER | 등록 (slug는 title로부터 서버가 자동 생성) |
| PUT | `/posts/{slug}` | OWNER | 수정 |
| PATCH | `/posts/{slug}` | OWNER | `hidden`/`pinned` 토글 |
| DELETE | `/posts/{slug}` | OWNER | 삭제 (하드) |
| POST | `/posts/{slug}/view` | 공개 | 조회 기록 (Redis 중복방지) |
| POST | `/posts/{slug}/like` | 공개 | 좋아요 기록, `likeCount` 증가 (Redis IP+day 중복방지) |
| GET | `/posts/search` | 공개 | `q`, `sort`, `category`, `tags` 쿼리 — full-text search |
| GET | `/posts/{slug}/comments` | 공개 | 댓글 목록 |
| POST | `/posts/{slug}/comments` | VISITOR/OWNER | 댓글 작성 |
| DELETE | `/comments/{id}` | OWNER | 소프트 삭제 |
| GET | `/categories` | 공개 | 카테고리 목록(slug+label) — 글쓰기 화면 자동완성용 |
| GET | `/tags` | 공개 | 태그 목록(distinct 문자열) — 글쓰기 화면 자동완성용 |
| POST | `/auth/login` | 비번+Redis 제한 | 소유자 로그인 |
| POST | `/auth/google` | `X-Internal-Secret` | 방문자 로그인/가입 |
| GET | `/auth/me` | JWT | 세션 정보 |
| POST | `/images` | OWNER | 이미지 업로드 → R2, ≤5MB, jpg/png/webp/gif |
| GET | `/resume` | 공개 | 현재 이력서 URL |
| POST | `/resume` | OWNER | 이력서 업로드 → R2 (기존 덮어쓰기), ≤10MB, PDF만 |
| GET | `/stats/popular-posts` | 공개 | 조회수 TOP N |
| GET | `/stats/visits` | 공개 | 최근 N일 방문 추이 (`DailyVisit`) |

`slug`는 글 등록 시 title로부터 한 번만 생성되고 이후 title을 수정해도 바뀌지 않음 — URL 안정성 유지 + 프론트가 slug 하나로 조회/수정/삭제를 전부 처리할 수 있게(별도 id 조회 왕복 불필요).

`POST /posts/{slug}/like`는 인증이 아예 없는 완전 공개 엔드포인트 — "누가 눌렀는지"는 저장하지 않고 카운트만 올림(로그인 개념이 없는 기능이라 서버는 유저를 특정할 필요도 이유도 없음). `POST /posts/{slug}/view`와 완전히 동일한 Redis IP+day 중복방지 패턴을 재사용 — 같은 IP는 하루에 한 번만 카운트되어 스크립트 어뷰징을 어느 정도 억제. 완벽한 부정클릭 방지는 아니지만(스크립트가 IP를 계속 바꾸면 뚫림), 좋아요는 로그인·인증 자체가 없는 캐주얼한 지표라 이 정도면 충분 — 더 강한 보호가 필요해지면 그때 CAPTCHA 등을 검토.

## 온디맨드 ISR 재검증 연동

글 CRUD(등록/수정/삭제/숨김/고정) 성공 시 프론트에 재검증 요청. 어떤 글이 어떤 목록/카테고리/태그 페이지에 걸쳐있는지 이 서버가 계산할 필요 없음 — 그냥 "뭔가 바뀌었다"는 신호만 보내면 프론트가 `revalidatePath('/', 'layout')`로 전체를 무효화함:

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
void onPostChanged(PostChangedEvent event) {
  // DB 커밋이 확실히 끝난 뒤에만 호출 — 트랜잭션 롤백 시 잘못된 재검증 방지
  webClient.post()
    .uri(revalidateWebhookUrl)
    .header("x-revalidate-secret", revalidateSecret)
    // 바디 없음 — 호출 자체가 트리거, path 계산 불필요
    .retrieve()...
}
```

- 실패해도 글 CRUD 자체는 이미 커밋됐으니 사용자에게 에러 노출 안 함 — 로그만 남기고 다음 정기 방문/재시도로 보정 (YAGNI, 재시도 큐까지는 안 만듦)

## Redis 사용처

| 키 패턴 | 용도 | TTL |
|---|---|---|
| `login-attempt:{ip}` | 로그인 실패 횟수 카운트, 초과 시 429 | 15분 |
| `view:{slug}:{ip}:{yyyy-MM-dd}` | 조회수 중복 방지 (하루 1회만 카운트) | 1일 |
| `like:{slug}:{ip}:{yyyy-MM-dd}` | 좋아요 중복 방지 (하루 1회만 카운트) — view와 동일 패턴 | 1일 |

## R2 연동

- S3 호환 SDK(AWS SDK v2의 S3Client, endpoint만 R2로 override) 사용
- 환경변수: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL_BASE`
- 업로드 키 규칙: 이미지는 `images/{uuid}.{ext}`, 이력서는 고정 키 `resume/current.pdf`(덮어쓰기)

## 프로젝트 구조 (package-by-feature)

```
src/main/java/.../blogapi/
  post/
    Post.java, PostRepository.java, PostService.java, PostController.java
    PostChangedEvent.java
    TagController.java              # GET /tags — PostRepository의 distinct tag 조회
  category/
    Category.java, CategoryRepository.java, CategoryController.java  # GET /categories
  comment/
    Comment.java, CommentRepository.java, CommentService.java, CommentController.java
  auth/
    User.java, UserRepository.java, AuthService.java, AuthController.java
    JwtProvider.java, JwtAuthFilter.java
  image/
    ImageController.java, R2Client.java
  resume/
    Resume.java, ResumeController.java
  stats/
    DailyVisit.java, StatsController.java
  config/
    SecurityConfig.java, RedisConfig.java, R2Config.java, OpenApiConfig.java
  common/
    exception/ (GlobalExceptionHandler 등)
```

## 환경변수 (Render)

```
DB_URL, DB_USERNAME, DB_PASSWORD        # Neon(우선) 연결정보
JWT_SECRET                               # 이 서버만 보유, 프론트와 공유 안 함
JWT_EXPIRATION                           # 예: 3600 (초)
OWNER_EMAIL, OWNER_PASSWORD_HASH         # 최초 기동 시 소유자 계정 시드용
INTERNAL_SECRET                          # /auth/google 보호용, Vercel과 공유
REVALIDATE_WEBHOOK_URL, REVALIDATE_SECRET # Next.js 재검증 호출용, Vercel과 공유
REDIS_URL                                # Upstash 등
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_URL_BASE
```

## 테스트

- 서비스 레이어 유닛 테스트: JUnit5 + Mockito
- Testcontainers 등 통합 테스트는 1차 스코프에서 제외 (YAGNI, 필요해지면 추가)

## 다음 단계

1. 프로젝트 생성 (Spring Initializr: Web, Security, Data JPA, PostgreSQL Driver, Validation)
2. `SecurityConfig` — JWT 필터 체인, 엔드포인트별 권한 규칙
3. `User`/`Post`/`Category` 엔티티 + Repository, 소유자 계정 시드 로직
4. `/auth/login`, `/auth/me` 구현 + Redis 브루트포스 제한
5. Post CRUD API(slug 기준) + 재검증 웹훅(`@TransactionalEventListener`) 연결
6. `/auth/google` (`X-Internal-Secret` 보호) 구현
7. `Comment` 엔티티 + API
8. `GET /categories`, `GET /tags` (자동완성용)
9. R2 연동 — 이미지/이력서 업로드 API
10. 검색(full-text) + 조회수/좋아요(Redis 중복방지 동일 패턴) + 통계 API
11. `springdoc-openapi` 추가, Swagger 문서 확인
12. Render 배포, 환경변수 설정, 프론트와 실제 연동 테스트
