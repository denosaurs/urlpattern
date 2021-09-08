# URLPattern polyfill

This module is a polyfill implementing the [`URLPattern` web
API](https://github.com/WICG/urlpattern) api in wasm and js. We use the crate
[rust-urlpattern](https://github.com/denoland/rust-urlpattern) from
[denoland](https://github.com/denoland/rust-urlpattern) which is the same as is
used internally in the deno runtime.

The module works both in deno (for when the `unstable` flag is not passed as is
the case until the deno api is stabilized) and in the browser.

## Usage

Using `URLPattern` is as simple as:

```ts
import { URLPattern } from "https://deno.land/x/urlpattern/mod.ts";

const pattern = new URLPattern("/:some/:pattern", "https://example.com/some/pattern)
```

Or in case you want to automatically register the `URLPattern` object globally
to the `window` object (in case it does not already exist):

```ts
import "https://deno.land/x/urlpattern/auto.ts";

const pattern = new URLPattern("/:some/:pattern", "https://example.com/some/pattern)
```

## Maintainers

- Elias Sjögreen ([@eliassjogreen](https://github.com/eliassjogreen))

## Other

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
`deno fmt` and commit messages are done following Conventional Commits spec.

### Licence

Copyright 2021, the denosaurs team. All rights reserved. MIT license.
