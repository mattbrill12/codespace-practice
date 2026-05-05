import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type ApiItem = {
  id: number;
  name: string;
  categoryId: number;
};

type Favorite = {
  itemId: number;
};

type Category = {
  id: number;
  label: string;
};

type ItemViewModel = {
  id: number;
  name: string;
  categoryLabel: string;
  isFavorite: boolean;
};

const MOCK_ITEMS: ApiItem[] = [
  { id: 1, name: "Running Shoes", categoryId: 1 },
  { id: 2, name: "Backpack", categoryId: 2 },
  { id: 3, name: "Water Bottle", categoryId: 3 },
];

const MOCK_FAVORITES: Favorite[] = [{ itemId: 2 }];

const MOCK_CATEGORIES: Category[] = [
  { id: 1, label: "Footwear" },
  { id: 2, label: "Bags" },
  { id: 3, label: "Accessories" },
];

async function fetchItems(): Promise<ApiItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ITEMS;
}

async function fetchFavorites(): Promise<Favorite[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_FAVORITES;
}

async function fetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_CATEGORIES;
}

async function fetchPosts(): Promise<any[]> {
  return await api('https://jsonplaceholder.typicode.com/posts')
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function App() {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isPending: isItemsPending,
    isError: isItemsError,
    error: itemsError,
  } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const { data: posts = []} = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  console.log(posts)

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const favoriteIds = new Set(favorites.map((favorite) => favorite.itemId));

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const viewItems: ItemViewModel[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    categoryLabel: categoryById.get(item.categoryId)?.label ?? "Unknown",
    isFavorite: favoriteIds.has(item.id),
  }));

  const toggleFavoriteMutation = useMutation<
    number, // return type
    Error, // error type
    number, // variables (itemId)
    { previousFavorites: Favorite[] } // context
  >({
    mutationFn: async (itemId) => {
      return itemId;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      const previousFavorites =
        queryClient.getQueryData<Favorite[]>(["favorites"]) ?? [];

      const isAlreadyFavorite = previousFavorites.some(
        (fav) => fav.itemId === itemId,
      );

      const nextFavorites = isAlreadyFavorite
        ? previousFavorites.filter((fav) => fav.itemId !== itemId)
        : [...previousFavorites, { itemId }];

      queryClient.setQueryData<Favorite[]>(["favorites"], nextFavorites);

      return { previousFavorites };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
    },
  });

  return (
    <main className="app">
      <section className="card">
        <h1>Items</h1>

        {isItemsPending && <p>Loading...</p>}

        {isItemsError && (
          <p role="alert">
            {itemsError instanceof Error
              ? itemsError.message
              : "Failed to load items"}
          </p>
        )}

        {!isItemsPending && !isItemsError && (
          <ul className="item-list">
            {viewItems.map((item) => (
              <li className="item-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.categoryLabel}</p>
                </div>

                <span>
                  {item.isFavorite ? "★ Favorited" : "☆ Not favorited"}
                </span>

                <button onClick={() => toggleFavoriteMutation.mutate(item.id)}>
                  {item.isFavorite ? "Unfavorite" : "Favorite"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
