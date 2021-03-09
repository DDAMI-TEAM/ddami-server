# DB

## 사용자

- 이메일
- 비밀번호(8자리 이상)
- 이름
- 생일
- 성별
- 닉네임
- 핸드폰 번호
- 관심 분야
- 팔로우
- 팔로워
- 관심 작품(좋아요)
- 인증 상태(학교 인증)
- 생성 날짜


## 홈 페이지

- 프로필 사진 경로
- 상태 메시지

## 작품

- 이미지 파일 경로
- 작가
- 제목
- 내용
- 댓글
- 관련 분야
- 조회수
- 좋아요
- 상태 (샵에 업로드 가능/불가능)
- 생성 날짜

## 댓글

- 사용자
- 내용
- 대댓글

# 검색

- 검색어

# 작품 샾 (Product)

- pieces: ObjectId, ref: Piece
- title
- description
- price
- locationName
- location: x좌표, y좌표
- author
- hasField
- views
- like: 좋아요한 유저 ObjectId, ref: User
- likeCount
- state: enum:[-1(거래 대기), 0(거래 중), 1(거래 완료)], 
- crated: createdAt Date
- id

# 재료 샾

# 거래 내역

