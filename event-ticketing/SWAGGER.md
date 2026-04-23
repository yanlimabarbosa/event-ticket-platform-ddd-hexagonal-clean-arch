# Swagger / OpenAPI — Zero-Manual-Decorator Guide

This project uses `@nestjs/swagger` with its CLI plugin. When the rules below are followed, you **never write `@ApiProperty`, `@ApiResponse`, `@ApiBody`, or any other `@Api*` decorator**. The plugin auto-derives the schema from TypeScript types + class-validator decorators at compile time.

If swagger is showing empty schemas (`{}`), a missing field, or a wrong type, it's almost always a rule violation below.

---

## How the plugin works (2-sentence version)

The plugin is a TypeScript transformer that runs at compile time. It reads your DTO classes + controller signatures + class-validator decorators, and injects `@ApiProperty(...)` metadata into the emitted JS before bundling. Swagger UI then reads that metadata at runtime to render `/docs`.

**Consequence:** anything that doesn't exist at runtime (type aliases, interfaces, string literal unions, `import type`) is invisible to the plugin, no matter how correct the TypeScript is.

---

## The 8 rules for always-auto schemas

### 1. DTOs are `class`, never `interface` or `type`

```ts
// ✅ YES
export class OrderResponseDto {
  public readonly id!: string
}

// ❌ NO — erased at compile time, plugin sees nothing
export interface OrderResponseDto { id: string }
export type OrderResponseDto = { id: string }
```

### 2. Enums are real `enum`, never string literal unions

```ts
// ✅ YES
export enum PaymentMethod {
  CreditCard = 'credit_card',
  Pix = 'pix',
  Boleto = 'boleto',
}

// ❌ NO — type is erased, no runtime value exists
export type PaymentMethod = 'credit_card' | 'pix' | 'boleto'
```

### 3. Always use regular `import`, never `import type`, for anything a DTO or controller references

```ts
// ✅ YES
import { OrderResponseDto } from './responses/OrderResponseDto'
import { PaymentMethod } from '../ports/out/PaymentGateway'

// ❌ NO — elided from emitted JS, plugin can't find the class/enum
import type { OrderResponseDto } from './responses/OrderResponseDto'
import type { PaymentMethod } from '../ports/out/PaymentGateway'
```

`import type` is fine elsewhere (pure domain types not touching DTOs). It's only forbidden in the DTO + controller files and in files that define types exported into DTOs.

### 4. Validate enums with `@IsEnum(EnumName)`, not `@IsIn([...])`

```ts
// ✅ YES — plugin recognizes the enum reference
@IsEnum(PaymentMethod)
public readonly paymentMethod!: PaymentMethod

// ❌ NO — plugin doesn't reliably map @IsIn to schema enum
@IsIn(['credit_card', 'pix', 'boleto'])
public readonly paymentMethod!: string
```

### 5. Use concrete TypeScript types, never `any` / `unknown` / `Record<string, any>`

| Works (auto-detected)              | Breaks auto-detection           |
|------------------------------------|---------------------------------|
| `string`, `number`, `boolean`      | `any`, `unknown`                |
| `Date`                             | `object`                        |
| `Foo` (class)                      | `Record<string, any>`           |
| `Foo[]`, `string[]`                | `any[]`                         |
| `Foo \| null` (nullable)           | `Foo \| Bar` (union of types)   |
| nested class via `@ValidateNested + @Type(() => Foo)` | inline anonymous `{ a: string }` |

For unions of different types, split into multiple endpoints or use discriminator — don't try to cram into one schema.

### 6. class-validator decorators drive required/format — use them

The plugin reads these automatically. **You never write `@ApiProperty` to describe them.**

| Decorator                 | Effect on schema                    |
|---------------------------|-------------------------------------|
| `@IsOptional()`           | `required: false`, nullable: true  |
| `@IsString()`             | `type: string`                      |
| `@IsInt()`                | `type: integer`                     |
| `@IsNumber()`             | `type: number`                      |
| `@IsBoolean()`            | `type: boolean`                     |
| `@IsUUID()`               | `format: uuid`                      |
| `@IsEmail()`              | `format: email`                     |
| `@IsDate()`               | `format: date-time`                 |
| `@IsEnum(E)`              | `enum: [...]`                       |
| `@Min(n)` / `@Max(n)`     | `minimum` / `maximum`               |
| `@MinLength(n)`           | `minLength`                         |
| `@MaxLength(n)`           | `maxLength`                         |
| `@IsArray()`              | `type: array`                       |
| `@ArrayMinSize(n)`        | `minItems`                          |
| `@ValidateNested() @Type(() => Foo)` | Nested schema ref on `Foo`   |

### 7. JSDoc comments become schema descriptions (if `introspectComments: true`)

The plugin reads `/** */` JSDoc blocks above fields and injects them as `description`:

```ts
export class CreateOrderRequestDto {
  /** ID of the event the order is for */
  @IsUUID()
  public readonly eventId!: string

  /** Attendee who owns this order */
  @IsUUID()
  public readonly attendeeId!: string

  /**
   * Cart items to reserve.
   * Must have at least one item.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  public readonly items!: CreateOrderItemDto[]
}
```

No `@ApiProperty({ description: '...' })` needed.

### 8. Always use plain field declarations with `!` — **never constructor parameter properties**

The plugin's AST visitor walks **class body field declarations** only. TypeScript constructor parameter properties (`public readonly id: string` inside `constructor(...)`) are a **different AST node** the visitor ignores → fields invisible → empty schema.

This applies to **every DTO**, request or response.

```ts
// ✅ YES — plugin sees every field
export class OrderResponseDto {
  public readonly id!: string
  public readonly total!: number
  public readonly items!: OrderItemResponseDto[]
  public readonly paidAt!: string | null
}

// ❌ NO — plugin emits `OrderResponseDto: {}` in OpenAPI
export class OrderResponseDto {
  public constructor(
    public readonly id: string,
    public readonly total: number,
    public readonly items: OrderItemResponseDto[],
    public readonly paidAt: string | null,
  ) {}
}
```

**How to build instances without a positional constructor:**

Response DTOs are structurally typed — return a plain object literal from the mapper. TS checks it satisfies the class shape. No `new`, no `Object.assign`.

```ts
// Mapper — zero boilerplate
public toResponse(order: Order): OrderResponseDto {
  return {
    id: order.id,
    total: order.getTotal().getValue(),
    items: order.getItems().map((i) => ({ /* ... */ })),
    paidAt: order.getPaidAt()?.toISOString() ?? null,
  }
}
```

Trade-off: the returned value is a plain object, not `instanceof OrderResponseDto`. Fine for response serialization (Nest just `JSON.stringify`s it). **Not** fine if you later enable `ClassSerializerInterceptor` with `@Exclude()`/`@Transform()` decorators — those need a real class instance. In that case, add a `constructor(input: T) { Object.assign(this, input) }` to the DTO and build via `new OrderResponseDto({ ... })`.

Request DTOs are built by `class-transformer`'s `plainToInstance` (called by `ValidationPipe`) — it needs a no-arg constructor anyway, so this style is already required.

| DTO kind        | Build path                             | Style                       |
|-----------------|----------------------------------------|-----------------------------|
| Response        | Object literal returned by mapper      | Plain fields with `!`       |
| Request         | `class-transformer` / `ValidationPipe` | Plain fields with `!`       |
| MikroORM entity | ORM via no-arg ctor + hydration        | Plain fields                |

**Never use constructor parameter properties in any DTO.** The plugin cannot see them.

---

## Required configuration (`nest-cli.json`)

```json
{
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "dtoFileNameSuffix": ["Dto.ts", ".dto.ts"],
          "controllerFileNameSuffix": ["Controller.ts", ".controller.ts"],
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

- `dtoFileNameSuffix` — extended to support PascalCase `Dto.ts` files (project convention)
- `controllerFileNameSuffix` — same reason for `Controller.ts`
- `classValidatorShim: true` — plugin reads class-validator decorators (rule 6)
- `introspectComments: true` — plugin reads JSDoc (rule 7)

---

## Required bootstrap (`main.ts`)

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))

  const config = new DocumentBuilder()
    .setTitle('Event Ticketing API')
    .setVersion('1.0')
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT ?? 3000)
}
```

UI at `http://localhost:3000/docs`, JSON at `/docs-json`, YAML at `/docs-yaml`.

---

## Rebuild after any change

The plugin runs at TypeScript compile time. After changing:
- DTO class structure
- Enum definitions
- Controller signatures
- `nest-cli.json`

**You must rebuild:**

```bash
pnpm build        # production build
# or
pnpm start:dev    # dev mode — plugin runs on each recompile
```

Hot reload in some setups doesn't re-run the plugin — if schema looks stale after a DTO change, restart the dev server.

---

## Troubleshooting

| Symptom                                    | Cause                                                                 | Fix              |
|-------------------------------------------|----------------------------------------------------------------------|------------------|
| Field appears as `{}` in request body     | Type is a string literal union, type alias, or `import type`         | Rules 2, 3, 4    |
| Response body is empty / any              | Return type is an interface, imported with `import type`, or DTO uses constructor parameter properties | Rules 1, 3, 8 |
| Whole DTO missing from schema             | File doesn't match `dtoFileNameSuffix` in `nest-cli.json`             | Add suffix to config |
| Field missing entirely                    | No class-validator decorator AND no explicit type                     | Rule 6           |
| Required field shown as optional          | Missing `@IsNotEmpty()` or similar, or has `@IsOptional()`            | Rule 6           |
| Enum shown as plain string                | Using `@IsIn([...])` instead of `@IsEnum(E)` on a real enum           | Rules 2, 4       |
| Changes not showing up                    | Plugin didn't re-run                                                  | Restart dev server, delete `dist/` |
| Nested object shown as flat `object`      | Missing `@ValidateNested() + @Type(() => Foo)` on the parent field    | Rule 6           |

---

## Quick checklist before committing a new DTO

- [ ] File is `class`, not `interface` or `type`
- [ ] All referenced enums are real `enum`, not string literal unions
- [ ] No `import type` on anything the DTO or its controller uses
- [ ] Every field has at least one class-validator decorator (type + constraints)
- [ ] Optional fields marked `@IsOptional()`
- [ ] Enum fields validated with `@IsEnum(EnumName)`
- [ ] Nested DTOs have `@ValidateNested({ each: true })` + `@Type(() => Child)`
- [ ] JSDoc `/** */` above each field (becomes description)
- [ ] File name ends with `Dto.ts` or `.dto.ts`
- [ ] Controller method has explicit `Promise<ResponseDto>` return type
- [ ] All fields are plain top-level declarations with `!` — **no constructor parameter properties**
- [ ] Zero `@Api*` decorators in the file

If all 10 are true, swagger auto-generates the full schema. No manual decorators, ever.

---

## Why Java/Spring Boot doesn't need this document

In Spring Boot, `springdoc-openapi` reads the actual runtime types (records, enums, classes) via JVM reflection. TypeScript erases types at compile time, so Nest needs a build-time plugin to re-derive the schema from the source. That's the entire reason this document exists — it's a workaround for TS's structural vs. JS's type-less runtime.

When you migrate to Java, delete this file. It won't apply.
