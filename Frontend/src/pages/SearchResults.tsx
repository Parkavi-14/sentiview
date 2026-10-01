import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Search,
  ArrowLeft,
  Star,
  Loader2,
  AlertCircle,
  Clock3,
  X,
  Trash2,
  ArrowUp,
} from "lucide-react";

import {
  searchProducts,
  Product,
} from "../services/productApi";
import { useApp } from "../context/AppContext";


/* =========================================================
   CONSTANTS
========================================================= */

const HISTORY_KEY = "sentiview_search_history";

const DEFAULT_SUGGESTIONS = [
  "Samsung",
  "Samsung Galaxy S24",
  "Samsung Galaxy S23",
  "Samsung Galaxy S25",
  "iPhone 15",
  "iPhone 15 Pro",
  "iPhone 16",
  "iPhone 16 Pro",
  "Google Pixel",
  "Google Pixel 8",
  "Google Pixel 9",
  "OnePlus",
  "OnePlus 12",
  "OnePlus 13",
  "Redmi",
  "Realme",
  "Sony",
  "Sony headphones",
  "boAt",
  "Laptop",
  "Headphones",
  "Smartwatch",
];


/* =========================================================
   COMPONENT
========================================================= */

export default function SearchResults() {

  const {
    searchQuery: appSearchQuery,
    setCurrentPage,
  } = useApp();

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();


  /* =======================================================
     SEARCH STATE
  ======================================================= */

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState("");


  /* =======================================================
     PRODUCT STATE
  ======================================================= */

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     AUTOCOMPLETE STATE
  ======================================================= */

  const [
    showSuggestions,
    setShowSuggestions,
  ] = useState(false);

  const [
    selectedSuggestion,
    setSelectedSuggestion,
  ] = useState(-1);


  /* =======================================================
     HISTORY STATE
  ======================================================= */

  const [
    searchHistory,
    setSearchHistory,
  ] = useState<string[]>([]);


  /* =======================================================
     REFERENCE
  ======================================================= */

  const searchBoxRef =
    useRef<HTMLDivElement>(null);


  /* =======================================================
     LOAD SEARCH HISTORY
  ======================================================= */

  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          HISTORY_KEY
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (Array.isArray(parsed)) {

        setSearchHistory(
          parsed.filter(
            (item): item is string =>
              typeof item === "string"
          )
        );

      }

    } catch (err) {

      console.warn(
        "Unable to load search history:",
        err
      );

    }

  }, []);


  /* =======================================================
     SAVE HISTORY
  ======================================================= */

  function saveSearchHistory(
    search: string
  ) {

    const cleanSearch =
      search.trim();

    if (!cleanSearch) {
      return;
    }

    const updatedHistory = [
      cleanSearch,
      ...searchHistory.filter(
        (item) =>
          item.toLowerCase() !==
          cleanSearch.toLowerCase()
      ),
    ].slice(0, 10);


    setSearchHistory(
      updatedHistory
    );


    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        updatedHistory
      )
    );

  }


  /* =======================================================
     DELETE ONE HISTORY ITEM
  ======================================================= */

  function deleteHistoryItem(
    item: string
  ) {

    const updatedHistory =
      searchHistory.filter(
        (historyItem) =>
          historyItem !== item
      );

    setSearchHistory(
      updatedHistory
    );

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        updatedHistory
      )
    );

  }


  /* =======================================================
     CLEAR ALL HISTORY
  ======================================================= */

  function clearHistory() {

    setSearchHistory([]);

    localStorage.removeItem(
      HISTORY_KEY
    );

  }


  /* =======================================================
     GET SUGGESTIONS
  ======================================================= */

  function getSuggestions(): string[] {

    const input =
      searchText
        .trim()
        .toLowerCase();


    /*
      When the input is empty:

      Show recent history first.
    */

    if (!input) {

      return searchHistory
        .slice(0, 6);

    }


    /*
      Combine:

      1. Search history
      2. Default suggestions
    */

    const combined = [
      ...searchHistory,
      ...DEFAULT_SUGGESTIONS,
    ];


    /*
      Remove duplicates.
    */

    const unique =
      Array.from(
        new Map(
          combined.map(
            (item) => [
              item.toLowerCase(),
              item,
            ]
          )
        ).values()
      );


    /*
      Match anywhere in the string.
    */

    return unique
      .filter(
        (item) =>
          item
            .toLowerCase()
            .includes(input)
      )
      .slice(0, 8);

  }


  const suggestions =
    getSuggestions();


  /* =======================================================
     URL QUERY
  ======================================================= */

  useEffect(() => {

    const urlQuery =
      searchParams.get("q") ||
      searchParams.get("query") ||
      appSearchQuery;

    const cleanQuery =
      urlQuery.trim();

    setQuery(cleanQuery);

    setSearchText(cleanQuery);


    if (!cleanQuery) {

      setProducts([]);

      setError("");

      return;

    }


    loadProducts(
      cleanQuery
    );

  }, [searchParams, appSearchQuery]);


  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  async function loadProducts(
    searchQuery: string
  ) {

    setLoading(true);

    setError("");


    try {

      const result =
        await searchProducts(
          searchQuery
        );

      setProducts(
        result
      );

    } catch (err) {

      console.error(
        "Search failed:",
        err
      );

      setProducts([]);

      setError(
        "Unable to load products. Make sure the Django backend is running."
      );

    } finally {

      setLoading(false);

    }

  }


  /* =======================================================
     SEARCH
  ======================================================= */

  function performSearch(
    value: string
  ) {

    const cleanQuery =
      value.trim();

    if (!cleanQuery) {
      return;
    }


    /*
      Save search to history.
    */

    saveSearchHistory(
      cleanQuery
    );


    /*
      Hide autocomplete.
    */

    setShowSuggestions(
      false
    );

    setSelectedSuggestion(
      -1
    );


    /*
      Navigate to results.
    */

    navigate(
      `/search?q=${encodeURIComponent(
        cleanQuery
      )}`
    );

  }


  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  function handleSearch(
    event: FormEvent
  ) {

    event.preventDefault();

    performSearch(
      searchText
    );

  }


  /* =======================================================
     SELECT SUGGESTION
  ======================================================= */

  function handleSuggestionClick(
    suggestion: string
  ) {

    setSearchText(
      suggestion
    );

    performSearch(
      suggestion
    );

  }


  /* =======================================================
     KEYBOARD NAVIGATION
  ======================================================= */

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {

    if (!showSuggestions) {

      if (event.key === "ArrowDown") {

        setShowSuggestions(
          true
        );

        event.preventDefault();

      }

      return;

    }


    if (
      event.key === "ArrowDown"
    ) {

      event.preventDefault();

      setSelectedSuggestion(
        (previous) => {

          if (
            suggestions.length === 0
          ) {
            return -1;
          }

          return (
            previous + 1
          ) %
          suggestions.length;

        }
      );

      return;

    }


    if (
      event.key === "ArrowUp"
    ) {

      event.preventDefault();

      setSelectedSuggestion(
        (previous) => {

          if (
            suggestions.length === 0
          ) {
            return -1;
          }

          if (previous <= 0) {
            return (
              suggestions.length - 1
            );
          }

          return previous - 1;

        }
      );

      return;

    }


    if (
      event.key === "Enter"
    ) {

      event.preventDefault();


      if (
        selectedSuggestion >= 0 &&
        suggestions[
          selectedSuggestion
        ]
      ) {

        handleSuggestionClick(
          suggestions[
            selectedSuggestion
          ]
        );

      } else {

        performSearch(
          searchText
        );

      }

      return;

    }


    if (
      event.key === "Escape"
    ) {

      setShowSuggestions(
        false
      );

      setSelectedSuggestion(
        -1
      );

    }

  }


  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {

    function handleOutsideClick(
      event: MouseEvent
    ) {

      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(
          event.target as Node
        )
      ) {

        setShowSuggestions(
          false
        );

      }

    }


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  /* =======================================================
     PRODUCT HELPERS
  ======================================================= */

  function getProductName(
    product: Product
  ): string {

    return String(
      product.name ??
      product.product_name ??
      product.title ??
      "Unknown Product"
    );

  }


  function getPrice(
    product: Product
  ): string {

    if (
      product.price ===
        undefined ||
      product.price === null ||
      product.price === ""
    ) {

      return "Price unavailable";

    }


    const numericPrice =
      Number(
        product.price
      );


    if (
      !Number.isNaN(
        numericPrice
      )
    ) {

      return `₹${numericPrice.toLocaleString(
        "en-IN"
      )}`;

    }


    return String(
      product.price
    );

  }


  function getRating(
    product: Product
  ): string {

    if (
      product.rating ===
        undefined ||
      product.rating === null
    ) {

      return "N/A";

    }

    return String(
      product.rating
    );

  }


  /* =======================================================
     OPEN PRODUCT
  ======================================================= */

  function openProduct(
    product: Product
  ) {

    navigate(
      `/product/${product.id}`
    );

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div
      className="
        min-h-screen
        bg-slate-950
        text-white
      "
    >

      <div
        className="
          max-w-6xl
          mx-auto
          px-6
          pt-32
          pb-16
        "
      >

        {/* =================================================
            BACK
        ================================================= */}

        <button
          onClick={() => {
            setCurrentPage("home");
            navigate("/");
          }}
          className="
            flex
            items-center
            gap-2
            text-slate-400
            hover:text-white
            mb-8
            transition
          "
        >

          <ArrowLeft size={18} />

          Back to Home

        </button>


        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mb-8">

          <div
            className="
              flex
              items-center
              gap-3
              mb-3
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gradient-to-br
                from-indigo-500
                to-cyan-500
                flex
                items-center
                justify-center
              "
            >

              <Search size={22} />

            </div>


            <h1
              className="
                text-3xl
                font-bold
              "
            >
              Search Products
            </h1>

          </div>


          <p
            className="
              text-slate-400
            "
          >
            Search products and explore
            their sentiment insights.
          </p>

        </div>


        {/* =================================================
            SEARCH BOX
        ================================================= */}

        <form
          onSubmit={handleSearch}
          className="
            max-w-3xl
            mb-10
          "
        >

          <div
            ref={searchBoxRef}
            className="
              relative
            "
          >

            {/* INPUT */}

            <div
              className="
                flex
                gap-3
              "
            >

              <div
                className="
                  flex-1
                  relative
                "
              >

                <Search
                  size={20}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />


                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => {

                    setSearchText(
                      event.target.value
                    );

                    setShowSuggestions(
                      true
                    );

                    setSelectedSuggestion(
                      -1
                    );

                  }}
                  onFocus={() =>
                    setShowSuggestions(
                      true
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  placeholder="Search any product..."
                  autoComplete="off"
                  className="
                    w-full
                    bg-slate-900
                    border
                    border-slate-700
                    rounded-xl
                    py-4
                    pl-12
                    pr-12
                    text-white
                    outline-none
                    focus:border-indigo-500
                    focus:ring-1
                    focus:ring-indigo-500
                  "
                />


                {/* CLEAR INPUT */}

                {searchText && (

                  <button
                    type="button"
                    onClick={() => {

                      setSearchText("");

                      setShowSuggestions(
                        true
                      );

                    }}
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-500
                      hover:text-white
                    "
                  >

                    <X size={18} />

                  </button>

                )}

              </div>


              {/* SEARCH BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !searchText.trim()
                }
                className="
                  px-7
                  rounded-xl
                  bg-gradient-to-r
                  from-indigo-600
                  to-cyan-500
                  font-semibold
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                {loading ? (

                  <Loader2
                    size={20}
                    className="
                      animate-spin
                    "
                  />

                ) : (

                  "Search"

                )}

              </button>

            </div>


            {/* =================================================
                AUTOCOMPLETE / HISTORY DROPDOWN
            ================================================= */}

            {showSuggestions &&
              suggestions.length > 0 && (

              <div
                className="
                  absolute
                  z-50
                  left-0
                  right-[112px]
                  mt-2
                  bg-slate-900
                  border
                  border-slate-700
                  rounded-xl
                  shadow-2xl
                  overflow-hidden
                "
              >

                {/* HEADER */}

                <div
                  className="
                    px-4
                    py-3
                    border-b
                    border-slate-800
                    flex
                    items-center
                    justify-between
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      text-slate-400
                    "
                  >

                    {searchText.trim()
                      ? (
                        <Search size={15} />
                      )
                      : (
                        <Clock3 size={15} />
                      )}

                    <span>
                      {searchText.trim()
                        ? "Suggestions"
                        : "Recent searches"}
                    </span>

                  </div>


                  {!searchText.trim() &&
                    searchHistory.length > 0 && (

                    <button
                      type="button"
                      onClick={
                        clearHistory
                      }
                      className="
                        text-xs
                        text-red-400
                        hover:text-red-300
                        flex
                        items-center
                        gap-1
                      "
                    >

                      <Trash2
                        size={13}
                      />

                      Clear history

                    </button>

                  )}

                </div>


                {/* ITEMS */}

                {suggestions.map(
                  (
                    suggestion,
                    index
                  ) => {

                    const isHistory =
                      searchHistory.some(
                        (item) =>
                          item.toLowerCase() ===
                          suggestion.toLowerCase()
                      );


                    return (

                      <div
                        key={`${suggestion}-${index}`}
                        className={`
                          flex
                          items-center
                          gap-3
                          px-4
                          py-3
                          cursor-pointer
                          transition
                          ${
                            selectedSuggestion ===
                            index
                              ? "bg-slate-800"
                              : "hover:bg-slate-800"
                          }
                        `}
                        onMouseDown={(event) => {

                          event.preventDefault();

                          handleSuggestionClick(
                            suggestion
                          );

                        }}
                      >

                        {/* ICON */}

                        {isHistory ? (

                          <Clock3
                            size={17}
                            className="
                              text-slate-500
                              shrink-0
                            "
                          />

                        ) : (

                          <Search
                            size={17}
                            className="
                              text-slate-500
                              shrink-0
                            "
                          />

                        )}


                        {/* TEXT */}

                        <span
                          className="
                            flex-1
                            text-sm
                          "
                        >
                          {suggestion}
                        </span>


                        {/* HISTORY DELETE */}

                        {isHistory && (

                          <button
                            type="button"
                            onMouseDown={(
                              event
                            ) => {

                              event.preventDefault();

                              deleteHistoryItem(
                                suggestion
                              );

                            }}
                            className="
                              p-1
                              text-slate-600
                              hover:text-red-400
                            "
                          >

                            <X
                              size={15}
                            />

                          </button>

                        )}


                        {/* KEYBOARD INDICATOR */}

                        {selectedSuggestion ===
                          index && (

                          <ArrowUp
                            size={14}
                            className="
                              text-slate-500
                            "
                          />

                        )}

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </div>

        </form>


        {/* =================================================
            EMPTY QUERY
        ================================================= */}

        {!query &&
          !loading && (

          <div
            className="
              border
              border-slate-800
              bg-slate-900
              rounded-2xl
              p-12
              text-center
            "
          >

            <Search
              size={45}
              className="
                mx-auto
                mb-4
                text-slate-600
              "
            />

            <h2
              className="
                text-xl
                font-semibold
                mb-2
              "
            >
              Search for a product
            </h2>

            <p
              className="
                text-slate-400
              "
            >
              Enter a product name above
              to begin.
            </p>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="
              flex
              items-start
              gap-3
              bg-red-950/40
              border
              border-red-800
              rounded-xl
              p-5
              mb-8
            "
          >

            <AlertCircle
              size={22}
              className="
                text-red-400
                shrink-0
              "
            />

            <div>

              <h3
                className="
                  font-semibold
                  text-red-300
                  mb-1
                "
              >
                Search failed
              </h3>

              <p
                className="
                  text-sm
                  text-red-400
                "
              >
                {error}
              </p>

            </div>

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div
            className="
              py-16
              text-center
            "
          >

            <Loader2
              size={40}
              className="
                mx-auto
                animate-spin
                text-indigo-500
              "
            />

            <p
              className="
                mt-4
                text-slate-400
              "
            >
              Searching for products...
            </p>

          </div>

        )}


        {/* =================================================
            RESULTS
        ================================================= */}

        {!loading &&
          query &&
          !error && (

          <>

            <div
              className="
                flex
                items-center
                justify-between
                mb-6
              "
            >

              <div>

                <h2
                  className="
                    text-2xl
                    font-bold
                  "
                >
                  Search Results
                </h2>

                <p
                  className="
                    text-slate-400
                    mt-1
                  "
                >

                  Results for:

                  {" "}

                  <span
                    className="
                      text-cyan-400
                      font-medium
                    "
                  >
                    "{query}"
                  </span>

                </p>

              </div>


              <span
                className="
                  text-sm
                  text-slate-400
                "
              >

                {products.length}

                {" "}

                product
                {products.length !== 1
                  ? "s"
                  : ""}

              </span>

            </div>


            {/* NO RESULTS */}

            {products.length === 0 && (

              <div
                className="
                  bg-slate-900
                  border
                  border-slate-800
                  rounded-2xl
                  p-12
                  text-center
                "
              >

                <Search
                  size={42}
                  className="
                    mx-auto
                    mb-4
                    text-slate-600
                  "
                />

                <h3
                  className="
                    text-xl
                    font-semibold
                    mb-2
                  "
                >
                  No products found
                </h3>

                <p
                  className="
                    text-slate-400
                  "
                >
                  Try another product name.
                </p>

              </div>

            )}


            {/* PRODUCTS */}

            {products.length > 0 && (

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-6
                "
              >

                {products.map(
                  (
                    product,
                    index
                  ) => (

                  <div
                    key={
                      product.id ??
                      index
                    }
                    className="
                      bg-slate-900
                      border
                      border-slate-800
                      rounded-2xl
                      overflow-hidden
                      hover:border-indigo-500
                      transition
                    "
                  >

                    {product.image ? (

                      <img
                        src={
                          product.image
                        }
                        alt={
                          getProductName(
                            product
                          )
                        }
                        className="
                          w-full
                          h-52
                          object-cover
                        "
                      />

                    ) : (

                      <div
                        className="
                          w-full
                          h-52
                          bg-gradient-to-br
                          from-indigo-900
                          to-slate-800
                          flex
                          items-center
                          justify-center
                        "
                      >

                        <span
                          className="
                            text-5xl
                            font-bold
                            text-indigo-400
                          "
                        >
                          {getProductName(
                            product
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                      </div>

                    )}


                    <div
                      className="
                        p-5
                      "
                    >

                      <h3
                        className="
                          text-lg
                          font-semibold
                          mb-3
                          line-clamp-2
                        "
                      >
                        {getProductName(
                          product
                        )}
                      </h3>


                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          mb-5
                        "
                      >

                        <span
                          className="
                            text-cyan-400
                            font-bold
                          "
                        >
                          {getPrice(
                            product
                          )}
                        </span>


                        <span
                          className="
                            flex
                            items-center
                            gap-1
                            text-amber-400
                          "
                        >

                          <Star
                            size={16}
                            fill="currentColor"
                          />

                          {getRating(
                            product
                          )}

                        </span>

                      </div>


                      <button
                        onClick={() =>
                          openProduct(
                            product
                          )
                        }
                        className="
                          w-full
                          py-3
                          rounded-xl
                          bg-indigo-600
                          hover:bg-indigo-500
                          font-semibold
                          transition
                        "
                      >
                        View Product
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </>

        )}

      </div>

    </div>

  );
}