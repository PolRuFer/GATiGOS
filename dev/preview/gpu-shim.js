// Test-only: the container has no GPU (SwiftShader). Present it as hardware
// so the 3D hero path can be exercised. Never shipped with the theme.
module.exports = `(() => {
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (attrs && attrs.failIfMajorPerformanceCaveat) attrs = { ...attrs, failIfMajorPerformanceCaveat: false };
    return get.call(this, type, attrs);
  };
  const param = WebGL2RenderingContext.prototype.getParameter;
  WebGL2RenderingContext.prototype.getParameter = function (p) { return p === 0x9246 ? 'Harness GPU' : param.call(this, p); };
})();`;
