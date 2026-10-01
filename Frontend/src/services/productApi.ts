// Frontend/src/services/productApi.ts

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
  (import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

const STORE_API = `${API_BASE}/api/store`;
const SENTIMENT_API = `${API_BASE}/api/sentiment`;
const ANALYTICS_API = `${API_BASE}/api/analytics`;

// ============================================================
// COMMON TYPES
// ============================================================

export interface Product {
  id?: number | string;
  product_id?: number | string;

  product_name?: string;
  name?: string;
  model?: string;
  model_name?: string;

  brand?: string;
  product_brand?: string;

  price?: number | string;
  product_price?: number | string;

  rating?: number;
  product_rating?: number;
  overall_rating?: number;
  avg_rating?: number;

  image?: string;
  product_img?: string;
  image_url?: string;

  description?: string;

  review_count?: number;
  total_reviews?: number;

  stock?: number;
  is_active?: boolean;

  sentiment_score?: number;
  camera_score?: number;
  battery_score?: number;
  performance_score?: number;

  specs?: Record<string, any>;

  created_at?: string;

  [key: string]: any;
}

export interface Review {
  id?: number | string;
  review_id?: number | string;

  product_id?: number | string;

  reviewer?: string;
  reviewer_name?: string;
  username?: string;
  user?: string;

  review?: string;
  review_text?: string;
  review_description?: string;
  body?: string;

  review_title?: string;
  title?: string;

  rating?: number;
  review_rating?: number;

  sentiment?: string;

  is_fake?: boolean | number;

  fake_probability?: number;

  confidence?: number;

  [key: string]: any;
}

// ============================================================
// KEYWORD DRILLDOWN TYPES
// ============================================================

export interface KeywordDrilldownResponse {
  keyword: string;

  selected_product: string;

  error?: string;

  summary: {
    mentions: number;
    sentiment_pct: number;
    impact: string;
  };

  distribution: {
    positive: number;
    positive_pct: number;

    neutral: number;
    neutral_pct: number;

    negative: number;
    negative_pct: number;
  };

  trend: Array<{
    month: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }>;

  top_reviews: {
    positive: string;
    negative: string;
  };

  related_terms: string[];

  top_products: Array<{
    name: string;
    mentions: number;
    sentiment_pct: number;
  }>;

  reviews?: Review[];

  [key: string]: any;
}

// ============================================================
// EXPLAIN REVIEW
// ============================================================

export interface ExplainReviewResponse {
  review_text: string;
  predicted_category: string;
  confidence: number;
  influencing_words: string[];
  category_probabilities: Record<string, number>;
  explanation?: string;
  sentiment?: string;

  [key: string]: any;
}

// ============================================================
// REVIEW ANALYSIS
// ============================================================

export interface ReviewAnalysisResponse {
  reviews: any[];
  stats: any;
  product: string;
}

// ============================================================
// FAKE REVIEW
// ============================================================

export interface FakeReviewResult {
  is_fake: boolean;
  confidence: number;
  label?: string;
  fake_type?: string | null;
  reasons?: string[];
  risk_score?: number;
  signals?: Record<string, boolean>;
}

// ============================================================
// HELPER
// ============================================================

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

// ============================================================
// NORMALIZE PRODUCT
// ============================================================

function normalizeProduct(product: any): Product {
  return {
    ...product,

    id: product?.id ?? product?.product_id,

    product_id:
      product?.product_id ??
      product?.id,

    model:
      product?.model ??
      product?.model_name ??
      product?.name ??
      product?.product_name,

    model_name:
      product?.model_name ??
      product?.model ??
      product?.name ??
      product?.product_name,

    name:
      product?.name ??
      product?.product_name ??
      product?.model ??
      product?.model_name,

    product_name:
      product?.product_name ??
      product?.name ??
      product?.model ??
      product?.model_name,

    brand:
      product?.brand ??
      product?.product_brand ??
      "",
  };
}

// ============================================================
// NORMALIZE SEARCH TEXT
// ============================================================

function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ============================================================
// SEARCH PRODUCTS
// ============================================================

export async function searchProducts(
  query: string
): Promise<Product[]> {
  const products = await fetchProducts();

  const search = normalizeSearchText(query);

  if (!search) {
    return products;
  }

  return products.filter((product) => {
    const values = [
      product.brand,
      product.name,
      product.product_name,
      product.model,
      product.model_name,
    ]
      .filter(Boolean)
      .map(normalizeSearchText);

    return values.some(
      (value) =>
        value === search ||
        value.includes(search) ||
        search.includes(value)
    );
  });
}

// ============================================================
// FETCH ALL PRODUCTS
// ============================================================

export async function fetchProducts(): Promise<Product[]> {
  const data = await request<any>(
    `${STORE_API}/products/`
  );

  let products: any[] = [];

  if (Array.isArray(data)) {
    products = data;
  } else if (Array.isArray(data?.products)) {
    products = data.products;
  } else if (Array.isArray(data?.results)) {
    products = data.results;
  }

  return products.map(normalizeProduct);
}

// ============================================================
// FIND PRODUCT FROM LIST
// ============================================================

function findMatchingProduct(
  products: Product[],
  productName: string
): Product | null {
  const search = normalizeSearchText(productName);

  if (!search) {
    return null;
  }

  // ----------------------------------------------------------
  // 1. Exact match
  // ----------------------------------------------------------

  const exactMatch = products.find((product) => {
    const values = [
      product.name,
      product.product_name,
      product.model,
      product.model_name,
    ]
      .filter(Boolean)
      .map(normalizeSearchText);

    return values.includes(search);
  });

  if (exactMatch) {
    return exactMatch;
  }

  // ----------------------------------------------------------
  // 2. Brand + model matching
  // ----------------------------------------------------------

  const brandModelMatch = products.find((product) => {
    const brand = normalizeSearchText(product.brand);

    const model = normalizeSearchText(
      product.model ??
        product.model_name ??
        product.name ??
        product.product_name
    );

    const combined = `${brand} ${model}`.trim();

    return (
      combined === search ||
      combined.includes(search) ||
      search.includes(combined)
    );
  });

  if (brandModelMatch) {
    return brandModelMatch;
  }

  // ----------------------------------------------------------
  // 3. Partial match
  // ----------------------------------------------------------

  const partialMatch = products.find((product) => {
    const values = [
      product.name,
      product.product_name,
      product.model,
      product.model_name,
    ]
      .filter(Boolean)
      .map(normalizeSearchText);

    return values.some(
      (value) =>
        value.includes(search) ||
        search.includes(value)
    );
  });

  return partialMatch ?? null;
}

// ============================================================
// FETCH PRODUCT DETAILS
// ============================================================

export async function fetchProductDetails(
  productName: string
): Promise<Product | null> {
  const cleanName = productName.trim();

  if (!cleanName) {
    console.warn(
      "fetchProductDetails called with empty product name"
    );

    return null;
  }

  try {
    console.log(
      `[Product API] Searching for product: "${cleanName}"`
    );

    // --------------------------------------------------------
    // STEP 1: Get all products
    // --------------------------------------------------------

    const products = await fetchProducts();

    console.log(
      `[Product API] Backend returned ${products.length} products`
    );

    if (!products.length) {
      console.error(
        "[Product API] Backend returned an empty product list"
      );

      return null;
    }

    // --------------------------------------------------------
    // STEP 2: Find matching product
    // --------------------------------------------------------

    const matchedProduct = findMatchingProduct(
      products,
      cleanName
    );

    if (!matchedProduct) {
      console.error(
        `[Product API] Product "${cleanName}" was not found`
      );

      console.log(
        "[Product API] Available products:",
        products.map((product) => ({
          id: product.id,
          name: product.name,
          model: product.model,
          brand: product.brand,
        }))
      );

      return null;
    }

    console.log(
      "[Product API] Matched product:",
      matchedProduct
    );

    // --------------------------------------------------------
    // STEP 3: Get product ID
    // --------------------------------------------------------

    const productId =
      matchedProduct.id ??
      matchedProduct.product_id;

    if (
      productId === undefined ||
      productId === null ||
      productId === ""
    ) {
      console.warn(
        "[Product API] Matched product does not have an ID. Returning list data."
      );

      return matchedProduct;
    }

    // --------------------------------------------------------
    // STEP 4: Fetch detailed product
    // --------------------------------------------------------

    const detailUrl =
      `${STORE_API}/products/${encodeURIComponent(
        String(productId)
      )}/`;

    console.log(
      `[Product API] Fetching product details: ${detailUrl}`
    );

    const details = await request<any>(
      detailUrl
    );

    // --------------------------------------------------------
    // STEP 5: Normalize detailed product
    // --------------------------------------------------------

    const normalizedDetails =
      normalizeProduct(details);

    console.log(
      "[Product API] Product details loaded:",
      normalizedDetails
    );

    return normalizedDetails;
  } catch (error) {
    console.error(
      `[Product API] fetchProductDetails failed for "${cleanName}":`,
      error
    );

    throw error;
  }
}

// ============================================================
// FETCH ALL REVIEWS
// ============================================================

export async function fetchAllReviews(
  productId?: number | string,
  options: Record<string, any> = {}
): Promise<ReviewAnalysisResponse> {
  const productName = String(
    options.name ?? productId ?? ""
  );

  const params = new URLSearchParams({
    name: productName,
  });

  const data = await request<any>(
    `${ANALYTICS_API}/all-reviews/?${params.toString()}`
  );

  return {
    product: productName,

    reviews: Array.isArray(data?.reviews)
      ? data.reviews
      : Array.isArray(data)
      ? data
      : [],

    stats: data?.stats ?? {},
  };
}

// ============================================================
// SUBMIT REVIEW
// ============================================================

export async function submitReview(
  productId: number | string,
  review: {
    rating: number;
    title: string;
    body: string;
  },
  token: string | null
): Promise<any> {
  return request<any>(
    `${STORE_API}/products/${productId}/reviews/submit/`,
    {
      method: "POST",

      body: JSON.stringify(review),

      headers: token
        ? {
            Authorization: `Token ${token}`,
          }
        : {},
    }
  );
}

// ============================================================
// FETCH PRODUCTS FOR KEYWORD
// ============================================================

export async function fetchKeywordProducts(
  keyword: string = ""
): Promise<{
  products: string[];
}> {
  const query = keyword.trim()
    ? `?keyword=${encodeURIComponent(
        keyword.trim()
      )}`
    : "";

  const url =
    `${ANALYTICS_API}/keyword-products/${query}`;

  try {
    const data: any = await request<any>(url);

    const products = Array.isArray(data)
      ? data
      : data?.products ?? [];

    return {
      products: products
        .map((item: any) =>
          typeof item === "string"
            ? item
            : item?.product_name ||
              item?.name ||
              item?.model ||
              ""
        )
        .filter(Boolean),
    };
  } catch (error) {
    console.error(
      "fetchKeywordProducts error:",
      error
    );

    throw error;
  }
}

// ============================================================
// KEYWORD DRILLDOWN
// ============================================================

export async function fetchKeywordDrilldown(
  keyword: string,
  selectedProduct: string = "all"
): Promise<KeywordDrilldownResponse> {
  const cleanKeyword = keyword.trim();

  const params = new URLSearchParams();

  params.set("keyword", cleanKeyword);

  if (
    selectedProduct &&
    selectedProduct.toLowerCase() !== "all"
  ) {
    params.set("product", selectedProduct);
  }

  const url =
    `${ANALYTICS_API}/keyword-drilldown/?${params.toString()}`;

  try {
    const data: any =
      await request<any>(url);

    return {
      keyword:
        data?.keyword ||
        cleanKeyword,

      selected_product:
        data?.selected_product ||
        selectedProduct,

      summary: {
        mentions: Number(
          data?.summary?.mentions ??
            data?.mentions ??
            0
        ),

        sentiment_pct: Number(
          data?.summary?.sentiment_pct ??
            data?.sentiment_pct ??
            0
        ),

        impact:
          data?.summary?.impact ??
          data?.impact ??
          "Unknown",
      },

      distribution: {
        positive: Number(
          data?.distribution?.positive ??
            data?.positive ??
            0
        ),

        positive_pct: Number(
          data?.distribution?.positive_pct ??
            data?.positive_pct ??
            0
        ),

        neutral: Number(
          data?.distribution?.neutral ??
            data?.neutral ??
            0
        ),

        neutral_pct: Number(
          data?.distribution?.neutral_pct ??
            data?.neutral_pct ??
            0
        ),

        negative: Number(
          data?.distribution?.negative ??
            data?.negative ??
            0
        ),

        negative_pct: Number(
          data?.distribution?.negative_pct ??
            data?.negative_pct ??
            0
        ),
      },

      trend: Array.isArray(data?.trend)
        ? data.trend
        : [],

      top_reviews:
        data?.top_reviews ?? {
          positive: "",
          negative: "",
        },

      related_terms:
        Array.isArray(data?.related_terms)
          ? data.related_terms
          : [],

      top_products:
        Array.isArray(data?.top_products)
          ? data.top_products
          : [],

      reviews:
        Array.isArray(data?.reviews)
          ? data.reviews
          : [],

      ...data,
    };
  } catch (error) {
    console.error(
      "fetchKeywordDrilldown error:",
      error
    );

    throw error;
  }
}

// ============================================================
// EXPLAIN REVIEW
// ============================================================

export async function explainReview(
  review: Review | string
): Promise<ExplainReviewResponse> {
  const reviewText =
    typeof review === "string"
      ? review
      : review.review_text ||
        review.review ||
        review.review_description ||
        review.body ||
        "";

  try {
    const data = await request<any>(
      `${ANALYTICS_API}/review-explain/`,
      {
        method: "POST",

        body: JSON.stringify({
          text: reviewText,
        }),
      }
    );

    return {
      review_text:
        data?.review_text ??
        reviewText,

      predicted_category:
        data?.predicted_category ??
        "general",

      confidence:
        Number(data?.confidence ?? 0),

      influencing_words:
        Array.isArray(
          data?.influencing_words
        )
          ? data.influencing_words
          : [],

      category_probabilities:
        data?.category_probabilities ??
        {},

      explanation:
        data?.explanation,

      sentiment:
        data?.sentiment,
    };
  } catch (error) {
    console.error(
      "explainReview error:",
      error
    );

    throw error;
  }
}

// ============================================================
// GET PRODUCT SENTIMENT
// ============================================================

export async function fetchProductSentiment(
  productName: string
): Promise<any> {
  const url =
    `${SENTIMENT_API}/product` +
    `?product_name=${encodeURIComponent(
      productName
    )}`;

  return request<any>(url);
}

// ============================================================
// GET PRODUCT ANALYTICS
// ============================================================

export async function fetchProductAnalytics(
  productName: string
): Promise<any> {
  const url =
    `${ANALYTICS_API}/product` +
    `?product_name=${encodeURIComponent(
      productName
    )}`;

  return request<any>(url);
}

// ============================================================
// GET TRENDING PRODUCTS
// ============================================================

export async function fetchTrendingProducts(): Promise<
  Product[]
> {
  try {
    const data: any =
      await request<any>(
        `${STORE_API}/products/`
      );

    let products: any[] = [];

    if (Array.isArray(data)) {
      products = data;
    } else if (
      Array.isArray(data?.products)
    ) {
      products = data.products;
    } else if (
      Array.isArray(data?.results)
    ) {
      products = data.results;
    }

    return products.map(normalizeProduct);
  } catch (error) {
    console.error(
      "fetchTrendingProducts error:",
      error
    );

    throw error;
  }
}

// ============================================================
// GET SUMMARY
// ============================================================

export async function fetchSummary(
  productName: string
): Promise<any> {
  const params = new URLSearchParams({
    name: productName,
  });

  return request<any>(
    `${ANALYTICS_API}/summary/?${params.toString()}`
  );
}

// ============================================================
// CUSTOMERS SAY
// ============================================================

export async function fetchCustomersSay(
  productName: string
): Promise<any> {
  const params = new URLSearchParams({
    name: productName,
  });

  return request<any>(
    `${ANALYTICS_API}/customers-say/?${params.toString()}`
  );
}

// ============================================================
// DASHBOARD
// ============================================================

export async function fetchDashboard(): Promise<any> {
  return request<any>(
    `${ANALYTICS_API}/dashboard/`
  );
}

// ============================================================
// KEYWORD IMPACT
// ============================================================

export async function fetchKeywordImpact(): Promise<
  any[]
> {
  const data =
    await request<any>(
      `${ANALYTICS_API}/keyword-impact/`
    );

  return Array.isArray(data)
    ? data
    : data?.keywords ?? [];
}

// ============================================================
// SENTIMENT TREND
// ============================================================

export async function fetchSentimentTrend(
  productName: string
): Promise<{
  trend: Array<{
    month: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
}> {
  const params = new URLSearchParams({
    name: productName,
  });

  return request(
    `${ANALYTICS_API}/sentiment-trend/?${params.toString()}`
  );
}

// ============================================================
// COMPARE PRODUCTS
// ============================================================

export async function compareProducts(
  products: string[]
): Promise<any[]> {
  const data =
    await request<any>(
      `${ANALYTICS_API}/compare/`,
      {
        method: "POST",

        body: JSON.stringify({
          products,
        }),
      }
    );

  return Array.isArray(data)
    ? data
    : data?.products ?? [];
}

// ============================================================
// DETECT FAKE REVIEW
// ============================================================

export async function detectFakeReview(
  review:
    | string
    | {
        text: string;
        rating?: number | null;
      },
  rating?: number
): Promise<FakeReviewResult> {
  const payload =
    typeof review === "string"
      ? {
          text: review,
          rating,
        }
      : review;

  return request<FakeReviewResult>(
    `${ANALYTICS_API}/fake-review/`,
    {
      method: "POST",

      body: JSON.stringify(payload),
    }
  );
}

// ============================================================
// DELETE REVIEW
// ============================================================

export async function deleteReview(
  productId: number | string,
  reviewId: number | string,
  token: string | null
): Promise<void> {
  await request<void>(
    `${STORE_API}/products/${productId}/reviews/${reviewId}/delete/`,
    {
      method: "DELETE",

      headers: token
        ? {
            Authorization: `Token ${token}`,
          }
        : {},
    }
  );
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

const productApi = {
  searchProducts,

  fetchProducts,

  fetchProductDetails,

  fetchAllReviews,

  submitReview,

  fetchKeywordProducts,

  fetchKeywordDrilldown,

  explainReview,

  fetchProductSentiment,

  fetchProductAnalytics,

  fetchTrendingProducts,

  fetchSummary,

  fetchCustomersSay,

  fetchDashboard,

  fetchKeywordImpact,

  fetchSentimentTrend,

  compareProducts,

  detectFakeReview,

  deleteReview,
};

export default productApi;