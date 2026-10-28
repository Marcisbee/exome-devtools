import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// The same API flow is used by the CLI and exercised at its HTTP boundary.
export async function submitExtension({
	publisherId,
	itemId,
	token,
	version,
	zip,
}) {
	if (
		!/^[a-zA-Z0-9_-]+$/.test(publisherId || "") ||
		!/^[a-p]{32}$/.test(itemId || "") ||
		!token
	) {
		throw new Error(
			"Configure CWS_PUBLISHER_ID, CWS_EXTENSION_ID and Google authentication before publishing.",
		);
	}
	const name = `publishers/${publisherId}/items/${itemId}`;
	const base = `https://chromewebstore.googleapis.com/v2/${name}`;
	async function request(url, options = {}) {
		const response = await fetch(url, {
			...options,
			headers: { Authorization: `Bearer ${token}`, ...options.headers },
			signal: AbortSignal.timeout(60000),
		});
		if (!response.ok)
			throw new Error(
				`Chrome Web Store request failed (HTTP ${response.status}); inspect publisher access and item status.`,
			);
		return response.json();
	}
	const status = await request(`${base}:fetchStatus`);
	const hasVersion = (revision) =>
		revision?.distributionChannels?.some(
			(channel) => channel.crxVersion === version,
		);
	if (hasVersion(status.publishedItemRevisionStatus))
		return "ALREADY_PUBLISHED";
	const submitted = status.submittedItemRevisionStatus;
	if (["PENDING_REVIEW", "STAGED"].includes(submitted?.state)) {
		if (hasVersion(submitted)) return submitted.state;
		throw new Error(
			"Another version is awaiting review or publication; resolve it in the publisher dashboard first.",
		);
	}
	const upload = await request(
		`https://chromewebstore.googleapis.com/upload/v2/${name}:upload`,
		{
			method: "POST",
			headers: { "Content-Type": "application/zip" },
			body: zip,
		},
	);
	let state = upload.uploadState;
	for (let attempt = 0; state === "IN_PROGRESS" && attempt < 30; attempt++) {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		state = (await request(`${base}:fetchStatus`)).lastAsyncUploadState;
	}
	if (state !== "SUCCEEDED")
		throw new Error(
			`Extension upload did not succeed: ${state || "unknown"}. No publish request was sent.`,
		);
	if (upload.crxVersion && upload.crxVersion !== version)
		throw new Error(
			"Uploaded version differs from the release version. No publish request was sent.",
		);
	const result = await request(`${base}:publish`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	});
	if (
		!["PENDING_REVIEW", "STAGED", "PUBLISHED", "PUBLISHED_TO_TESTERS"].includes(
			result.state,
		)
	) {
		throw new Error(
			`Submission was not accepted: ${result.state || "unknown"}.`,
		);
	}
	return result.state;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		const { version } = JSON.parse(await readFile("package.json", "utf8"));
		const state = await submitExtension({
			publisherId: process.env.CWS_PUBLISHER_ID,
			itemId: process.env.CWS_EXTENSION_ID,
			token: process.env.CWS_ACCESS_TOKEN,
			version,
			zip: await readFile("extension.zip"),
		});
		console.log(
			`Chrome Web Store ${version}: ${state}. Submission may still require Google's review.`,
		);
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
