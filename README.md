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

This checkout builds with Exome 2.9.2. Inspected applications can keep older Exome versions: the dedicated protocol is available from 2.4.0 through `unstableExomeDevtools` from `exome/devtools`.

`npm run test:compatibility` uses pinned, published Exome 2.4.0, 2.4.4, 2.5.0, 2.6.0, 2.7.0, 2.8.1, 2.9.0, 2.9.1, and 2.9.2 packages against the built UI. It checks initial snapshots, state updates, asynchronous actions, mixed-version connection switching, and updates while a connection is inactive. This is a tested version matrix, not a claim that every historical patch has been tested. The aliases are test-only dependencies and are excluded from release packages.

Exome versions before 2.4.0 provide Redux DevTools integration rather than this dedicated protocol. Use Redux DevTools for those versions, or upgrade Exome to use this extension.

The older middleware can discard retained history at its limit and omit BigInt, cyclic plain objects, or null-prototype dictionaries. Devtools cannot recover data that the producer never sends. Exome 2.9.1 fixes those cases; upgrading is recommended for complete data capture.

Exome 2.9.2 reports stores after garbage collection so this panel can remove them from State and the live instance count. Retained actions and their before/after snapshots remain inspectable. Collection timing is controlled by the browser; stores still referenced by the application (including exported module singletons) remain live. Older middleware cannot report removals, and older panels ignore the new event; both combinations still support state and action inspection.

After building, `xvfb-run -a npm run test:hmr` checks three real Vite module updates through the unpacked Chrome extension, explicitly collecting garbage between updates. `HMR_EXOME=exome-v2_9_1` checks older middleware; `OLD_EXTENSION_PATH=/path/to/previous/extension/dist` checks the current middleware against a separately built older panel. The updated pair must return to one live store while preserving historical snapshots. Mixed versions retain stale entries but must keep state updates and history working.

The Profiler remains disabled and unfinished.

`npm run build` packages the embedded UI in `dist` and the unpacked extension in `extension/dist`; it does not publish either artifact. The extension version comes from the root package version. Before release, run the tests, validate the real panel lifecycle, and verify compatibility with the intended Exome version.

## Automated Chrome Web Store releases

The **Release extension** GitHub Actions workflow runs the full test suite (including the compatibility matrix), builds the extension, and saves `extension.zip` as a workflow artifact. A `vX.Y.Z` tag submits the ZIP to Chrome Web Store review. Manual runs from `main` default to packaging only; select **publish** to upload and submit. Release commits must be on `main`, and a tag must match the root package version. Bump that version before releasing; Chrome rejects reused version numbers.

Publishing uses the Chrome Web Store API v2 and Google's official authentication action with short-lived credentials. One-time publisher-owner setup:

1. Enable the Chrome Web Store API in a Google Cloud project. Create a service account and link its email in the Chrome Web Store Developer Dashboard's Account section. See [Google's service-account instructions](https://developer.chrome.com/docs/webstore/service-accounts).
2. Configure GitHub OIDC Workload Identity Federation and grant the repository principal `roles/iam.workloadIdentityUser` on that service account. Restrict the provider to `Marcisbee/exome-devtools` and the `repo:Marcisbee/exome-devtools:environment:chrome-web-store` subject. Follow the [official authentication action setup](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account). No service-account key or refresh token is stored in this repository.
3. Create the GitHub environment `chrome-web-store`. Add environment variables `GCP_WORKLOAD_IDENTITY_PROVIDER` (full provider resource name), `GCP_SERVICE_ACCOUNT` (email), `CWS_PUBLISHER_ID` (from Publisher settings), and `CWS_EXTENSION_ID` (the existing store item's ID). Restrict deployment branches/tags to `main` and release tags; configure environment reviewers if desired.
4. Complete the existing listing and privacy declarations in the publisher dashboard. Merge this workflow, run it once with **publish** unchecked to inspect its artifact, then release a new version with a matching tag or a publishing manual run.

Uploads must finish successfully before submission. A retry skips versions already published or awaiting review and refuses to replace a different pending submission. The workflow reports the API's resulting state: **PENDING_REVIEW is not a live release**. Google still controls review and approval. See [Chrome Web Store API publishing](https://developer.chrome.com/docs/webstore/using-api/).
