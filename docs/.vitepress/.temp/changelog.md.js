import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Changelog","description":"","frontmatter":{},"headers":[],"relativePath":"changelog.md","filePath":"changelog.md"}');
const _sfc_main = { name: "changelog.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="changelog" tabindex="-1">Changelog <a class="header-anchor" href="#changelog" aria-label="Permalink to &quot;Changelog&quot;">​</a></h1><p>All notable changes to this project will be documented in this file.</p><p>The format is based on <a href="https://keepachangelog.com/en/1.0.0/" target="_blank" rel="noreferrer">Keep a Changelog</a>, and this project adheres to <a href="https://semver.org/spec/v2.0.0.html" target="_blank" rel="noreferrer">Semantic Versioning</a>.</p><h2 id="_1-0-0-2024-01-01" tabindex="-1">[1.0.0] - 2024-01-01 <a class="header-anchor" href="#_1-0-0-2024-01-01" aria-label="Permalink to &quot;[1.0.0] - 2024-01-01&quot;">​</a></h2><h3 id="added" tabindex="-1">Added <a class="header-anchor" href="#added" aria-label="Permalink to &quot;Added&quot;">​</a></h3><ul><li>Initial release</li><li>Namespaced logging with <code>Konsole</code> class</li><li>Log levels: <code>log</code>, <code>error</code>, <code>warn</code>, <code>info</code></li><li>In-memory log storage with automatic cleanup</li><li>Conditional logging with boolean and function criteria</li><li><code>viewLogs()</code> for batch viewing of stored logs</li><li><code>getLogs()</code> for programmatic access to logs</li><li><code>clearLogs()</code> to remove all stored logs</li><li>Static <code>getLogger()</code> to retrieve existing loggers</li><li>Static <code>exposeToWindow()</code> for browser debugging</li><li>Static <code>enableGlobalPrint()</code> for global output toggle</li><li>Configurable retention period and cleanup interval</li><li>Full TypeScript support with exported types</li><li>Zero dependencies</li></ul><h3 id="security" tabindex="-1">Security <a class="header-anchor" href="#security" aria-label="Permalink to &quot;Security&quot;">​</a></h3><ul><li>Window exposure is opt-in and can be conditionally enabled</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("changelog.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const changelog = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  changelog as default
};
