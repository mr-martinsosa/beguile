# beguile

[![npm version](https://img.shields.io/npm/v/beguile.svg)](https://www.npmjs.com/package/beguile)
[![CI](https://github.com/mr-martinsosa/beguile/actions/workflows/ci.yml/badge.svg)](https://github.com/mr-martinsosa/beguile/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/beguile.svg)](./LICENSE)

Parse, validate, and retry. `beguile` calls a producer, parses its output as JSON, validates it
against a schema, and on failure retries with the previous error fed back so the producer can
correct itself. It is built for producers that usually, but not always, return well formed data,
such as language models.

## Install

```sh
npm install beguile
```

`zod` is an optional peer dependency. Install it only to use the bundled zod adapter:

```sh
npm install zod
```

## Usage

```ts
import { beguile } from "beguile";
import { zodValidator } from "beguile/zod";
import { z } from "zod";

const User = z.object({ name: z.string(), age: z.number() });

const user = await beguile({
  produce: ({ lastError }) =>
    callModel(lastError ? `${prompt}\n\nYour previous reply was invalid: ${lastError.message}` : prompt),
  validate: zodValidator(User),
  retries: 2,
});
// user is typed as { name: string; age: number }
```

When every attempt fails, `beguile` rejects with a `RetryExhaustedError` carrying each attempt's
error and the last raw output.

## How it works

For each attempt, `beguile`:

1. calls `produce(context)`, where `context` holds the attempt number and the previous error and output,
2. runs the raw string through `preprocess` (by default `stripCodeFences`, which removes Markdown code fences),
3. parses it with `JSON.parse`,
4. validates the parsed value with the supplied validator.

The first attempt that parses and validates resolves the promise. Otherwise `beguile` retries
until the retry budget is spent, then rejects. The point of feeding `lastError` back into
`produce` is to let a language model see what was wrong and fix it on the next try.

## Validators

A validator is any function of this shape, so `beguile` stays independent of any one schema library:

```ts
type Validator<T> = (input: unknown) => { ok: true; value: T } | { ok: false; error: Error };
```

The bundled zod adapter (imported from `beguile/zod`) is a thin wrapper over `safeParse`. Writing
one by hand takes a couple of lines:

```ts
import type { Validator } from "beguile";

const isUser: Validator<{ name: string }> = (input) =>
  typeof input === "object" && input !== null && typeof (input as { name?: unknown }).name === "string"
    ? { ok: true, value: input as { name: string } }
    : { ok: false, error: new Error("expected { name: string }") };
```

## Single shot

For a one off parse and validate with no retries, use `tryParse`. It never throws and returns a
result union:

```ts
import { tryParse } from "beguile";

const result = tryParse(raw, { validate: zodValidator(User) });
if (result.ok) {
  use(result.value);
} else {
  console.error(result.error);
}
```

## API

- `beguile(options): Promise<T>`. The retry loop. Options: `produce`, `validate`, `retries` (default 2), `preprocess`, `onAttempt`.
- `tryParse(raw, options): ParseResult<T>`. A single parse and validate. Never throws.
- `stripCodeFences(raw): string`. The default preprocess.
- `zodValidator(schema): Validator<T>`. Adapts a zod schema. Imported from `beguile/zod`.
- `RetryExhaustedError`. Rejection type when all attempts fail. Carries `attempts`, `errors`, and `lastOutput`.
- Types: `Validator`, `ParseResult`, `Preprocess`, `Producer`, `RetryContext`, `AttemptInfo`, `BeguileOptions`, `TryParseOptions`.

## Out of scope

By design, `beguile` does not handle:

- backoff or jitter between attempts,
- transport level retries: a throw from `produce` propagates unchanged,
- streaming,
- formats other than JSON.

## License

MIT
