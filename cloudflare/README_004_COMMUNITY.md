# Forest Craft Community v2.3

評価（1〜5）とお気に入りを有効にする更新です。

## 反映順

1. Cloudflare D1 `forest-craft-db` に `004_community.sql` を1回実行する。
2. Worker `forest-craft-api` のコードを `forest-craft-api-v2-avatar-dbfix.js` の最新版へ更新してデプロイする。
3. Worker の `/` を開き、`version` が `2.3-community` になっていることを確認する。
4. `forestsol.jp` 側は GitHub / Pages の最新版を反映する。

**必ずSQLを先に実行してからWorkerを更新してください。** 新Workerのギャラリー一覧は `post_ratings_v2` と `post_favorites` を参照します。

## 追加API

- `GET /posts/:id/community`
- `POST /posts/:id/rating` body: `{ "rating": 1..5 }`
- `DELETE /posts/:id/rating`
- `POST /posts/:id/favorite`
- `DELETE /posts/:id/favorite`
- `GET /me/favorites`

評価・お気に入りの変更操作はログイン必須です。平均評価・件数は公開ギャラリーにも返ります。
