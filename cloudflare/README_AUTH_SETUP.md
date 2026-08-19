# Forestsolアカウント機能 Cloudflare反映手順

対象:
- Worker: `forest-craft-api`
- D1: `forest-craft-db`
- R2 bindings: `SKINS` / `ASSETS` / `MODELS`
- Secret: `UPLOAD_SECRET` は既存のまま残す

## 現在使うWorkerコード

プロフィール画像アップロード対応版は次のファイルです。

`cloudflare/forest-craft-api-v2-avatar.js`

この版には以下が含まれます。
- メールアドレスログイン
- 既存の作品投稿・ファイル配信
- プロフィール編集
- プロフィールアイコン画像アップロード
- プロフィールアイコン削除
- R2 `ASSETS` からの公開アイコン配信

## 1. D1

既にアカウント機能が動いている環境では、今回のアイコン対応で追加SQLは不要です。

初回セットアップの場合だけ、既存の `002_auth.sql` と `003_email.sql` を適用してください。

## 2. Workerコードを置き換え

Cloudflare Dashboard → Workers & Pages → `forest-craft-api` → Edit code。

現在のWorkerコードを

`cloudflare/forest-craft-api-v2-avatar.js`

の内容で置き換えて Deploy します。

既存Bindingsは変更しません。
- `DB` → `forest-craft-db`
- `SKINS` → `forest-craft-skins`
- `ASSETS` → `forest-craft-assets`
- `MODELS` → `forest-craft-models`
- `UPLOAD_SECRET` → 既存Secret

プロフィール画像は `ASSETS` の `avatars/<user_id>/avatar` に保存されます。

## 3. 動作確認

Deploy後に以下を確認します。

- `https://forest-craft-api.wdrk80.workers.dev/`
  - `version: "2.2-avatar-upload"`
- `https://forest-craft-api.wdrk80.workers.dev/db-test`
  - `ok: true`

その後、Forest Solのマイページ → プロフィール編集で確認します。

1. アイコンをタップ
2. JPG / PNG / WebPを選択
3. プレビューを確認
4. 「プロフィールを保存」
5. マイページと公開プロフィールの両方に同じアイコンが表示される
6. 「アイコンを削除」→保存で肉球表示へ戻る

## アイコン仕様

- ブラウザ側で最大1024px程度まで縮小
- WebPへ変換して送信
- API側上限は3MB
- SVGは受け付けない
- 公開画像は `/avatars/<user_id>` から配信

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
