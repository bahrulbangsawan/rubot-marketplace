# Recipe Sharing API with ElysiaJS

Here is a complete ElysiaJS REST API for your recipe sharing app with full Typebox validation, typed error responses, and search/filter/pagination support.

## Project Structure

```
src/
  routes/
    recipes.ts
  index.ts
```

## Implementation

### `src/routes/recipes.ts`

```typescript
import { Elysia, t, NotFoundError } from 'elysia';

// Cuisine enum values
const CUISINES = ['italian', 'mexican', 'japanese', 'indian', 'american'] as const;

// --- Typebox Schemas ---

const CuisineEnum = t.Union(
  CUISINES.map((c) => t.Literal(c)),
  { description: 'Cuisine type' }
);

const RecipeSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  ingredients: t.Array(t.String()),
  cook_time_minutes: t.Number(),
  cuisine: CuisineEnum,
  created_at: t.String(),
});

const CreateRecipeBody = t.Object({
  title: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String()),
  ingredients: t.Array(t.String(), { minItems: 1 }),
  cook_time_minutes: t.Number({ minimum: 1, multipleOf: 1 }),
  cuisine: CuisineEnum,
});

const ErrorResponse = t.Object({
  error: t.String(),
});

const ValidationErrorResponse = t.Object({
  error: t.String(),
  details: t.Optional(t.Any()),
});

const PaginatedRecipesResponse = t.Object({
  data: t.Array(RecipeSchema),
  pagination: t.Object({
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
    total_pages: t.Number(),
  }),
});

// --- In-memory store (replace with DB in production) ---

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  ingredients: string[];
  cook_time_minutes: number;
  cuisine: (typeof CUISINES)[number];
  created_at: string;
}

let recipes: Recipe[] = [];
let nextId = 1;

// --- Route Module ---

export const recipesRoutes = new Elysia({ prefix: '/api/recipes' })
  // GET /api/recipes — list with search, cuisine filter, pagination
  .get('/', ({ query }) => {
    let filtered = [...recipes];

    // Search by title or description
    if (query.q) {
      const search = query.q.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search))
      );
    }

    // Filter by cuisine
    if (query.cuisine) {
      filtered = filtered.filter((r) => r.cuisine === query.cuisine);
    }

    // Pagination
    const page = query.page;
    const limit = query.limit;
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      pagination: { page, limit, total, total_pages },
    };
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      cuisine: t.Optional(CuisineEnum),
      page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
      limit: t.Optional(t.Numeric({ default: 20, minimum: 1, maximum: 100 })),
    }),
    response: {
      200: PaginatedRecipesResponse,
    },
  })

  // POST /api/recipes — create a new recipe
  .post('/', ({ body, set }) => {
    const recipe: Recipe = {
      id: nextId++,
      title: body.title,
      description: body.description ?? null,
      ingredients: body.ingredients,
      cook_time_minutes: body.cook_time_minutes,
      cuisine: body.cuisine,
      created_at: new Date().toISOString(),
    };

    recipes.push(recipe);
    set.status = 201;
    return recipe;
  }, {
    body: CreateRecipeBody,
    response: {
      201: RecipeSchema,
      400: ValidationErrorResponse,
    },
  });
```

### `src/index.ts`

```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { recipesRoutes } from './routes/recipes';

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Recipe Sharing API',
        version: '1.0.0',
        description: 'A REST API for sharing and discovering recipes',
      },
    },
  }))
  // Global error handler for typed error responses
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return {
          error: 'Validation failed',
          details: error.all,
        };
      case 'NOT_FOUND':
        set.status = 404;
        return { error: 'Not found' };
      default:
        set.status = 500;
        return { error: 'Internal server error' };
    }
  })
  .use(recipesRoutes)
  .listen(3000);

console.log(`Recipe API running at ${app.server?.hostname}:${app.server?.port}`);

// Export type for Eden client consumers
export type App = typeof app;
```

## Key Design Decisions

1. **`t.Numeric()` for query/path params**: Query parameters arrive as strings. Using `t.Numeric()` (not `t.Number()`) coerces them to numbers automatically, which avoids the common "Validation error on valid data" pitfall.

2. **`t.Union` of `t.Literal` for cuisine**: This produces an exact enum constraint (`'italian' | 'mexican' | ...`) validated at runtime. Any value outside the set returns a 400 error automatically.

3. **`minItems: 1` on ingredients array**: Ensures at least one ingredient is provided. Empty arrays are rejected at the validation layer before the handler runs.

4. **`minimum: 1` + `multipleOf: 1` on cook_time_minutes**: `minimum: 1` enforces positive values, `multipleOf: 1` enforces integer values. Together they guarantee a positive integer.

5. **Route Module Pattern**: `recipesRoutes` is a standalone `Elysia({ prefix: '/api/recipes' })` instance, keeping it independently testable and composable via `.use()`.

6. **Response schemas on every route**: Defining `response: { 200: ..., 400: ... }` enables automatic OpenAPI/Swagger documentation generation and provides compile-time type safety on returned data.

7. **Method chaining unbroken**: The entire plugin is a single chained expression from `new Elysia()` through the last route, preserving full type inference throughout.

## Running

```bash
bun add elysia @elysiajs/cors @elysiajs/swagger
bun run src/index.ts
```

## Testing the Endpoints

```bash
# List recipes with pagination
curl "http://localhost:3000/api/recipes?page=1&limit=10"

# Search recipes
curl "http://localhost:3000/api/recipes?q=pasta&cuisine=italian"

# Create a recipe
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spaghetti Carbonara",
    "description": "Classic Roman pasta dish",
    "ingredients": ["spaghetti", "guanciale", "eggs", "pecorino romano", "black pepper"],
    "cook_time_minutes": 25,
    "cuisine": "italian"
  }'

# Validation error — title too short
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "ab", "ingredients": ["flour"], "cook_time_minutes": 10, "cuisine": "italian"}'
# Returns 400 with validation error details

# Validation error — invalid cuisine
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "My Recipe", "ingredients": ["flour"], "cook_time_minutes": 10, "cuisine": "french"}'
# Returns 400 with validation error details
```

## OpenAPI Docs

Visit `http://localhost:3000/swagger` after starting the server to see auto-generated API documentation with all schemas.
