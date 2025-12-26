import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"Konsole","text":"Namespaced Logging for JavaScript","tagline":"Lightweight, powerful, and TypeScript-first logging library","image":{"src":"/logo.svg","alt":"Konsole"},"actions":[{"theme":"brand","text":"Get Started","link":"/guide/getting-started"},{"theme":"alt","text":"View on GitHub","link":"https://github.com/your-username/konsole"}]},"features":[{"icon":"🏷️","title":"Namespaced Logging","details":"Organize your logs by component, module, or feature. Keep your console clean and focused."},{"icon":"💾","title":"In-Memory Storage","details":"All logs are stored in memory for later inspection. Debug issues by accessing historical logs."},{"icon":"⚡","title":"Conditional Output","details":"Control exactly when logs appear in the console with boolean flags or custom criteria functions."},{"icon":"🔧","title":"Zero Dependencies","details":"Lightweight and fast with no external dependencies. Perfect for any project size."},{"icon":"📦","title":"TypeScript First","details":"Built with TypeScript from the ground up. Enjoy full type safety and autocompletion."},{"icon":"🌐","title":"Universal","details":"Works seamlessly in browsers and Node.js environments."}]},"headers":[],"relativePath":"index.md","filePath":"index.md"}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
