# Forestsolアカウント機能 Cloudflare反映手順

対象:
- Worker: `forest-craft-api`
- D1: `forest-craft-db`
- R2 bindings: `SKINS` / `ASSETS` / `MODELS`
- Secret: `UPLOAD_SECRET` は既存のまま残す

## 1. D1を更新
Cloudflare Dashboard → Workers & Pages → D1 → `forest-craft-db` → Console を開く。

`cloudflare/002_auth.sql` のSQLを上から順に1回だけ実行する。

追加されるもの:
- users: `password_hash`, `password_salt`, `bio`, `created_at`, `updated_at`
- sessions テーブル
- username / posts用インデックス

## 2. Workerコードを置き換え
Workers & Pages → `forest-craft-api` → Edit code。

現在のWorkerコードを `cloudflare/forest-craft-api-v2-auth.js` の内容で置き換えて Deploy。

既存Bindingsは変更しない:
- `DB` → `forest-craft-db`
- `SKINS` → `forest-craft-skins`
- `ASSETS` → `forest-craft-assets`
- `MODELS` → `forest-craft-models`
- `UPLOAD_SECRET` → 既存Secret

## 3. 動作確認
Deploy後に以下を確認。

- `https://forest-craft-api.wdrk80.workers.dev/`
  - `version: "2.0-auth"`
- `https://forest-craft-api.wdrk80.workers.dev/db-test`
  - `ok: true`

その後 `https://forestsol.jp/account.html` からテスト用の一般アカウントを1件作る。

確認項目:
1. 新規登録 → 自動ログイン
2. マイページ表示
3. Forest Craft Studio Webを開く
4. 「🔐 ログインして投稿」が「🌐 サイトに投稿」に変わる
5. 投稿画面にUPLOAD_SECRET/ユーザーID/API URLが表示されない
6. 投稿後、マイページの「自分の作品」に追加される
7. 未ログイン状態では投稿ボタンが無効
8. 他ユーザーの作品は編集・削除できない

## 仕様
- 投稿は登録済み・ログイン中ユーザーのみ
- user_idはクライアントから受け取らず、セッションから確定
- パスワードはPBKDF2-SHA256でハッシュ化
- セッショントークンはブラウザに保存、D1にはSHA-256ハッシュだけ保存
- セッション有効期間は30日
- 一般ユーザーは自分の作品だけ変更・削除可能
- moderator/adminは管理操作可能
- 未ログインでも公開作品の閲覧・DLは可能
- `UPLOAD_SECRET` は一般投稿には使用しない。旧管理用 `/upload` の互換性のためだけ残す

## 既存adminユーザーについて
既存の `user_admin_001` はpassword_hashを持っていないため、新しいパスワードログインではログインできない。これは安全側の仕様。
一般ユーザー登録の動作確認後、管理者ログイン方式を別途設定する。
