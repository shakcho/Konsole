import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"What is Konsole?","description":"","frontmatter":{},"headers":[],"relativePath":"guide/index.md","filePath":"guide/index.md"}');
const _sfc_main = { name: "guide/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="what-is-konsole" tabindex="-1">What is Konsole? <a class="header-anchor" href="#what-is-konsole" aria-label="Permalink to &quot;What is Konsole?&quot;">​</a></h1><p>Konsole is a lightweight, namespaced logging library for JavaScript and TypeScript applications. It provides a simple way to manage logs across your application with features like:</p><ul><li><strong>Namespaced logging</strong> for organized, component-specific logs</li><li><strong>In-memory storage</strong> for accessing historical logs</li><li><strong>Conditional output</strong> to control what gets printed to the console</li><li><strong>Browser debugging tools</strong> for production debugging</li></ul><h2 id="why-konsole" tabindex="-1">Why Konsole? <a class="header-anchor" href="#why-konsole" aria-label="Permalink to &quot;Why Konsole?&quot;">​</a></h2><p>Traditional <code>console.log</code> statements have several limitations:</p><ol><li><strong>No organization</strong> — Logs from different parts of your app mix together</li><li><strong>No history</strong> — Once a log scrolls off screen, it&#39;s gone</li><li><strong>No control</strong> — You can&#39;t easily toggle logging on/off for specific features</li><li><strong>No filtering</strong> — Finding relevant logs in a sea of output is painful</li></ol><p>Konsole solves all of these problems while remaining lightweight and dependency-free.</p><h2 id="comparison" tabindex="-1">Comparison <a class="header-anchor" href="#comparison" aria-label="Permalink to &quot;Comparison&quot;">​</a></h2><table tabindex="0"><thead><tr><th>Feature</th><th>console.log</th><th>Konsole</th></tr></thead><tbody><tr><td>Namespacing</td><td>❌</td><td>✅</td></tr><tr><td>Log storage</td><td>❌</td><td>✅</td></tr><tr><td>Conditional output</td><td>❌</td><td>✅</td></tr><tr><td>Type safety</td><td>❌</td><td>✅</td></tr><tr><td>Zero runtime cost</td><td>✅</td><td>✅</td></tr><tr><td>Browser debugging</td><td>❌</td><td>✅</td></tr></tbody></table><h2 id="philosophy" tabindex="-1">Philosophy <a class="header-anchor" href="#philosophy" aria-label="Permalink to &quot;Philosophy&quot;">​</a></h2><p>Konsole follows these principles:</p><ul><li><strong>Zero dependencies</strong> — No bloat, no supply chain risk</li><li><strong>TypeScript first</strong> — Full type safety out of the box</li><li><strong>Non-intrusive</strong> — Logs are stored silently by default</li><li><strong>Production-ready</strong> — Designed for debugging production issues</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
