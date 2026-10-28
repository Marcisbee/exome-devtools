import { addMiddleware } from "exome";
import { unstableExomeDevtools } from "exome/devtools";
addMiddleware(unstableExomeDevtools({ name: "Vite lifecycle", maxAge: 20 }));
let current;
function install(store) {
	current = store;
	document.querySelector("#value").textContent = current.count;
}
await import("./store.js").then((module) => install(module.createStore()));
document.querySelector("#increment").onclick = () => {
	current.increment();
	document.querySelector("#value").textContent = current.count;
};
if (import.meta.hot)
	import.meta.hot.accept("./store.js", (module) =>
		install(module.createStore()),
	);
