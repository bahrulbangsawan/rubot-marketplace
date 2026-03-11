# Recipe Sharing API with ElysiaJS

Here is a REST API for a recipe sharing application using ElysiaJS with Typebox validation.

## Implementation

### `src/index.ts`

```typescript
import { Elysia, t } from 'elysia';

// In-memory data store
interface Recipe {
  id: number;
  title: string;
  description?: string;
  ingredients: string[];
  cook_time_minutes: number;
  cuisine: string;
  created_at: string;
}

const recipes: Recipe[] = [];
let nextId = 1;

const app = new Elysia()
  // GET /api/recipes - List recipes with search, filter, pagination
  .get('/api/recipes', ({ query }) => {
    let results = [...recipes];

    // Search filter
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm) ||
          (r.description && r.description.toLowerCase().includes(searchTerm))
      );
    }

    // Cuisine filter
    if (query.cuisine) {
      results = results.filter((r) => r.cuisine === query.cuisine);
    }

    // Pagination
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      cuisine: t.Optional(
        t.Union([
          t.Literal('italian'),
          t.Literal('mexican'),
          t.Literal('japanese'),
          t.Literal('indian'),
          t.Literal('american'),
        ])
      ),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
  })

  // POST /api/recipes - Create a new recipe
  .post('/api/recipes', ({ body, set }) => {
    const recipe: Recipe = {
      id: nextId++,
      title: body.title,
      description: body.description,
      ingredients: body.ingredients,
      cook_time_minutes: body.cook_time_minutes,
      cuisine: body.cuisine,
      created_at: new Date().toISOString(),
    };

    recipes.push(recipe);
    set.status = 201;
    return recipe;
  }, {
    body: t.Object({
      title: t.String({ minLength: 3, maxLength: 100 }),
      description: t.Optional(t.String()),
      ingredients: t.Array(t.String(), { minItems: 1 }),
      cook_time_minutes: t.Number({ minimum: 1 }),
      cuisine: t.Union([
        t.Literal('italian'),
        t.Literal('mexican'),
        t.Literal('japanese'),
        t.Literal('indian'),
        t.Literal('american'),
      ]),
    }),
    response: {
      400: t.Object({
        error: t.String(),
      }),
      404: t.Object({
        error: t.String(),
      }),
    },
  })

  // Error handling
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: error.message };
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Resource not found' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  })

  .listen(3000);

console.log(`Server running on port 3000`);
```

## Running the Server

```bash
bun add elysia
bun run src/index.ts
```

## Example Requests

```bash
# Get all recipes
curl http://localhost:3000/api/recipes

# Search with filters
curl "http://localhost:3000/api/recipes?q=pasta&cuisine=italian&page=1&limit=10"

# Create a recipe
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": ["spaghetti", "eggs", "pancetta", "parmesan"],
    "cook_time_minutes": 30,
    "cuisine": "italian"
  }'
```

## Validation

The API validates:
- `title`: Required string, 3-100 characters
- `description`: Optional string
- `ingredients`: Array of strings with at least 1 item
- `cook_time_minutes`: Positive number (minimum 1)
- `cuisine`: Must be one of: italian, mexican, japanese, indian, american

Invalid requests return a 400 error with an error message.
