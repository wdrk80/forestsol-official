const STORE_APP_ID = "9P50T1JGKSK3";
const STORE_RESOURCE = "https://manage.devcenter.microsoft.com";
const STORE_API = "https://manage.devcenter.microsoft.com/v1.0/my/analytics";
const LIFETIME_START = "01/01/2026";
const CACHE_SECONDS = 900;

let tokenCache = { token: "", expiresAt: 0 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      let response;
      if (url.pathname === "/" && request.method === "GET") {
        response = json({ ok: true, name: "Forest Craft Store Analytics API", appId: STORE_APP_ID });
      } else if (url.pathname === "/store-stats" && request.method === "GET") {
        response = await cachedJson(request, ctx, "store-stats", () => getStoreStats(env));
      } else if (url.pathname === "/store-reviews" && request.method === "GET") {
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 6), 1), 20);
        response = await cachedJson(request, ctx, "store-reviews-" + limit, () => getStoreReviews(env, limit));
      } else {
        response = json({ ok: false, error: "Not found" }, 404);
      }

      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (err) {
      console.error("Store analytics error", err);
      return json({ ok: false, error: publicError(err) }, 502, cors);
    }
  }
};

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = origin === "https://forestsol.jp" ||
    origin === "https://www.forestsol.jp" ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://forestsol.jp",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=60" : "no-store",
      ...headers
    }
  });
}

function publicError(err) {
  const msg = String(err && err.message || "Store analytics unavailable");
  if (msg.includes("STORE_NOT_CONFIGURED")) return "Microsoft Store APIの接続設定が未完了です";
  if (msg.includes("TOKEN_FAILED")) return "Microsoft Store認証に失敗しました";
  if (msg.includes("STORE_API_FAILED")) return "Microsoft Store統計を取得できませんでした";
  return "Microsoft Store統計を取得できませんでした";
}

async function cachedJson(request, ctx, key, producer) {
  const cache = caches.default;
  const url = new URL(request.url);
  const cacheKey = new Request(url.origin + "/__store_cache/" + key, { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const data = await producer();
  const response = json(data, 200, {
    "Cache-Control": "public, max-age=60, s-maxage=" + CACHE_SECONDS
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function requireConfig(env) {
  if (!env.MS_STORE_TENANT_ID || !env.MS_STORE_CLIENT_ID || !env.MS_STORE_CLIENT_SECRET) {
    throw new Error("STORE_NOT_CONFIGURED");
  }
}

async function getAccessToken(env) {
  requireConfig(env);
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) return tokenCache.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.MS_STORE_CLIENT_ID,
    client_secret: env.MS_STORE_CLIENT_SECRET,
    resource: STORE_RESOURCE
  });

  const r = await fetch(
    "https://login.microsoftonline.com/" + encodeURIComponent(env.MS_STORE_TENANT_ID) + "/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    }
  );

  const d = await safeJson(r);
  if (!r.ok || !d.access_token) {
    console.error("Microsoft token failure", r.status, d && d.error, d && d.error_description);
    throw new Error("TOKEN_FAILED");
  }

  const expires = Math.max(Number(d.expires_in || 3600), 300);
  tokenCache = {
    token: d.access_token,
    expiresAt: now + expires * 1000
  };
  return tokenCache.token;
}

async function storeGet(env, path, params) {
  const token = await getAccessToken(env);
  const u = new URL(STORE_API + path);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  });

  const r = await fetch(u.toString(), {
    headers: { Authorization: "Bearer " + token }
  });
  const d = await safeJson(r);
  if (!r.ok) {
    console.error("Microsoft Store API failure", r.status, u.pathname, d);
    throw new Error("STORE_API_FAILED");
  }
  return d;
}

async function safeJson(r) {
  try { return await r.json(); } catch { return {}; }
}

function mmddyyyy(date = new Date()) {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return mm + "/" + dd + "/" + date.getUTCFullYear();
}

async function getStoreStats(env) {
  const common = {
    applicationId: env.MS_STORE_APP_ID || STORE_APP_ID,
    startDate: LIFETIME_START,
    endDate: mmddyyyy(),
    top: 10000,
    skip: 0
  };

  const [acq, ratings, reviews] = await Promise.all([
    storeGet(env, "/appacquisitions", common),
    storeGet(env, "/ratings", common),
    storeGet(env, "/reviews", {
      applicationId: common.applicationId,
      startDate: common.startDate,
      endDate: common.endDate,
      top: 1,
      skip: 0,
      orderby: "date desc"
    })
  ]);

  const downloads = (Array.isArray(acq.Value) ? acq.Value : []).reduce(
    (sum, row) => sum + Number(row.acquisitionQuantity || 0), 0
  );

  const starCounts = { one: 0, two: 0, three: 0, four: 0, five: 0 };
  (Array.isArray(ratings.Value) ? ratings.Value : []).forEach(row => {
    starCounts.one += Number(row.oneStar || 0);
    starCounts.two += Number(row.twoStars || row.twoStar || 0);
    starCounts.three += Number(row.threeStars || row.threeStar || 0);
    starCounts.four += Number(row.fourStars || row.fourStar || 0);
    starCounts.five += Number(row.fiveStars || row.fiveStar || 0);
  });

  const ratingCount = starCounts.one + starCounts.two + starCounts.three + starCounts.four + starCounts.five;
  const ratingAverage = ratingCount
    ? (starCounts.one + starCounts.two * 2 + starCounts.three * 3 + starCounts.four * 4 + starCounts.five * 5) / ratingCount
    : 0;

  return {
    ok: true,
    app_id: common.applicationId,
    downloads,
    acquisitions: downloads,
    rating_average: ratingAverage,
    rating_count: ratingCount,
    review_count: Number(reviews.TotalCount || 0),
    stars: starCounts,
    freshness: acq.DataFreshnessTimestamp || ratings.DataFreshnessTimestamp || null,
    synced_at: new Date().toISOString()
  };
}

async function getStoreReviews(env, limit) {
  const appId = env.MS_STORE_APP_ID || STORE_APP_ID;
  const d = await storeGet(env, "/reviews", {
    applicationId: appId,
    startDate: LIFETIME_START,
    endDate: mmddyyyy(),
    top: limit,
    skip: 0,
    orderby: "date desc"
  });

  const reviews = (Array.isArray(d.Value) ? d.Value : []).map(row => ({
    id: row.id || "",
    date: row.date || "",
    reviewer_name: row.reviewerName || "",
    rating: Number(row.rating || 0),
    title: row.reviewTitle || "",
    text: row.reviewText || "",
    helpful_count: Number(row.helpfulCount || 0),
    response_date: row.responseDate || null,
    response_text: row.responseText || ""
  }));

  return {
    ok: true,
    app_id: appId,
    review_count: Number(d.TotalCount || reviews.length),
    reviews,
    synced_at: new Date().toISOString()
  };
}
