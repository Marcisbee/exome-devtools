# Exome Devtools

Inspect Exome stores, action history, state differences, and action timings in a Chrome DevTools panel or an embedded development UI.

## Development

Use Node.js 22.12 or newer and npm. In WSL, use Linux Node and npm together.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:8000 for the full-panel connection demo with labeled Shop and Admin sample data. Use the Connection selector to inspect each app's separate stores and actions. The Live playground link opens the counter and asynchronous-action middleware playground. Set `PORT` to use another port. The server binds to loopback.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run test:extension
```

`test:browser` exercises the built UI. `test:extension` launches Chromium with the unpacked extension and needs a display; on headless Linux run `xvfb-run -a npm run test:extension`. `CHROME_PATH` can select an existing browser executable. Use Chromium or Chrome for Testing for extension tests; branded Chrome may disallow command-line extension loading.

The extension tests cover connection isolation, frame routing, rediscovery, repeated disconnect, and page navigation. The real panel is also opened and hidden/shown to verify that connections render without duplication. Check opening DevTools after the application starts when validating a release.

## Load the extension

1. Run `npm run build`. This creates `dist` and `extension/dist` from a clean checkout.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select `extension/dist`.
4. Instrument the application before constructing its stores:

```ts
import { addMiddleware } from 'exome';
import { unstableExomeDevtools } from 'exome/devtools';

addMiddleware(unstableExomeDevtools({ name: 'My application', maxAge: 60 }));
```

Open Chrome DevTools and select **Exome**. If no connection appears, verify that the middleware runs in the inspected page and reload that page. Browser-internal pages cannot be inspected. When multiple applications connect, use the **Connection** selector above the panel to switch between them. Each connection keeps its own stores, action history, and counts, even when store or action IDs match. Inactive connections continue receiving updates. Switching opens that connection’s Actions view; disconnecting the selected connection selects another available connection. Connection labels include an ordinal to distinguish applications with the same name.

After rebuilding, reload the extension in `chrome://extensions`, reload the inspected application, and reopen DevTools.

## Embedded UI

The build exports `renderUI`. Load the CSS alongside it, initialize the UI before installing the Exome middleware, and supply a container with a defined height.

```ts
import { renderUI } from './dist/devtools.js';
import './dist/devtools.css';

const unmount = renderUI(document.getElementById('devtools')!);
// Call unmount() when disposing the host UI.
```

Embedding replaces the page's extension hook. Use either the embedded UI or the browser extension for a given page.

## Inspecting data

- Filter by action/store name. Append `,field=value` to match a primitive state property, for example `increment,count=1`. Action filters use the after-state when available, otherwise the before-state.
- Timings and counts describe **completed actions still in retained history**, not lifetime session totals. Pending actions consume history slots. An evicted action completing later does not reappear in history.
- Full synchronization replaces the instance list and retained history. Live state messages update stores independently of action completion.
- Getters show **not evaluated**. Inspection does not execute application getters.
- Historical nested Exome references are marked **historical value not captured**. They are not expanded using current store values. Use the State tab for current values.
- Expand objects and arrays with a click, Enter, or Space. Narrow panels stack the list above the inspector.

## Exome compatibility

This checkout builds with Exome 2.9.1. Inspected applications can keep older Exome versions: the dedicated protocol is available from 2.4.0 through `unstableExomeDevtools` from `exome/devtools`.

`npm run test:compatibility` uses pinned, published Exome 2.4.0, 2.4.4, 2.5.0, 2.6.0, 2.7.0, 2.8.1, 2.9.0, and 2.9.1 packages against the built UI. It checks initial snapshots, state updates, asynchronous actions, mixed-version connection switching, and updates while a connection is inactive. This is a tested version matrix, not a claim that every historical patch has been tested. The aliases are test-only dependencies and are excluded from release packages.

Exome versions before 2.4.0 provide Redux DevTools integration rather than this dedicated protocol. Use Redux DevTools for those versions, or upgrade Exome to use this extension.

The older middleware can discard retained history at its limit and omit BigInt, cyclic plain objects, or null-prototype dictionaries. Devtools cannot recover data that the producer never sends. Exome 2.9.1 fixes those cases; upgrading is recommended for complete data capture.

The Profiler remains disabled and unfinished.

`npm run build` packages the embedded UI in `dist` and the unpacked extension in `extension/dist`; it does not publish either artifact. The extension version comes from the root package version. Before release, run the tests, validate the real panel lifecycle, and verify compatibility with the intended Exome version.
