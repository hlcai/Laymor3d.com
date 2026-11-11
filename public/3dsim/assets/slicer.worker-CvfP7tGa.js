const e=Object.freeze({defaultSupport:`wasm-required`,branchingSupport:`wasm-required`,organicSupport:`unsupported`,manualSupportPoints:`wasm-required`,modifierVolumes:`wasm-required`,pad:`wasm-required`,correction:`wasm-required`,hollowing:`unsupported`,drainHoles:`unsupported`,jsFallback:`single-object-contours-only`});var t=class extends Error{constructor(e,t){super(t),this.name=`SlaRequestError`,this.code=e}};const n=(e,n)=>{throw new t(e,n)},r=e=>typeof e==`object`&&!!e&&!Array.isArray(e)&&!(e instanceof ArrayBuffer)&&!ArrayBuffer.isView(e),i=e=>e instanceof ArrayBuffer||e instanceof Uint8Array,a=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),o=e=>typeof e==`number`&&Number.isFinite(e),s=e=>typeof e==`string`&&e.length>0,c=(e,t)=>{if(e!==void 0)return r(e)||n(`SLA_INVALID_REQUEST`,`${t} must be an object`),e},l=(e,t)=>{if(e!==void 0)return(!Array.isArray(e)||e.length!==16||e.some(e=>!o(e)))&&n(`SLA_INVALID_REQUEST`,`${t} must be 16 finite numbers`),e},u=(e,t)=>{r(e)||n(`SLA_INVALID_REQUEST`,`${t} must be an object`),[`manual`,`automatic`,`island`,`slope`].includes(e.type)||n(`SLA_INVALID_REQUEST`,`${t}.type must be 'manual', 'automatic', 'island', or 'slope'`),(!Array.isArray(e.position)||e.position.length!==3||e.position.some(e=>!o(e)))&&n(`SLA_INVALID_REQUEST`,`${t}.position must be three finite numbers`);for(let r of[`radius`,`elevation`])a(e,r)&&(!o(e[r])||e[r]<0)&&n(`SLA_INVALID_REQUEST`,`${t}.${r} must be a non-negative finite number`);for(let r of[`permanent`,`manual`])a(e,r)&&typeof e[r]!=`boolean`&&n(`SLA_INVALID_REQUEST`,`${t}.${r} must be boolean`);return e},d=(e,t)=>{r(e)||n(`SLA_INVALID_REQUEST`,`${t} must be an object`);for(let r of[`position`,`normal`])(!Array.isArray(e[r])||e[r].length!==3||e[r].some(e=>!o(e)))&&n(`SLA_INVALID_REQUEST`,`${t}.${r} must be three finite numbers`);for(let r of[`radius`,`height`])(!o(e[r])||e[r]<0)&&n(`SLA_INVALID_REQUEST`,`${t}.${r} must be a non-negative finite number`);return e},f=(e,t)=>(r(e)||n(`SLA_INVALID_REQUEST`,`${t} must be an object`),s(e.id)||n(`SLA_INVALID_REQUEST`,`${t}.id must be a non-empty string`),e.kind!==`blocker`&&e.kind!==`enforcer`&&n(`SLA_INVALID_REQUEST`,`${t}.kind must be 'blocker' or 'enforcer'`),i(e.stl)||n(`SLA_INVALID_REQUEST`,`${t}.stl must be an ArrayBuffer or Uint8Array`),l(e.transform,`${t}.transform`),c(e.settings,`${t}.settings`),e),p=(e,t)=>(r(e)||n(`SLA_INVALID_REQUEST`,`${t} must be an object`),s(e.id)||n(`SLA_INVALID_REQUEST`,`${t}.id must be a non-empty string`),l(e.transform,`${t}.transform`),c(e.settings,`${t}.settings`),e),m=(e,t,a)=>{let o=`objects[${t}]`;if(r(e)||n(`SLA_INVALID_REQUEST`,`${o} must be an object`),(!s(e.id)||a.has(e.id))&&n(`SLA_INVALID_REQUEST`,`${o}.id must be a unique non-empty string`),i(e.stl)||n(`SLA_INVALID_REQUEST`,`${o}.stl must be an ArrayBuffer or Uint8Array`),a.add(e.id),l(e.transform,`${o}.transform`),c(e.settings,`${o}.settings`),e.instances!==void 0){(!Array.isArray(e.instances)||e.instances.length===0)&&n(`SLA_INVALID_REQUEST`,`${o}.instances must be a non-empty array when present`);let t=/* @__PURE__ */ new Set;e.instances.forEach((e,r)=>{p(e,`${o}.instances[${r}]`),t.has(e.id)&&n(`SLA_INVALID_REQUEST`,`${o}.instances ids must be unique`),t.add(e.id)})}return e.supportPoints!==void 0&&(Array.isArray(e.supportPoints)||n(`SLA_INVALID_REQUEST`,`${o}.supportPoints must be an array`),e.supportPoints.forEach((e,t)=>u(e,`${o}.supportPoints[${t}]`))),e.modifierVolumes!==void 0&&(Array.isArray(e.modifierVolumes)||n(`SLA_INVALID_REQUEST`,`${o}.modifierVolumes must be an array`),e.modifierVolumes.forEach((e,t)=>f(e,`${o}.modifierVolumes[${t}]`))),e.drainHoles!==void 0&&(Array.isArray(e.drainHoles)||n(`SLA_INVALID_REQUEST`,`${o}.drainHoles must be an array`),e.drainHoles.forEach((e,t)=>d(e,`${o}.drainHoles[${t}]`))),e},h=e=>{let t=c(e,`support`);if(t)return a(t,`enabled`)&&typeof t.enabled!=`boolean`&&n(`SLA_INVALID_REQUEST`,`support.enabled must be boolean`),a(t,`enforcersOnly`)&&typeof t.enforcersOnly!=`boolean`&&n(`SLA_INVALID_REQUEST`,`support.enforcersOnly must be boolean`),a(t,`strategy`)&&![`default`,`branching`,`organic`].includes(t.strategy)&&n(`SLA_INVALID_REQUEST`,`support.strategy must be 'default', 'branching', or 'organic'`),t.strategy===`organic`&&n(`SLA_UNSUPPORTED_ORGANIC`,`Organic SLA supports are not available`),t},g=e=>{let t=c(e,`hollowing`);if(t)return a(t,`enabled`)&&typeof t.enabled!=`boolean`&&n(`SLA_INVALID_REQUEST`,`hollowing.enabled must be boolean`),t.enabled&&n(`SLA_UNSUPPORTED_HOLLOWING`,`SLA hollowing is not available`),t};function _(t){r(t)||n(`SLA_INVALID_REQUEST`,`SLA job must be an object`),a(t,`version`)&&t.version!==1&&n(`SLA_INVALID_REQUEST`,`SLA job version must be 1`),(!Array.isArray(t.objects)||t.objects.length===0)&&n(`SLA_INVALID_REQUEST`,`SLA job.objects must be a non-empty array`);let i=/* @__PURE__ */ new Set;t.objects.forEach((e,t)=>m(e,t,i)),t.objects.some(e=>e.drainHoles?.length)&&n(`SLA_UNSUPPORTED_HOLLOWING`,`SLA drain holes were preserved but require unsupported hollowing geometry`),c(t.settings,`settings`);let o=h(t.support),s=c(t.pad,`pad`),l=c(t.correction,`correction`),u=g(t.hollowing);return t.drainHoles!==void 0&&(Array.isArray(t.drainHoles)||n(`SLA_INVALID_REQUEST`,`drainHoles must be an array`),t.drainHoles.length&&n(`SLA_UNSUPPORTED_HOLLOWING`,`SLA drain holes require unsupported hollowing geometry`)),t.requiredCapabilities!==void 0&&((!Array.isArray(t.requiredCapabilities)||t.requiredCapabilities.some(t=>!a(e,t)))&&n(`SLA_INVALID_REQUEST`,`requiredCapabilities must name known SLA capabilities`),t.requiredCapabilities.includes(`organicSupport`)&&n(`SLA_UNSUPPORTED_ORGANIC`,`Organic SLA supports are not available`),(t.requiredCapabilities.includes(`hollowing`)||t.requiredCapabilities.includes(`drainHoles`))&&n(`SLA_UNSUPPORTED_HOLLOWING`,`SLA hollowing is not available`)),{version:1,...t,support:o,pad:s,correction:l,hollowing:u}}function v(e){r(e)||n(`SLA_INVALID_REQUEST`,`legacy SLA params must be an object`),e.support_tree_type===`organic`&&n(`SLA_UNSUPPORTED_ORGANIC`,`Organic SLA supports are not available`),e.hollowing_enable===!0&&n(`SLA_UNSUPPORTED_HOLLOWING`,`SLA hollowing is not available`),e.supports_enable===!0&&n(`SLA_FALLBACK_SUPPORTS`,`The JS SLA fallback cannot generate requested supports`),e.pad_enable===!0&&n(`SLA_FALLBACK_PAD`,`The JS SLA fallback cannot generate a requested pad`)}function y(e){let t=[];return e?.over_bed_model&&t.push(`over_bed_model`),t}function b(e){return e&&!e.error&&(e.warnings=y(e.stats)),e}const x=[`t_pass1_ms`,`t_surface_ms`,`t_support_ms`,`t_emit_ms`],S=[`t_contours_ms`,`t_sample_ms`,`t_tree_ms`,`t_raster_ms`,`t_emit_ms`];function C(e,t){let n=Math.max(0,Number(t)||0),r=Number(e?.layers)||0,i=Number(e?.path_segments)||0,a=(e?.sla?S:x).map(t=>Number(e?.[t])).filter(Number.isFinite);return{ms:n,kernelMs:a.length?a.reduce((e,t)=>e+t,0):null,layersPerSecond:n>0?r*1e3/n:0,msPerMsegment:i>0?n/(i/1e6):null}}function w(e,t){return e&&!e.error&&(e.throughput=C(e.stats,t)),e}const T=4294967295,E=`fn tid(g: vec3<u32>) -> u32 { return g.x + g.y * 16776960u; }`,D=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;                  // triangles, layers, emit
@group(0) @binding(1) var<storage, read> tris: array<f32>;
@group(0) @binding(2) var<storage, read> zs: array<vec2<f32>>;     // each layer's z as hi + lo
@group(0) @binding(3) var<storage, read_write> counts: array<u32>; // count mode: per triangle; emit mode: its first segment
@group(0) @binding(4) var<storage, read_write> segPoints: array<vec4<i32>>;   // x0 y0 x1 y1 (1e-6 mm)
@group(0) @binding(5) var<storage, read_write> segKeys: array<vec4<i32>>;     // the chain keys of both ends (1e-3 mm)
@group(0) @binding(6) var<storage, read_write> segLayer: array<u32>;
@group(0) @binding(7) var<uniform> dfZero: u32;

fn opaque(a: f32) -> f32 { return bitcast<f32>(bitcast<u32>(a) ^ dfZero); }
fn two_sum(a: f32, b: f32) -> vec2<f32> { let s = opaque(a + b); let bb = opaque(s - a); return vec2<f32>(s, opaque(a - opaque(s - bb)) + opaque(b - bb)); }
fn quick_two_sum(a: f32, b: f32) -> vec2<f32> { let s = opaque(a + b); return vec2<f32>(s, b - opaque(s - a)); }
fn df_add(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
  var s = two_sum(a.x, b.x); let t = two_sum(a.y, b.y);
  s.y = s.y + t.x; s = quick_two_sum(s.x, s.y); s.y = s.y + t.y; return quick_two_sum(s.x, s.y); }
fn df_neg(a: vec2<f32>) -> vec2<f32> { return vec2<f32>(-a.x, -a.y); }
fn df_sub(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> { return df_add(a, df_neg(b)); }
fn two_prod(a: f32, b: f32) -> vec2<f32> { let p = opaque(a * b); return vec2<f32>(p, fma(a, b, -p)); }
fn df_mul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> { var p = two_prod(a.x, b.x); p.y = p.y + (a.x * b.y + a.y * b.x); return quick_two_sum(p.x, p.y); }
fn df_div(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
  let q1 = opaque(a.x / b.x); var r = df_sub(a, df_mul(b, vec2<f32>(q1, 0.0)));
  let q2 = opaque(r.x / b.x); r = df_sub(r, df_mul(b, vec2<f32>(q2, 0.0)));
  let q3 = opaque(r.x / b.x); return df_add(quick_two_sum(q1, q2), vec2<f32>(q3, 0.0)); }
// nearest integer of a df value below 2^31 in magnitude, ties away from zero (llround)
fn df_round_i32(a: vec2<f32>) -> i32 {
  let hiInt = round(a.x);
  let rest = two_sum(opaque(a.x - hiInt), a.y);
  let r = rest.x + rest.y;
  var fl = floor(r); let fr = opaque(r - fl);
  if (fr > 0.5 || (fr == 0.5 && r > 0.0)) { fl = fl + 1.0; }
  return i32(hiInt) + i32(fl);
}
${E}
fn vBelow(v: f32, L: u32) -> bool { let z = zs[L]; return v < z.x || (v == z.x && z.y > 0.0); }   // v < z exactly
fn zBelow(L: u32, v: f32) -> bool { let z = zs[L]; return z.x < v || (z.x == v && z.y < 0.0); }   // z < v exactly
fn vtx(t: u32, k: u32) -> vec3<f32> { let b = t * 9u + k * 3u; return vec3<f32>(tris[b], tris[b + 1u], tris[b + 2u]); }
fn df(v: f32) -> vec2<f32> { return vec2<f32>(v, 0.0); }
fn dfSign(a: vec2<f32>) -> f32 { if (a.x != 0.0) { return a.x; } return a.y; }
struct Cut { ok: bool, x0: vec2<f32>, y0: vec2<f32>, x1: vec2<f32>, y1: vec2<f32> }
fn cut(t: u32, L: u32) -> Cut {
  var r: Cut; r.ok = false;
  var cx: array<vec2<f32>, 2>; var cy: array<vec2<f32>, 2>; var n = 0u;
  let z = zs[L];
  for (var e = 0u; e < 3u; e = e + 1u) {
    let s = vtx(t, e); let en = vtx(t, (e + 1u) % 3u);
    let crosses = (vBelow(s.z, L) && !vBelow(en.z, L)) || (vBelow(en.z, L) && !vBelow(s.z, L));
    if (crosses) {
      if (n < 2u) {
        let f = df_div(df_sub(z, df(s.z)), df_sub(df(en.z), df(s.z)));
        cx[n] = df_add(df(s.x), df_mul(f, df_sub(df(en.x), df(s.x))));
        cy[n] = df_add(df(s.y), df_mul(f, df_sub(df(en.y), df(s.y))));
      }
      n = n + 1u;
    }
  }
  if (n != 2u) { return r; }
  let a = vtx(t, 0u); let b = vtx(t, 1u); let c = vtx(t, 2u);
  let e1x = df_sub(df(b.x), df(a.x)); let e1y = df_sub(df(b.y), df(a.y)); let e1z = df_sub(df(b.z), df(a.z));
  let e2x = df_sub(df(c.x), df(a.x)); let e2y = df_sub(df(c.y), df(a.y)); let e2z = df_sub(df(c.z), df(a.z));
  let nx = df_sub(df_mul(e1y, e2z), df_mul(e1z, e2y));
  let ny = df_sub(df_mul(e1z, e2x), df_mul(e1x, e2z));
  let dx = df_sub(cx[1], cx[0]); let dy = df_sub(cy[1], cy[0]);
  let along = df_sub(df_mul(dy, nx), df_mul(dx, ny));
  r.ok = true;
  if (dfSign(along) < 0.0) { r.x0 = cx[1]; r.y0 = cy[1]; r.x1 = cx[0]; r.y1 = cy[0]; }
  else { r.x0 = cx[0]; r.y0 = cy[0]; r.x1 = cx[1]; r.y1 = cy[1]; }
  return r;
}
fn firstLayer(zmin: f32) -> u32 {   // lower_bound: the first layer whose z is not below zmin
  var lo = 0u; var hi = P.y;
  while (lo < hi) { let mid = (lo + hi) / 2u; if (zBelow(mid, zmin)) { lo = mid + 1u; } else { hi = mid; } }
  return lo;
}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let t = tid(g); if (t >= P.x) { return; }
  let a = vtx(t, 0u); let b = vtx(t, 1u); let c = vtx(t, 2u);
  let zmin = min(a.z, min(b.z, c.z)); let zmax = max(a.z, max(b.z, c.z));
  var L = firstLayer(zmin); var k = 0u;
  var out = 0u; if (P.z == 1u) { out = counts[t]; }
  loop {
    if (L >= P.y || !zBelow(L, zmax)) { break; }
    let r = cut(t, L);
    if (r.ok) {
      if (P.z == 1u) {
        let s = out + k;
        let m = df(1000000.0); let q = df(1000.0);
        segPoints[s] = vec4<i32>(df_round_i32(df_mul(r.x0, m)), df_round_i32(df_mul(r.y0, m)), df_round_i32(df_mul(r.x1, m)), df_round_i32(df_mul(r.y1, m)));
        segKeys[s] = vec4<i32>(df_round_i32(df_mul(r.x0, q)), df_round_i32(df_mul(r.y0, q)), df_round_i32(df_mul(r.x1, q)), df_round_i32(df_mul(r.y1, q)));
        segLayer[s] = L;
      }
      k = k + 1u;
    }
    L = L + 1u;
  }
  if (P.z == 0u) { counts[t] = k; }
}`,O=`
fn mix(h0: u32, v: u32) -> u32 { var h = h0 ^ (v * 0x9E3779B1u); h = (h ^ (h >> 16u)) * 0x85EBCA6Bu; h = (h ^ (h >> 13u)) * 0xC2B2AE35u; return h ^ (h >> 16u); }`,ee=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments, table mask
@group(0) @binding(1) var<storage, read> segPoints: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segLayer: array<u32>;
@group(0) @binding(3) var<storage, read_write> owner: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> headForward: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> headBackward: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> next: array<u32>;
@group(0) @binding(7) var<storage, read_write> dead: array<u32>;
${O}
${E}
fn startIsLow(p: vec4<i32>) -> bool { return p.x < p.z || (p.x == p.z && p.y < p.w); }
fn place(s: u32) -> vec4<i32> { let p = segPoints[s]; if (startIsLow(p)) { return p; } return vec4<i32>(p.z, p.w, p.x, p.y); }
fn samePlace(a: u32, b: u32) -> bool { return segLayer[a] == segLayer[b] && all(place(a) == place(b)); }
fn zeroLength(s: u32) -> bool { let p = segPoints[s]; return p.x == p.z && p.y == p.w; }
@compute @workgroup_size(256) fn insert(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x || zeroLength(s)) { return; }
  let pl = place(s);
  var slot = mix(mix(mix(mix(mix(0u, segLayer[s]), bitcast<u32>(pl.x)), bitcast<u32>(pl.y)), bitcast<u32>(pl.z)), bitcast<u32>(pl.w)) & P.y;
  loop {
    let o = atomicLoad(&owner[slot]);
    if (o == 0u) { let r = atomicCompareExchangeWeak(&owner[slot], 0u, s + 1u); if (r.exchanged) { break; } continue; }
    if (samePlace(o - 1u, s)) { break; }
    slot = (slot + 1u) & P.y;
  }
  if (startIsLow(segPoints[s])) { next[s] = atomicExchange(&headForward[slot], s + 1u); }
  else { next[s] = atomicExchange(&headBackward[slot], s + 1u); }
}
// the first min(forward, backward) of each direction by segment order die (exact duplicates: which ones is immaterial)
fn sortedList(head: u32, out: ptr<function, array<u32, 16>>) -> u32 {
  var n = 0u; var cur = head;
  while (cur != 0u && n < 16u) { (*out)[n] = cur - 1u; n = n + 1u; cur = next[cur - 1u]; }
  for (var i = 1u; i < n; i = i + 1u) { let v = (*out)[i]; var j = i; while (j > 0u && (*out)[j - 1u] > v) { (*out)[j] = (*out)[j - 1u]; j = j - 1u; } (*out)[j] = v; }
  return n;
}
@compute @workgroup_size(256) fn pair(@builtin(global_invocation_id) g: vec3<u32>) {
  let slot = tid(g); if (slot > P.y) { return; }
  if (atomicLoad(&owner[slot]) == 0u) { return; }
  var f: array<u32, 16>; var b: array<u32, 16>;
  let nf = sortedList(atomicLoad(&headForward[slot]), &f); let nb = sortedList(atomicLoad(&headBackward[slot]), &b);
  let pairs = min(nf, nb);
  for (var k = 0u; k < pairs; k = k + 1u) { dead[f[k]] = 1u; dead[b[k]] = 1u; }
}`,k=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments, table mask
@group(0) @binding(1) var<storage, read> segKeys: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segLayer: array<u32>;
@group(0) @binding(3) var<storage, read> dead: array<u32>;
@group(0) @binding(4) var<storage, read_write> owner: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> startHead: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> endHead: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> startNext: array<u32>;
@group(0) @binding(8) var<storage, read_write> endNext: array<u32>;
@group(0) @binding(9) var<storage, read_write> successor: array<u32>;   // also [P.x]: matcher overflow count, [P.x+1]: open ends
${O}
${E}
fn slotOf(L: u32, x: i32, y: i32) -> u32 { return mix(mix(mix(0u, L), bitcast<u32>(x)), bitcast<u32>(y)) & P.y; }
@compute @workgroup_size(256) fn insertStarts(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  successor[s] = ${T}u;
  if (dead[s] != 0u) { return; }
  let k = segKeys[s]; let L = segLayer[s];
  var slot = slotOf(L, k.x, k.y);
  loop {
    let o = atomicLoad(&owner[slot]);
    if (o == 0u) { let r = atomicCompareExchangeWeak(&owner[slot], 0u, s + 1u); if (r.exchanged) { break; } continue; }
    let other = o - 1u; let ok = segKeys[other];
    if (segLayer[other] == L && ok.x == k.x && ok.y == k.y) { break; }
    slot = (slot + 1u) & P.y;
  }
  startNext[s] = atomicExchange(&startHead[slot], s + 1u);
}
@compute @workgroup_size(256) fn insertEnds(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x || dead[s] != 0u) { return; }
  let k = segKeys[s]; let L = segLayer[s];
  var slot = slotOf(L, k.z, k.w);
  loop {
    let o = atomicLoad(&owner[slot]);
    if (o == 0u) { return; }   // no segment starts here: an open end (counted by the matcher's absence)
    let other = o - 1u; let ok = segKeys[other];
    if (segLayer[other] == L && ok.x == k.z && ok.y == k.w) { break; }
    slot = (slot + 1u) & P.y;
  }
  endNext[s] = atomicExchange(&endHead[slot], s + 1u);
}
fn sortedStarts(head: u32, out: ptr<function, array<u32, 16>>) -> u32 {
  var n = 0u; var cur = head;
  while (cur != 0u && n < 16u) { (*out)[n] = cur - 1u; n = n + 1u; cur = startNext[cur - 1u]; }
  if (cur != 0u) { return 17u; }
  for (var i = 1u; i < n; i = i + 1u) { let v = (*out)[i]; var j = i; while (j > 0u && (*out)[j - 1u] > v) { (*out)[j] = (*out)[j - 1u]; j = j - 1u; } (*out)[j] = v; }
  return n;
}
fn sortedEnds(head: u32, out: ptr<function, array<u32, 16>>) -> u32 {
  var n = 0u; var cur = head;
  while (cur != 0u && n < 16u) { (*out)[n] = cur - 1u; n = n + 1u; cur = endNext[cur - 1u]; }
  if (cur != 0u) { return 17u; }
  for (var i = 1u; i < n; i = i + 1u) { let v = (*out)[i]; var j = i; while (j > 0u && (*out)[j - 1u] > v) { (*out)[j] = (*out)[j - 1u]; j = j - 1u; } (*out)[j] = v; }
  return n;
}
// chain_polys' greedy walk at one key: an arriving end takes the smallest unused segment starting there. A segment whose
//  two ends share the key (a sub-micron sliver) is taken only when it comes first, and then its own end takes the next
//  start; one left over closes on itself (a 1-segment loop, which chain_polys drops). Arriving ends are served in
//  segment order — the kernel's order whenever one end arrives at a key, which is the manifold case.
@compute @workgroup_size(256) fn pairEnds(@builtin(global_invocation_id) g: vec3<u32>) {
  let slot = tid(g); if (slot > P.y) { return; }
  if (atomicLoad(&owner[slot]) == 0u) { return; }
  var st: array<u32, 16>; var en: array<u32, 16>;
  let ns = sortedStarts(atomicLoad(&startHead[slot]), &st); let ne = sortedEnds(atomicLoad(&endHead[slot]), &en);
  if (ns > 16u || ne > 16u) { successor[P.x] = 1u; return; }
  var used = 0u; var selfKey = 0u;   // bit masks over st
  for (var i = 0u; i < ns; i = i + 1u) { for (var j = 0u; j < ne; j = j + 1u) { if (en[j] == st[i]) { selfKey = selfKey | (1u << i); } } }
  for (var j = 0u; j < ne; j = j + 1u) {
    var arriving = en[j]; var isSelf = false;
    for (var i = 0u; i < ns; i = i + 1u) { if (st[i] == arriving) { isSelf = true; } }
    if (isSelf) { continue; }
    loop {
      var pick = 16u;
      for (var i = 0u; i < ns; i = i + 1u) { if ((used & (1u << i)) == 0u) { pick = i; break; } }
      if (pick == 16u) { break; }
      used = used | (1u << pick); successor[arriving] = st[pick];
      if ((selfKey & (1u << pick)) == 0u) { break; }
      arriving = st[pick];
    }
  }
  for (var i = 0u; i < ns; i = i + 1u) { if ((selfKey & (1u << i)) != 0u && (used & (1u << i)) == 0u) { successor[st[i]] = st[i]; } }
}`,A=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments, mode (0 init labels, 1 label round, 2 init ranks, 3 rank round)
@group(0) @binding(1) var<storage, read> successor: array<u32>;
@group(0) @binding(2) var<storage, read> dead: array<u32>;
@group(0) @binding(3) var<storage, read_write> valueIn: array<u32>;
@group(0) @binding(4) var<storage, read_write> nextIn: array<u32>;
@group(0) @binding(5) var<storage, read_write> valueOut: array<u32>;
@group(0) @binding(6) var<storage, read_write> nextOut: array<u32>;
@group(0) @binding(7) var<storage, read> label: array<u32>;
@group(0) @binding(8) var<storage, read> reach: array<u32>;   // NONE: not on a cycle
${E}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  if (P.y == 0u) { if (dead[s] != 0u) { valueOut[s] = ${T}u; nextOut[s] = ${T}u; return; } valueOut[s] = s; nextOut[s] = successor[s]; return; }
  if (P.y == 2u) {
    let nx = successor[s];
    if (dead[s] != 0u || nx == ${T}u || reach[s] == ${T}u) { valueOut[s] = 0u; nextOut[s] = ${T}u; return; }
    if (nx == label[s]) { valueOut[s] = 0u; nextOut[s] = s; return; }   // the last segment before the head
    valueOut[s] = 1u; nextOut[s] = nx; return;
  }
  let nx = nextIn[s];
  if (nx == ${T}u) { valueOut[s] = valueIn[s]; nextOut[s] = nx; return; }
  if (P.y == 1u) { valueOut[s] = min(valueIn[s], valueIn[nx]); }
  else { if (nx == s) { valueOut[s] = valueIn[s]; } else { valueOut[s] = valueIn[s] + valueIn[nx]; } }
  nextOut[s] = nextIn[nx];
}`,te=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments, mode (0 mark, 1 flag)
@group(0) @binding(1) var<storage, read_write> reach: array<u32>;   // in: succ^(2^R), out: 0 on a cycle, NONE otherwise
@group(0) @binding(2) var<storage, read_write> hit: array<u32>;
${E}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  if (P.y == 0u) { let r = reach[s]; if (r != ${T}u) { hit[r] = 1u; } return; }
  reach[s] = select(${T}u, 0u, hit[s] == 1u); }`,j=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments, heads (padded), layers, stage parameter
@group(0) @binding(1) var<storage, read> successor: array<u32>;
@group(0) @binding(2) var<storage, read> label: array<u32>;
@group(0) @binding(3) var<storage, read> rank: array<u32>;          // distance to the loop's last segment
@group(0) @binding(4) var<storage, read> segLayer: array<u32>;
@group(0) @binding(5) var<storage, read_write> headFlag: array<u32>; // flag, then (after the scan) the head's index
@group(0) @binding(6) var<storage, read_write> heads: array<vec2<u32>>; // (layer, head) sorted
@group(0) @binding(7) var<storage, read_write> polyOf: array<u32>;   // head segment -> sorted polygon index
@group(0) @binding(8) var<storage, read_write> loopStart: array<u32>;// per sorted polygon: its length, then (scan) its first slot
@group(0) @binding(9) var<storage, read_write> order: array<u32>;    // slot -> segment
@group(0) @binding(10) var<storage, read> reach: array<u32>;
${E}
fn closed(s: u32) -> bool { return successor[s] != ${T}u && reach[s] != ${T}u; }
fn isHead(s: u32) -> bool { return closed(s) && label[s] == s; }
@compute @workgroup_size(256) fn flagHeads(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; } headFlag[s] = select(0u, 1u, isHead(s)); }
@compute @workgroup_size(256) fn gatherHeads(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  if (isHead(s)) { heads[headFlag[s]] = vec2<u32>(segLayer[s], s); } }
@compute @workgroup_size(256) fn padHeads(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = tid(g) + P.w; if (i >= P.y) { return; } heads[i] = vec2<u32>(${T}u, ${T}u); }
fn less(a: vec2<u32>, b: vec2<u32>) -> bool { return a.x < b.x || (a.x == b.x && a.y < b.y); }
@compute @workgroup_size(256) fn bitonic(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = tid(g); if (i >= P.y) { return; }
  let j = P.z; let k = P.w; let partner = i ^ j;
  if (partner <= i) { return; }
  let a = heads[i]; let b = heads[partner];
  let ascending = (i & k) == 0u;
  if (less(b, a) == ascending) { heads[i] = b; heads[partner] = a; }
}
@compute @workgroup_size(256) fn lengths(@builtin(global_invocation_id) g: vec3<u32>) {
  let p = tid(g); if (p >= P.w) { return; }
  let h = heads[p].y; polyOf[h] = p; loopStart[p] = rank[h] + 2u; }   // the kernel's n + 1 points: start(s0), end(s0..s(n-1))
@compute @workgroup_size(256) fn place(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  if (!closed(s)) { return; }
  let p = polyOf[label[s]];
  let length = loopStart[p + 1u] - loopStart[p];
  order[loopStart[p] + 1u + (length - 2u - rank[s])] = s;
  if (label[s] == s) { order[loopStart[p]] = s | 0x80000000u; } }`,M=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // slots, polygons, layers, stage
@group(0) @binding(1) var<storage, read> order: array<u32>;
@group(0) @binding(2) var<storage, read> segPoints: array<vec4<i32>>;
@group(0) @binding(3) var<storage, read> segLayer: array<u32>;
@group(0) @binding(4) var<storage, read> successor: array<u32>;
@group(0) @binding(5) var<storage, read> loopStart: array<u32>;      // per polygon: first slot (P.y + 1 entries)
@group(0) @binding(6) var<storage, read_write> kept: array<u32>;     // per slot, then scanned
@group(0) @binding(7) var<storage, read_write> polyKept: array<u32>; // per polygon: kept count, then valid flag, then scanned
@group(0) @binding(8) var<storage, read_write> layerAcc: array<atomic<i32>>;  // per layer: minx miny maxx maxy count, pad
@group(0) @binding(9) var<storage, read_write> slotPoly: array<u32>; // slot -> polygon
${E}
fn pointOf(i: u32) -> vec2<i32> { let e = order[i]; let p = segPoints[e & 0x7fffffffu]; if ((e & 0x80000000u) != 0u) { return p.xy; } return p.zw; }
fn layerOf(i: u32) -> u32 { return segLayer[order[i] & 0x7fffffffu]; }
@compute @workgroup_size(256) fn slotPolygons(@builtin(global_invocation_id) g: vec3<u32>) {
  let p = tid(g); if (p >= P.y) { return; }
  for (var i = loopStart[p]; i < loopStart[p + 1u]; i = i + 1u) { slotPoly[i] = p; } }
// a point is kept unless it equals the next point of its loop (write_polygon), and the layer box takes every live end
@compute @workgroup_size(256) fn keep(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = tid(g); if (i >= P.x) { return; }
  let p = slotPoly[i]; var nx = i + 1u; if (nx == loopStart[p + 1u]) { nx = loopStart[p]; }
  let a = pointOf(i); let b = pointOf(nx);
  kept[i] = select(0u, 1u, any(a != b));
  if (loopStart[p + 1u] - loopStart[p] < 3u) { return; }   // chain_polys keeps a loop of 3 points or more
  let L = layerOf(i);
  atomicMin(&layerAcc[L * 8u], a.x); atomicMin(&layerAcc[L * 8u + 1u], a.y);
  atomicMax(&layerAcc[L * 8u + 2u], a.x); atomicMax(&layerAcc[L * 8u + 3u], a.y); }
@compute @workgroup_size(256) fn polygonCounts(@builtin(global_invocation_id) g: vec3<u32>) {
  let p = tid(g); if (p >= P.y) { return; }
  var n = 0u; for (var i = loopStart[p]; i < loopStart[p + 1u]; i = i + 1u) { n = n + kept[i]; }
  polyKept[p] = select(0u, 1u, n >= 2u && loopStart[p + 1u] - loopStart[p] >= 3u); }
@compute @workgroup_size(256) fn keepValid(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = tid(g); if (i >= P.x) { return; }
  let p = slotPoly[i];
  if (polyKept[p] == 0u) { kept[i] = 0u; } }`,ne=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // slots, polygons, layers
@group(0) @binding(1) var<storage, read> order: array<u32>;
@group(0) @binding(2) var<storage, read> segPoints: array<vec4<i32>>;
@group(0) @binding(3) var<storage, read> segLayer: array<u32>;
@group(0) @binding(4) var<storage, read> keptFlag: array<u32>;   // per slot: kept (0/1)
@group(0) @binding(5) var<storage, read> keptAt: array<u32>;     // per slot: exclusive scan of kept
@group(0) @binding(6) var<storage, read> layerBox: array<i32>;   // per layer: minx miny maxx maxy, 8 words
@group(0) @binding(7) var<storage, read_write> points: array<vec2<i32>>;
@group(0) @binding(8) var<storage, read_write> layerCount: array<atomic<u32>>;
${E}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = tid(g); if (i >= P.x || keptFlag[i] == 0u) { return; }
  let e = order[i]; let s = e & 0x7fffffffu; let L = segLayer[s];
  var q = segPoints[s].zw; if ((e & 0x80000000u) != 0u) { q = segPoints[s].xy; }
  points[keptAt[i]] = q - vec2<i32>(layerBox[L * 8u], layerBox[L * 8u + 1u]);
  atomicAdd(&layerCount[L], 1u); }`,re=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // slots, polygons, layers, cell size
@group(0) @binding(1) var<storage, read> layerBox: array<i32>;
@group(0) @binding(2) var<storage, read_write> layerStart: array<u32>;   // per layer count, scanned (L + 1)
@group(0) @binding(3) var<storage, read_write> layerInfo: array<u32>;    // gw gh cellOffset 0
@group(0) @binding(4) var<storage, read> polyValidAt: array<u32>;        // scanned valid flags (P.y + 1)
@group(0) @binding(5) var<storage, read> loopStart: array<u32>;
@group(0) @binding(6) var<storage, read> keptAt: array<u32>;
@group(0) @binding(7) var<storage, read> order: array<u32>;
@group(0) @binding(8) var<storage, read> segLayer: array<u32>;
@group(0) @binding(9) var<storage, read_write> polyInfo: array<u32>;     // start count layerStart layerEnd; polyLayer after
${E}
@compute @workgroup_size(1) fn cells() {   // a serial pass over the layers (hundreds)
  var cells = 0u;
  for (var L = 0u; L < P.z; L = L + 1u) {
    var gw = 1u; var gh = 1u;
    if (layerBox[L * 8u + 2u] >= layerBox[L * 8u]) {
      gw = u32(layerBox[L * 8u + 2u] - layerBox[L * 8u]) / P.w + 1u; gh = u32(layerBox[L * 8u + 3u] - layerBox[L * 8u + 1u]) / P.w + 1u; }
    layerInfo[L * 4u] = gw; layerInfo[L * 4u + 1u] = gh; layerInfo[L * 4u + 2u] = cells; layerInfo[L * 4u + 3u] = 0u;
    cells = cells + gw * gh;
  }
  layerInfo[P.z * 4u] = cells; }
@compute @workgroup_size(256) fn polygons(@builtin(global_invocation_id) g: vec3<u32>) {
  let p = tid(g); if (p >= P.y) { return; }
  if (polyValidAt[p + 1u] == polyValidAt[p]) { return; }
  let q = polyValidAt[p];
  let first = keptAt[loopStart[p]]; let count = keptAt[loopStart[p + 1u]] - first;
  let L = segLayer[order[loopStart[p]] & 0x7fffffffu];
  polyInfo[q * 4u] = first; polyInfo[q * 4u + 1u] = count; polyInfo[q * 4u + 2u] = layerStart[L]; polyInfo[q * 4u + 3u] = layerStart[L + 1u];
  polyInfo[polyValidAt[P.y] * 4u + q] = L; }`,N=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // polygons, cell size
@group(0) @binding(1) var<storage, read> polyInfo: array<u32>;
@group(0) @binding(2) var<storage, read> points: array<vec2<i32>>;
@group(0) @binding(3) var<storage, read_write> total: array<atomic<u32>>;
${E}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let p = tid(g); if (p >= P.x) { return; }
  let first = polyInfo[p * 4u]; let n = polyInfo[p * 4u + 1u]; let c = i32(P.y);
  var a = points[first + n - 1u]; var sum = 0u;
  for (var i = 0u; i < n; i = i + 1u) { let b = points[first + i];
    sum = sum + u32(max(a.x, b.x) / c - min(a.x, b.x) / c + 1) * u32(max(a.y, b.y) / c - min(a.y, b.y) / c + 1); a = b; }
  atomicAdd(&total[0], sum); }`,P=`
@group(0) @binding(0) var<uniform> P: vec4<u32>;   // segments
@group(0) @binding(1) var<storage, read> dead: array<u32>;
@group(0) @binding(2) var<storage, read> reach: array<u32>;          // CYCLES_SHADER's output: NONE off every cycle
@group(0) @binding(3) var<storage, read> segLayer: array<u32>;
@group(0) @binding(4) var<storage, read_write> openLayer: array<u32>;
${E}
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let s = tid(g); if (s >= P.x) { return; }
  if (dead[s] == 0u && reach[s] == ${T}u) { openLayer[segLayer[s]] = 1u; } }`,F=`
@group(0) @binding(0) var<uniform> sp: vec4<u32>;
@group(0) @binding(1) var<storage, read_write> data: array<u32>;
@group(0) @binding(2) var<storage, read_write> sums: array<u32>;
var<workgroup> tmp: array<u32, 256>;
@compute @workgroup_size(256) fn scanBlock(@builtin(global_invocation_id) g_raw: vec3<u32>, @builtin(local_invocation_id) l: vec3<u32>, @builtin(workgroup_id) wg_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let wg = vec3<u32>(wg_raw.x + wg_raw.y * 65535u, 0u, 0u);
  if (wg.x * 256u >= sp.x + 256u) { return; }   // a workgroup past the last block (the second dispatch row): nothing to scan, and sums[wg] would be out of range
  let i = g.x; var v = 0u; if (i < sp.x) { v = data[i]; } tmp[l.x] = v; workgroupBarrier();
  for (var off = 1u; off < 256u; off = off * 2u) { var t = 0u; if (l.x >= off) { t = tmp[l.x - off]; } workgroupBarrier(); tmp[l.x] = tmp[l.x] + t; workgroupBarrier(); }
  if (i < sp.x) { data[i] = tmp[l.x] - v; }
  if (l.x == 255u) { sums[wg.x] = tmp[255]; }
}
@compute @workgroup_size(256) fn addOff(@builtin(global_invocation_id) g_raw: vec3<u32>, @builtin(workgroup_id) wg_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let wg = vec3<u32>(wg_raw.x + wg_raw.y * 65535u, 0u, 0u); if (g.x < sp.x) { data[g.x] = data[g.x] + sums[wg.x]; } }`,I={MAP_READ:1,COPY_SRC:4,COPY_DST:8,UNIFORM:64,STORAGE:128},L=65535,R=2e6,ie=2147483647,ae=-2147483648,z=e=>2**Math.ceil(Math.log2(Math.max(2,e)));async function B(e){let t={u:`uniform`,r:`read-only-storage`,w:`storage`},n=/* @__PURE__ */ new Map,r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Map,o=null,s=[],c=r=>(n.has(r)||n.set(r,e.createBindGroupLayout({entries:[...r].map((e,n)=>({binding:n,visibility:4,buffer:{type:t[e]}}))})),n.get(r)),l=(t,n,a)=>{let o=`${n}\u0000${a}\u0000${t}`;return i.has(o)||(r.has(t)||r.set(t,e.createShaderModule({code:t})),i.set(o,e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:[c(a)]}),compute:{module:r.get(t),entryPoint:n}}))),i.get(o)};for(let t of[D,ee,k,A,te,j,M,ne,re,N,P,F]){let n=e.createShaderModule({code:t});r.set(t,n);let i=(await n.getCompilationInfo()).messages.find(e=>e.type===`error`);if(i)throw Error(`contour front shader: line ${i.lineNum}: ${i.message}`)}let u=(t,n)=>{let r=Math.max(16,Math.ceil(n/16)*16),i=a.get(t);if(i&&i.size>=r)return i;i&&s.push(i);let o=e.createBuffer({size:r,usage:I.STORAGE|I.COPY_SRC|I.COPY_DST});return a.set(t,o),o},d=()=>(o||=e.createCommandEncoder(),o),f=t=>{let n=e.createBuffer({size:Math.max(16,t.length*4),usage:I.UNIFORM|I.COPY_DST});return e.queue.writeBuffer(n,0,new Uint32Array(t)),s.push(n),n},p=e.createBuffer({size:16,usage:I.UNIFORM|I.COPY_DST});e.queue.writeBuffer(p,0,/* @__PURE__ */ new Uint32Array(4));let m=(t,n,r,i,a)=>{if(a<=0)return;let o=Math.ceil(a/256),s=1;o>L&&(s=Math.ceil(o/L),o=L);let u=e.createBindGroup({layout:c(r),entries:i.map((e,t)=>({binding:t,resource:{buffer:e}}))}),f=d().beginComputePass();f.setPipeline(l(t,n,r)),f.setBindGroup(0,u),f.dispatchWorkgroups(o,s),f.end()},h=(e,t)=>d().clearBuffer(e,0,Math.ceil(t/4)*4),g=(e,t,n,r,i)=>d().copyBufferToBuffer(e,t,n,r,i),_=async()=>{o&&=(e.queue.submit([o.finish()]),null),await e.queue.onSubmittedWorkDone();for(let e of s)e.destroy();s=[]},v=async(t,n,r=0,i=Uint32Array)=>{let a=Math.max(4,n*4),o=e.createBuffer({size:Math.ceil(a/16)*16,usage:I.MAP_READ|I.COPY_DST});d().copyBufferToBuffer(t,r*4,o,0,Math.ceil(a/4)*4),await _(),await o.mapAsync(1);let s=new i(o.getMappedRange(0,n*4).slice(0));return o.unmap(),o.destroy(),s},y=(e,t,n=0)=>{let r=Math.ceil(t/256),i=u(`scan.${n}`,(r+1)*4),a=f([t,0,0,0]);m(F,`scanBlock`,`uww`,[a,e,i],t),r!==1&&(y(i,r,n+1),m(F,`addOff`,`uww`,[a,e,i],t))};async function b(t,n){let r=t.length/9,i=n.length,a=new Float32Array(i*2);for(let e=0;e<i;e++){let t=Math.fround(n[e]);a[e*2]=t,a[e*2+1]=Math.fround(n[e]-t)}let o=u(`triangles`,t.byteLength),s=u(`planes`,a.byteLength);e.queue.writeBuffer(o,0,t),e.queue.writeBuffer(s,0,a);let c=u(`counts`,(r+1)*4);h(c,(r+1)*4);let l=[1,2,3].map(e=>u(`unused${e}`,16));m(D,`main`,`urrwwwwu`,[f([r,i,0,0]),o,s,c,...l,p],r),y(c,r+1);let[d]=await v(c,1,r),g=u(`segmentPoints`,d*16),_=u(`segmentKeys`,d*16),b=u(`segmentLayer`,d*4);m(D,`main`,`urrwwwwu`,[f([r,i,1,0]),o,s,c,g,_,b,p],r);let x=z(d*2),S=x-1,C=u(`dead`,d*4),w=u(`owner`,x*4),T=u(`headA`,x*4),E=u(`headB`,x*4),O=u(`nextA`,d*4),A=u(`nextB`,d*4);h(C,d*4),h(w,x*4),h(T,x*4),h(E,x*4);let te=[f([d,S,0,0]),g,b,w,T,E,O,C];m(ee,`insert`,`urrwwwww`,te,d),m(ee,`pair`,`urrwwwww`,te,x),h(w,x*4),h(T,x*4),h(E,x*4);let j=u(`successor`,(d+2)*4);h(j,(d+2)*4);let M=[f([d,S,0,0]),_,b,C,w,T,E,O,A,j];return m(k,`insertStarts`,`urrrwwwwww`,M,d),m(k,`insertEnds`,`urrrwwwwww`,M,d),m(k,`pairEnds`,`urrrwwwwww`,M,x),{layerCount:i,segmentCount:d,segmentPoints:g,segmentLayer:b,successor:j,dead:C}}async function x(t){let{layerCount:n,segmentCount:r,segmentPoints:i,segmentLayer:a,successor:o,dead:s}=t,c=Math.ceil(Math.log2(Math.max(2,r)))+1,l=u(`valueA`,r*4),d=u(`nextOfA`,r*4),p=u(`valueB`,r*4),_=u(`nextOfB`,r*4),b=u(`label`,r*4),x=u(`rank`,r*4),S=u(`reach`,r*4),C=(e,t,n)=>m(A,`main`,`urrwwwwrr`,[f([r,e,0,0]),o,s,t[0],t[1],n[0],n[1],b,S],r),w=(e,t,n)=>{let i=[l,d],a=[p,_];for(let t=0;t<c;t++)C(e,i,a),[i,a]=[a,i];g(i[0],0,t,0,r*4),n&&g(i[1],0,n,0,r*4)};C(0,[p,_],[l,d]),w(1,b,S);let T=u(`hit`,r*4);h(T,r*4),m(te,`main`,`uww`,[f([r,0,0,0]),S,T],r),m(te,`main`,`uww`,[f([r,1,0,0]),S,T],r);let E=u(`openLayer`,n*4);h(E,n*4),m(P,`main`,`urrrw`,[f([r,0,0,0]),s,S,a,E],r),C(2,[p,_],[l,d]),w(3,x);let D=u(`headFlag`,(r+1)*4);h(D,(r+1)*4);let O=(e,t,n,r,i)=>[e,o,b,x,a,D,t,n,r,i,S],ee=[4,5,6,7].map(e=>u(`unused${e}`,16));m(j,`flagHeads`,`urrrrwwwwwr`,O(f([r,0,n,0]),...ee),r),y(D,r+1);let[k]=await v(D,1,r),F=z(k),I=u(`heads`,F*8),L=u(`polygonOf`,r*4),B=u(`loopStart`,(k+1)*4),V=u(`order`,(r+k)*4),oe=e=>O(e,I,L,B,V);m(j,`gatherHeads`,`urrrrwwwwwr`,oe(f([r,F,n,0])),r),m(j,`padHeads`,`urrrrwwwwwr`,oe(f([r,F,n,k])),F-k);for(let e=2;e<=F;e*=2)for(let t=e/2;t>=1;t/=2)m(j,`bitonic`,`urrrrwwwwwr`,oe(f([r,F,t,e])),F);h(B,(k+1)*4),m(j,`lengths`,`urrrrwwwwwr`,oe(f([r,F,n,k])),k),y(B,k+1);let[H]=await v(B,1,k);m(j,`place`,`urrrrwwwwwr`,oe(f([r,F,n,k])),r);let se=u(`kept`,(H+1)*4),ce=u(`polygonKept`,(k+1)*4),U=u(`layerBox`,n*32),le=u(`slotPolygon`,H*4),ue=new Int32Array(n*8);for(let e=0;e<n;e++)ue.set([ie,ie,ae,ae],e*8);e.queue.writeBuffer(U,0,ue),h(se,(H+1)*4);let W=[f([H,k,n,0]),V,i,a,o,B,se,ce,U,le];m(M,`slotPolygons`,`urrrrrwwww`,W,k),m(M,`keep`,`urrrrrwwww`,W,H),m(M,`polygonCounts`,`urrrrrwwww`,W,k),m(M,`keepValid`,`urrrrrwwww`,W,H);let de=u(`polygonValidAt`,(k+1)*4);h(de,(k+1)*4),g(ce,0,de,0,k*4),y(de,k+1);let G=u(`keptAt`,(H+1)*4);h(G,(H+1)*4),g(se,0,G,0,H*4),y(G,H+1);let[K]=await v(G,1,H),[fe]=await v(de,1,k),pe=u(`points`,K*8),q=u(`layerStart`,(n+1)*4);h(q,(n+1)*4),m(ne,`main`,`urrrrrrww`,[f([H,k,n,0]),V,i,a,se,G,U,pe,q],H),y(q,n+1);let me=u(`layerInfo`,(n+1)*16),J=u(`polygonInfo`,fe*20+16),he=[f([H,k,n,R]),U,q,me,de,B,G,V,a,J];m(re,`cells`,`urwwrrrrrw`,he,1),m(re,`polygons`,`urwwrrrrrw`,he,k);let Y=u(`entries`,16);h(Y,16),m(N,`main`,`urrw`,[f([fe,R,0,0]),J,pe,Y],fe);let[ge]=await v(me,1,n*4),[X]=await v(Y,1),Z=await v(U,n*8,0,Int32Array),_e=await v(E,n),Q=new Int32Array(n*2);for(let e=0;e<n;e++)Z[e*8+2]<Z[e*8]||(Q[e*2]=Z[e*8],Q[e*2+1]=Z[e*8+1]);return{layerCount:n,segmentCount:K,polygonCount:fe,cellCount:ge,cellEntryCount:X,headCount:k,slotCount:H,origins:Q,openLayers:_e,points:pe,layerInfo:me,polygonInfo:J}}return{cut:async(e,t)=>{let n=performance.now(),r=await b(e,t),[i]=await v(r.successor,1,r.segmentCount),a=await v(r.dead,r.segmentCount),o=0;for(let e of a)o+=e;let s=await x(r),c=s.slotCount-s.headCount;return{ms:performance.now()-n,triangleCount:e.length/9,rawSegments:r.segmentCount,cancelled:o,openSegments:r.segmentCount-o-c,matcherOverflow:i,origins:s.origins,openLayers:s.openLayers,input:{layerCount:s.layerCount,segmentCount:s.segmentCount,polygonCount:s.polygonCount,cellCount:s.cellCount,cellEntryCount:s.cellEntryCount,points:{gpuBuffer:s.points},layerInfo:{gpuBuffer:s.layerInfo},polyInfo:{gpuBuffer:s.polygonInfo},polyLayer:{gpuBuffer:s.polygonInfo,offset:s.polygonCount*16}}}},dispose:()=>{for(let e of a.values())e.destroy();a.clear();for(let e of s)e.destroy();s=[],p.destroy()}}}const V={MAP_READ:1,COPY_SRC:4,COPY_DST:8,UNIFORM:64,STORAGE:128,INDIRECT:256},oe=2e6,H=65535,se=4096,ce=[1,3],U=1<<30;async function le(e){if(!e)return null;let t=await e.requestAdapter();return!t||t.limits.maxStorageBuffersPerShaderStage<10?null:t.requestDevice({requiredLimits:{maxStorageBufferBindingSize:Math.min(t.limits.maxStorageBufferBindingSize,U),maxBufferSize:Math.min(t.limits.maxBufferSize,U),maxStorageBuffersPerShaderStage:10}})}async function ue(e){let t=async(t,n)=>{let r=e.createShaderModule({code:t}),i=(await r.getCompilationInfo()).messages.find(e=>e.type===`error`);if(i)throw Error(`contour GPU shader ${n}: line ${i.lineNum}: ${i.message}`);return r},n={u:`uniform`,r:`read-only-storage`,w:`storage`},r=t=>e.createBindGroupLayout({entries:[...t].map((e,t)=>({binding:t,visibility:4,buffer:{type:n[e]}}))}),i=(t,n,r)=>e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:[n]}),compute:{module:t,entryPoint:r}}),a={expand:r(`urrrwww`),bin:r(`urrrwrw`),intersect:r(`urrrrrwwrww`),sort:r(`urrrrwr`),link:r(`urrwrwwww`),scan:r(`uww`),check:r(`urw`),glue:r(`urrrurrrww`),pieces:r(`urrrurrrrwww`),ties:r(`urrw`),zip:r(`urrw`),directions:r(`urw`),compact:r(`urrrw`),gate:r(`urrw`),args:r(`urw`),polygonWinding:r(`urrw`)},o={expand:await t(`
@group(0) @binding(0) var<uniform> ep: vec4<u32>;   // segments, polygons
@group(0) @binding(1) var<storage, read> pts: array<vec2<i32>>;
@group(0) @binding(2) var<storage, read> polyIn: array<vec4<u32>>;   // first, count, layer start, layer end
@group(0) @binding(3) var<storage, read> polyLayerIn: array<u32>;
@group(0) @binding(4) var<storage, read_write> segOut: array<vec4<i32>>;
@group(0) @binding(5) var<storage, read_write> infoOut: array<vec4<u32>>;
@group(0) @binding(6) var<storage, read_write> segPolyOut: array<u32>;
@compute @workgroup_size(256) fn expand(@builtin(global_invocation_id) g_raw: vec3<u32>) { let i = g_raw.x + g_raw.y * 16776960u; if (i >= ep.x || ep.y == 0u) { return; }
  var lo = 0u; var hi = ep.y;
  for (var step = 0u; step < 32u; step++) { if (hi - lo <= 1u) { break; } let mid = (lo + hi) / 2u; if (polyIn[mid].x <= i) { lo = mid; } else { hi = mid; } }
  let first = polyIn[lo].x; let count = polyIn[lo].y; let next = first + (i - first + 1u) % count; let prev = first + (i - first + count - 1u) % count;
  let a = pts[i]; let b = pts[next];
  segOut[i] = vec4<i32>(a.x, a.y, b.x, b.y);
  var flag = 0u; if (i == first) { flag = 1u; }
  infoOut[i] = vec4<u32>(polyLayerIn[lo], prev, next, flag);
  segPolyOut[i] = lo; }`,`expand`),bin:await t(`// a range from a corrupt scan must not spin the GPU: a dispatch keeps running after its process is killed (measured). Observed max 107 per cell, 13 per segment.
const RANGE_CAP = 4096u;
fn badRange(lo: u32, hi: u32) -> bool { return hi < lo || hi - lo > RANGE_CAP; }

fn mulu(a: u32, b: u32) -> vec2<u32> {   // unsigned 32x32 -> 64 (lo, hi)
  let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u;
  let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u);
  let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; }
  let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; }
  return vec2<u32>(lo, hi);
}
fn muls(a: i32, b: i32) -> vec2<u32> {   // signed 32x32 -> 64, two's complement
  let neg = (a < 0) != (b < 0);
  var r = mulu(u32(abs(a)), u32(abs(b)));
  if (neg) { r = neg64(r); }
  return r;
}
fn neg64(a: vec2<u32>) -> vec2<u32> { var lo = ~a.x; var hi = ~a.y; lo = lo + 1u; if (lo == 0u) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn sub64(a: vec2<u32>, b: vec2<u32>) -> vec2<u32> { var hi = a.y - b.y; if (a.x < b.x) { hi = hi - 1u; } return vec2<u32>(a.x - b.x, hi); }
fn sign64(a: vec2<u32>) -> i32 { if ((a.y & 0x80000000u) != 0u) { return -1; } if (a.x == 0u && a.y == 0u) { return 0; } return 1; }
fn cross(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { return sub64(muls(ux, vy), muls(uy, vx)); }
fn orient(ax: i32, ay: i32, bx: i32, by: i32, cx: i32, cy: i32) -> i32 { return sign64(cross(bx - ax, by - ay, cx - ax, cy - ay)); }
fn u64f(a: vec2<u32>) -> f32 { return f32(a.y) * 4294967296.0 + f32(a.x); }   // non-negative values only
// exact rounded quotient round(num * |d| / den) for 0 <= num < den (u64), |d| < 2^31: restoring division in 128-bit arithmetic
fn add128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn sub128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { return add128u(a, add128u(vec4<u32>(~b.x, ~b.y, ~b.z, ~b.w), vec4<u32>(1u, 0u, 0u, 0u))); }
fn ge128(a: vec4<u32>, b: vec4<u32>) -> bool { if (a.w != b.w) { return a.w > b.w; } if (a.z != b.z) { return a.z > b.z; } if (a.y != b.y) { return a.y > b.y; } return a.x >= b.x; }
fn shl128(a: vec4<u32>, s: u32) -> vec4<u32> { if (s == 0u) { return a; } let t = 32u - s; return vec4<u32>(a.x << s, (a.y << s) | (a.x >> t), (a.z << s) | (a.y >> t), (a.w << s) | (a.z >> t)); }
fn roundedShift(num: vec2<u32>, den: vec2<u32>, d: i32) -> i32 {
  if (d == 0) { return 0; }
  let ad = u32(abs(d)); let lo = mulu(num.x, ad); let hi = mulu(num.y, ad);
  var n = vec4<u32>(lo.x, lo.y, 0u, 0u); n = add128u(n, vec4<u32>(0u, hi.x, hi.y, 0u));
  n = shl128(n, 1u); n = add128u(n, vec4<u32>(den.x, den.y, 0u, 0u));
  let dd = shl128(vec4<u32>(den.x, den.y, 0u, 0u), 1u);
  var q = 0u; var sh = shl128(dd, 31u);
  for (var b = 31; b >= 0; b--) { if (ge128(n, sh)) { n = sub128u(n, sh); q = q | (1u << u32(b)); }
    sh = vec4<u32>((sh.x >> 1u) | (sh.y << 31u), (sh.y >> 1u) | (sh.z << 31u), (sh.z >> 1u) | (sh.w << 31u), sh.w >> 1u); }
  if (d < 0) { return -i32(q); } return i32(q);
}
struct Params { n: u32, cells: u32, cs: i32, mode: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> segs: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segInfo: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> layerInfo: array<vec4<i32>>;   // gw, gh, cellBase, 0
fn vtx(v: u32) -> vec2<i32> { return segs[v].xy; }
fn orientSoS(p: u32, q: u32, r: u32) -> i32 {   // Simulation of Simplicity: higher id dominates, x displacement before y
  let P = vtx(p); let Q = vtx(q); let R = vtx(r);
  let d = orient(P.x, P.y, Q.x, Q.y, R.x, R.y); if (d != 0) { return d; }
  var ids = array<u32, 3>(p, q, r);
  var cv = array<vec2<i32>, 3>(R - Q, P - R, Q - P);
  for (var round = 0; round < 3; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 3; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    var c = vec2<i32>(0, 0);
    for (var k = 0; k < 3; k++) { if (ids[k] == top) { c = c + cv[k]; ids[k] = 0xffffffffu; } }
    if (c.y != 0) { return -sign(c.y); }
    if (c.x != 0) { return sign(c.x); }
  }
  return 0;
}
fn cellRange(i: u32) -> vec4<i32> { let s = segs[i]; return vec4<i32>(min(s.x, s.z) / params.cs, min(s.y, s.w) / params.cs, max(s.x, s.z) / params.cs, max(s.y, s.w) / params.cs); }

@group(0) @binding(4) var<storage, read_write> cellCount: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read> cellStart: array<u32>;
@group(0) @binding(6) var<storage, read_write> cellList: array<vec2<u32>>;
@compute @workgroup_size(256) fn count(@builtin(global_invocation_id) gid_raw: vec3<u32>) { let gid = vec3<u32>(gid_raw.x + gid_raw.y * 16776960u, 0u, 0u);
  let i = gid.x; if (i >= params.n) { return; }
  let r = cellRange(i); let L = layerInfo[segInfo[i].x];
  for (var cy = r.y; cy <= r.w; cy++) { for (var cx = r.x; cx <= r.z; cx++) { atomicAdd(&cellCount[u32(L.z + cy * L.x + cx)], 1u); } }
}
@compute @workgroup_size(256) fn scatter(@builtin(global_invocation_id) gid_raw: vec3<u32>) { let gid = vec3<u32>(gid_raw.x + gid_raw.y * 16776960u, 0u, 0u);
  let i = gid.x; if (i >= params.n) { return; }
  let r = cellRange(i); let L = layerInfo[segInfo[i].x];
  for (var cy = r.y; cy <= r.w; cy++) { for (var cx = r.x; cx <= r.z; cx++) { let c = u32(L.z + cy * L.x + cx); let k = atomicAdd(&cellCount[c], 1u); if (cellStart[c] + k < arrayLength(&cellList)) { cellList[cellStart[c] + k] = vec2<u32>(i, c); } } }
}`,`bin`),intersect:await t(`// a range from a corrupt scan must not spin the GPU: a dispatch keeps running after its process is killed (measured). Observed max 107 per cell, 13 per segment.
const RANGE_CAP = 4096u;
fn badRange(lo: u32, hi: u32) -> bool { return hi < lo || hi - lo > RANGE_CAP; }

fn mulu(a: u32, b: u32) -> vec2<u32> {   // unsigned 32x32 -> 64 (lo, hi)
  let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u;
  let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u);
  let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; }
  let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; }
  return vec2<u32>(lo, hi);
}
fn muls(a: i32, b: i32) -> vec2<u32> {   // signed 32x32 -> 64, two's complement
  let neg = (a < 0) != (b < 0);
  var r = mulu(u32(abs(a)), u32(abs(b)));
  if (neg) { r = neg64(r); }
  return r;
}
fn neg64(a: vec2<u32>) -> vec2<u32> { var lo = ~a.x; var hi = ~a.y; lo = lo + 1u; if (lo == 0u) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn sub64(a: vec2<u32>, b: vec2<u32>) -> vec2<u32> { var hi = a.y - b.y; if (a.x < b.x) { hi = hi - 1u; } return vec2<u32>(a.x - b.x, hi); }
fn sign64(a: vec2<u32>) -> i32 { if ((a.y & 0x80000000u) != 0u) { return -1; } if (a.x == 0u && a.y == 0u) { return 0; } return 1; }
fn cross(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { return sub64(muls(ux, vy), muls(uy, vx)); }
fn orient(ax: i32, ay: i32, bx: i32, by: i32, cx: i32, cy: i32) -> i32 { return sign64(cross(bx - ax, by - ay, cx - ax, cy - ay)); }
fn u64f(a: vec2<u32>) -> f32 { return f32(a.y) * 4294967296.0 + f32(a.x); }   // non-negative values only
// exact rounded quotient round(num * |d| / den) for 0 <= num < den (u64), |d| < 2^31: restoring division in 128-bit arithmetic
fn add128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn sub128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { return add128u(a, add128u(vec4<u32>(~b.x, ~b.y, ~b.z, ~b.w), vec4<u32>(1u, 0u, 0u, 0u))); }
fn ge128(a: vec4<u32>, b: vec4<u32>) -> bool { if (a.w != b.w) { return a.w > b.w; } if (a.z != b.z) { return a.z > b.z; } if (a.y != b.y) { return a.y > b.y; } return a.x >= b.x; }
fn shl128(a: vec4<u32>, s: u32) -> vec4<u32> { if (s == 0u) { return a; } let t = 32u - s; return vec4<u32>(a.x << s, (a.y << s) | (a.x >> t), (a.z << s) | (a.y >> t), (a.w << s) | (a.z >> t)); }
fn roundedShift(num: vec2<u32>, den: vec2<u32>, d: i32) -> i32 {
  if (d == 0) { return 0; }
  let ad = u32(abs(d)); let lo = mulu(num.x, ad); let hi = mulu(num.y, ad);
  var n = vec4<u32>(lo.x, lo.y, 0u, 0u); n = add128u(n, vec4<u32>(0u, hi.x, hi.y, 0u));
  n = shl128(n, 1u); n = add128u(n, vec4<u32>(den.x, den.y, 0u, 0u));
  let dd = shl128(vec4<u32>(den.x, den.y, 0u, 0u), 1u);
  var q = 0u; var sh = shl128(dd, 31u);
  for (var b = 31; b >= 0; b--) { if (ge128(n, sh)) { n = sub128u(n, sh); q = q | (1u << u32(b)); }
    sh = vec4<u32>((sh.x >> 1u) | (sh.y << 31u), (sh.y >> 1u) | (sh.z << 31u), (sh.z >> 1u) | (sh.w << 31u), sh.w >> 1u); }
  if (d < 0) { return -i32(q); } return i32(q);
}
struct Params { n: u32, cells: u32, cs: i32, mode: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> segs: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segInfo: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> layerInfo: array<vec4<i32>>;   // gw, gh, cellBase, 0
fn vtx(v: u32) -> vec2<i32> { return segs[v].xy; }
fn orientSoS(p: u32, q: u32, r: u32) -> i32 {   // Simulation of Simplicity: higher id dominates, x displacement before y
  let P = vtx(p); let Q = vtx(q); let R = vtx(r);
  let d = orient(P.x, P.y, Q.x, Q.y, R.x, R.y); if (d != 0) { return d; }
  var ids = array<u32, 3>(p, q, r);
  var cv = array<vec2<i32>, 3>(R - Q, P - R, Q - P);
  for (var round = 0; round < 3; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 3; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    var c = vec2<i32>(0, 0);
    for (var k = 0; k < 3; k++) { if (ids[k] == top) { c = c + cv[k]; ids[k] = 0xffffffffu; } }
    if (c.y != 0) { return -sign(c.y); }
    if (c.x != 0) { return sign(c.x); }
  }
  return 0;
}
fn cellRange(i: u32) -> vec4<i32> { let s = segs[i]; return vec4<i32>(min(s.x, s.z) / params.cs, min(s.y, s.w) / params.cs, max(s.x, s.z) / params.cs, max(s.y, s.w) / params.cs); }

@group(0) @binding(4) var<storage, read> cellStart: array<u32>;
@group(0) @binding(5) var<storage, read> cellList: array<vec2<u32>>;
@group(0) @binding(6) var<storage, read_write> evCount: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> events: array<vec4<u32>>;
@group(0) @binding(8) var<storage, read> evStart: array<u32>;
@group(0) @binding(9) var<storage, read_write> flags: array<atomic<u32>>;   // [0]: pair counter, [1]: collinear pivots
@group(0) @binding(10) var<storage, read_write> pairEdges: array<vec2<u32>>;
fn emit(seg: u32, num: vec2<u32>, den: vec2<u32>, delta: i32, px: i32, py: i32, vid: u32) {
  if (params.mode == 0u) { atomicAdd(&evCount[seg], 1u); return; }
  let k = atomicAdd(&evCount[seg], 1u); let at = (evStart[seg] + k) * 2u; if (at + 1u >= arrayLength(&events)) { return; }
  events[at] = vec4<u32>(num.x, num.y, den.x, den.y); events[at + 1u] = vec4<u32>(bitcast<u32>(delta), bitcast<u32>(px), bitcast<u32>(py), vid);
}
fn dotw(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { let a = muls(ux, vx); let b = muls(uy, vy); var lo = a.x + b.x; var hi = a.y + b.y; if (lo < a.x) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
@compute @workgroup_size(256) fn intersect(@builtin(global_invocation_id) gid_raw: vec3<u32>) { let gid = vec3<u32>(gid_raw.x + gid_raw.y * 16776960u, 0u, 0u);
  let a0 = gid.x; if (a0 >= arrayLength(&cellList) || params.cells == 0u) { return; }
  let c = cellList[a0].y; if (c >= params.cells) { return; }
  let s0 = cellStart[c]; let s1 = cellStart[c + 1u]; if (a0 < s0 || a0 >= s1 || badRange(s0, s1)) { return; }
  let L = layerInfo[segInfo[cellList[s0].x].x];
  let cl = i32(c) - L.z; let cellX = cl % L.x; let cellY = cl / L.x;
  for (var a = a0; a < a0 + 1u; a++) {
    let i = cellList[a].x; let A = segs[i]; let a1 = segInfo[i].z;
    for (var b = a + 1u; b < s1; b++) {
      let j = cellList[b].x; let Bs = segs[j]; let b1 = segInfo[j].z;
      let lox = max(min(A.x, A.z), min(Bs.x, Bs.z)); let hix = min(max(A.x, A.z), max(Bs.x, Bs.z));
      let loy = max(min(A.y, A.w), min(Bs.y, Bs.w)); let hiy = min(max(A.y, A.w), max(Bs.y, Bs.w));
      if (lox > hix || loy > hiy) { continue; }
      if (lox / params.cs != cellX || loy / params.cs != cellY) { continue; }
      if (i == j || i == b1 || a1 == j || a1 == b1) { continue; }   // adjacent edges meet only at their shared vertex
      let o1 = orientSoS(i, a1, j); let o2 = orientSoS(i, a1, b1); let o3 = orientSoS(j, b1, i); let o4 = orientSoS(j, b1, a1);
      if (!(o1 * o2 < 0 && o3 * o4 < 0)) { continue; }
      var den = cross(A.z - A.x, A.w - A.y, Bs.z - Bs.x, Bs.w - Bs.y);
      var numI = vec2<u32>(0u, 0u); var denI = vec2<u32>(1u, 0u); var numJ = vec2<u32>(0u, 0u); var denJ = vec2<u32>(1u, 0u);
      var px = 0; var py = 0;
      if (sign64(den) != 0) {
        numI = cross(Bs.x - A.x, Bs.y - A.y, Bs.z - Bs.x, Bs.w - Bs.y); denI = den;
        if (sign64(denI) < 0) { numI = neg64(numI); denI = neg64(denI); }
        numJ = cross(A.x - Bs.x, A.y - Bs.y, A.z - A.x, A.w - A.y); denJ = neg64(den);
        if (sign64(denJ) < 0) { numJ = neg64(numJ); denJ = neg64(denJ); }
        // the point is computed along the lower-index segment: which of the two a cell lists first depends on atomic order, and the
        //  two parametrisations round differently in f32 (measured: 1-unit differences between identical runs)
        // exact integer rounding (f32 rounded 0.84 % of points differently on SwiftShader than on Metal), along the lower-index segment
        if (params.mode == 0u) { }
        else if (i < j) { px = A.x + roundedShift(numI, denI, A.z - A.x); py = A.y + roundedShift(numI, denI, A.w - A.y); }
        else { px = Bs.x + roundedShift(numJ, denJ, Bs.z - Bs.x); py = Bs.y + roundedShift(numJ, denJ, Bs.w - Bs.y); }
      } else {   // collinear pair made to cross by SoS: next to the pivot endpoint
        if (params.mode == 1u) { atomicAdd(&flags[1], 1u); }
        let top = max(max(i, a1), max(j, b1)); var pv = a1;
        if (top == b1) { pv = j; } else if (top == j) { pv = b1; } else if (top == a1) { pv = i; }
        let Pv = vtx(pv); px = Pv.x; py = Pv.y;
        if (pv == i) { numI = vec2<u32>(0u, 0u); } else if (pv == a1) { numI = vec2<u32>(1u, 0u); } else { numI = dotw(px - A.x, py - A.y, A.z - A.x, A.w - A.y); denI = dotw(A.z - A.x, A.w - A.y, A.z - A.x, A.w - A.y); }
        if (pv == j) { numJ = vec2<u32>(0u, 0u); } else if (pv == b1) { numJ = vec2<u32>(1u, 0u); } else { numJ = dotw(px - Bs.x, py - Bs.y, Bs.z - Bs.x, Bs.w - Bs.y); denJ = dotw(Bs.z - Bs.x, Bs.w - Bs.y, Bs.z - Bs.x, Bs.w - Bs.y); }
      }
      var vid = 0u;
      if (params.mode == 1u) { let pid = atomicAdd(&flags[0], 1u); vid = params.n + pid; if (pid < arrayLength(&pairEdges)) { pairEdges[pid] = vec2<u32>(i, j); } }
      var dI = -1; if (o3 < 0) { dI = 1; }
      var dJ = -1; if (o1 < 0) { dJ = 1; }
      emit(i, numI, denI, dI, px, py, vid);
      emit(j, numJ, denJ, dJ, px, py, vid);
    }
  }
}`,`intersect`),sort:await t(`// a range from a corrupt scan must not spin the GPU: a dispatch keeps running after its process is killed (measured). Observed max 107 per cell, 13 per segment.
const RANGE_CAP = 4096u;
fn badRange(lo: u32, hi: u32) -> bool { return hi < lo || hi - lo > RANGE_CAP; }

fn mulu(a: u32, b: u32) -> vec2<u32> {   // unsigned 32x32 -> 64 (lo, hi)
  let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u;
  let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u);
  let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; }
  let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; }
  return vec2<u32>(lo, hi);
}
fn muls(a: i32, b: i32) -> vec2<u32> {   // signed 32x32 -> 64, two's complement
  let neg = (a < 0) != (b < 0);
  var r = mulu(u32(abs(a)), u32(abs(b)));
  if (neg) { r = neg64(r); }
  return r;
}
fn neg64(a: vec2<u32>) -> vec2<u32> { var lo = ~a.x; var hi = ~a.y; lo = lo + 1u; if (lo == 0u) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn sub64(a: vec2<u32>, b: vec2<u32>) -> vec2<u32> { var hi = a.y - b.y; if (a.x < b.x) { hi = hi - 1u; } return vec2<u32>(a.x - b.x, hi); }
fn sign64(a: vec2<u32>) -> i32 { if ((a.y & 0x80000000u) != 0u) { return -1; } if (a.x == 0u && a.y == 0u) { return 0; } return 1; }
fn cross(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { return sub64(muls(ux, vy), muls(uy, vx)); }
fn orient(ax: i32, ay: i32, bx: i32, by: i32, cx: i32, cy: i32) -> i32 { return sign64(cross(bx - ax, by - ay, cx - ax, cy - ay)); }
fn u64f(a: vec2<u32>) -> f32 { return f32(a.y) * 4294967296.0 + f32(a.x); }   // non-negative values only
// exact rounded quotient round(num * |d| / den) for 0 <= num < den (u64), |d| < 2^31: restoring division in 128-bit arithmetic
fn add128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn sub128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { return add128u(a, add128u(vec4<u32>(~b.x, ~b.y, ~b.z, ~b.w), vec4<u32>(1u, 0u, 0u, 0u))); }
fn ge128(a: vec4<u32>, b: vec4<u32>) -> bool { if (a.w != b.w) { return a.w > b.w; } if (a.z != b.z) { return a.z > b.z; } if (a.y != b.y) { return a.y > b.y; } return a.x >= b.x; }
fn shl128(a: vec4<u32>, s: u32) -> vec4<u32> { if (s == 0u) { return a; } let t = 32u - s; return vec4<u32>(a.x << s, (a.y << s) | (a.x >> t), (a.z << s) | (a.y >> t), (a.w << s) | (a.z >> t)); }
fn roundedShift(num: vec2<u32>, den: vec2<u32>, d: i32) -> i32 {
  if (d == 0) { return 0; }
  let ad = u32(abs(d)); let lo = mulu(num.x, ad); let hi = mulu(num.y, ad);
  var n = vec4<u32>(lo.x, lo.y, 0u, 0u); n = add128u(n, vec4<u32>(0u, hi.x, hi.y, 0u));
  n = shl128(n, 1u); n = add128u(n, vec4<u32>(den.x, den.y, 0u, 0u));
  let dd = shl128(vec4<u32>(den.x, den.y, 0u, 0u), 1u);
  var q = 0u; var sh = shl128(dd, 31u);
  for (var b = 31; b >= 0; b--) { if (ge128(n, sh)) { n = sub128u(n, sh); q = q | (1u << u32(b)); }
    sh = vec4<u32>((sh.x >> 1u) | (sh.y << 31u), (sh.y >> 1u) | (sh.z << 31u), (sh.z >> 1u) | (sh.w << 31u), sh.w >> 1u); }
  if (d < 0) { return -i32(q); } return i32(q);
}
struct Params { n: u32, cells: u32, cs: i32, mode: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> segs: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segInfo: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> layerInfo: array<vec4<i32>>;   // gw, gh, cellBase, 0
fn vtx(v: u32) -> vec2<i32> { return segs[v].xy; }
fn orientSoS(p: u32, q: u32, r: u32) -> i32 {   // Simulation of Simplicity: higher id dominates, x displacement before y
  let P = vtx(p); let Q = vtx(q); let R = vtx(r);
  let d = orient(P.x, P.y, Q.x, Q.y, R.x, R.y); if (d != 0) { return d; }
  var ids = array<u32, 3>(p, q, r);
  var cv = array<vec2<i32>, 3>(R - Q, P - R, Q - P);
  for (var round = 0; round < 3; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 3; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    var c = vec2<i32>(0, 0);
    for (var k = 0; k < 3; k++) { if (ids[k] == top) { c = c + cv[k]; ids[k] = 0xffffffffu; } }
    if (c.y != 0) { return -sign(c.y); }
    if (c.x != 0) { return sign(c.x); }
  }
  return 0;
}
fn cellRange(i: u32) -> vec4<i32> { let s = segs[i]; return vec4<i32>(min(s.x, s.z) / params.cs, min(s.y, s.w) / params.cs, max(s.x, s.z) / params.cs, max(s.y, s.w) / params.cs); }

@group(0) @binding(4) var<storage, read> evStart: array<u32>;
@group(0) @binding(5) var<storage, read_write> events: array<vec4<u32>>;
@group(0) @binding(6) var<storage, read> pairEdges: array<vec2<u32>>;
fn add64(a: vec2<u32>, b: vec2<u32>) -> vec3<u32> { var lo = a.x + b.x; var c = 0u; if (lo < a.x) { c = 1u; } var hi = a.y + b.y + c; var c2 = 0u; if (hi < a.y || (c == 1u && hi == a.y)) { c2 = 1u; } return vec3<u32>(lo, hi, c2); }
fn mul128(a: vec2<u32>, b: vec2<u32>) -> vec4<u32> {
  let p00 = mulu(a.x, b.x); let p01 = mulu(a.x, b.y); let p10 = mulu(a.y, b.x); let p11 = mulu(a.y, b.y);
  var r0 = p00.x;
  let s1 = add64(vec2<u32>(p00.y, 0u), vec2<u32>(p01.x, p01.y));   // limbs 1,2 (+carry into 3)
  let s2 = add64(vec2<u32>(s1.x, s1.y), vec2<u32>(p10.x, p10.y));
  let s3 = add64(vec2<u32>(s2.y, s1.z + s2.z), vec2<u32>(p11.x, p11.y));
  return vec4<u32>(r0, s2.x, s3.x, s3.y);
}
fn lt128(x: vec4<u32>, y: vec4<u32>) -> bool {
  if (x.w != y.w) { return x.w < y.w; } if (x.z != y.z) { return x.z < y.z; } if (x.y != y.y) { return x.y < y.y; } return x.x < y.x;
}
fn before(p: vec4<u32>, q: vec4<u32>) -> bool { return lt128(mul128(p.xy, q.zw), mul128(q.xy, p.zw)); }
// ---- two events at the same place on a segment: ordered as if every vertex were moved by an infinitesimal amount,
//  higher vertex ids first, x before y (the same perturbation the crossing test uses). The order is the sign of the
//  difference of the two events' parameters' derivatives, each a fraction of signed integers up to 128 bits.
struct SM { m: vec4<u32>, neg: bool }
fn isZero128(a: vec4<u32>) -> bool { return a.x == 0u && a.y == 0u && a.z == 0u && a.w == 0u; }
fn add128(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> {
  var r = vec4<u32>(0u); var carry = 0u;
  for (var k = 0; k < 4; k++) { let s1 = a[k] + b[k]; var c = 0u; if (s1 < a[k]) { c = 1u; } let s2 = s1 + carry; if (s2 < s1) { c = 1u; } r[k] = s2; carry = c; }
  return r; }
fn sub128(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> {   // a >= b
  var r = vec4<u32>(0u); var borrow = 0u;
  for (var k = 0; k < 4; k++) { let d1 = a[k] - b[k]; var c = 0u; if (a[k] < b[k]) { c = 1u; } let d2 = d1 - borrow; if (d1 < borrow) { c = 1u; } r[k] = d2; borrow = c; }
  return r; }
fn smAdd(a: SM, b: SM) -> SM {
  if (a.neg == b.neg) { return SM(add128(a.m, b.m), a.neg); }
  if (lt128(a.m, b.m)) { return SM(sub128(b.m, a.m), b.neg); }
  return SM(sub128(a.m, b.m), a.neg); }
fn smNeg(a: SM) -> SM { return SM(a.m, !a.neg); }
fn smProd(u: vec2<u32>, x: i32) -> SM { return SM(mul128(u, vec2<u32>(u32(abs(x)), 0u)), x < 0); }   // unsigned 64 x signed 32
fn mul256(a: vec4<u32>, b: vec4<u32>) -> array<u32, 8> {
  var r: array<u32, 8>;
  for (var i = 0; i < 4; i++) { var carry = 0u;
    for (var j = 0; j < 4; j++) { let p = mulu(a[i], b[j]); let s1 = r[i + j] + p.x; var c = 0u; if (s1 < p.x) { c = 1u; } let s2 = s1 + carry; if (s2 < s1) { c = c + 1u; } r[i + j] = s2; carry = p.y + c; }
    r[i + 4] = carry; }
  return r; }
// sign of num1/den1 - num2/den2, by cross-multiplying (a zero denominator gives equal, as on the CPU)
fn cmpFrac(n1in: SM, d1: SM, n2in: SM, d2: SM) -> i32 {
  var n1 = n1in; var n2 = n2in; if (d1.neg) { n1.neg = !n1.neg; } if (d2.neg) { n2.neg = !n2.neg; }
  let l = mul256(n1.m, d2.m); let r = mul256(n2.m, d1.m);
  var lz = true; var rz = true; var mag = 0;
  for (var k = 7; k >= 0; k--) { if (l[k] != 0u) { lz = false; } if (r[k] != 0u) { rz = false; } if (mag == 0 && l[k] != r[k]) { if (l[k] < r[k]) { mag = -1; } else { mag = 1; } } }
  let ln = n1.neg && !lz; let rn = n2.neg && !rz;
  if (ln != rn) { if (ln) { return -1; } return 1; }
  if (ln) { return -mag; }
  return mag; }
struct Shift { num: SM, den: SM }
// the derivative of the event's parameter along segment A when vertex v moves in x (axis 0) or y (axis 1)
fn shiftOf(A: u32, n: vec2<u32>, d: vec2<u32>, C: u32, v: u32, axis: u32) -> Shift {
  let a0 = A; let a1 = segInfo[A].z; let c0 = C; let c1 = segInfo[C].z;
  let Pa0 = vtx(a0); let Pa1 = vtx(a1); let Pc0 = vtx(c0); let Pc1 = vtx(c1);
  let dAx = Pa1.x - Pa0.x; let dAy = Pa1.y - Pa0.y; let dCx = Pc1.x - Pc0.x; let dCy = Pc1.y - Pc0.y;
  var D = cross(dAx, dAy, dCx, dCy); let Dneg = sign64(D) < 0; if (Dneg) { D = neg64(D); }
  let den = SM(mul128(D, d), Dneg);
  // cg(u) = gx * u.y - gy * u.x, for u = (w - a0) * d - n * dA, and for u = dC
  var cgC = dCy; if (axis == 1u) { cgC = -dCx; }
  var num = SM(vec4<u32>(0u), false); var touched = false;
  if (v == c0 || v == c1) {
    var w = Pc1; if (v == c1) { w = Pc0; }
    var part: SM;
    if (axis == 0u) { part = smAdd(smProd(d, w.y - Pa0.y), smNeg(smProd(n, dAy))); }
    else { part = smNeg(smAdd(smProd(d, w.x - Pa0.x), smNeg(smProd(n, dAx)))); }
    if (v == c0) { num = smAdd(num, part); }
    if (v == c1) { num = smAdd(num, smNeg(part)); }
    touched = true; }
  if (v == c0 && v == c1) { touched = true; }
  if (v == a0) { let lo = d.x - n.x; var hi = d.y - n.y; if (d.x < n.x) { hi = hi - 1u; } num = smAdd(num, smNeg(smProd(vec2<u32>(lo, hi), cgC))); touched = true; }
  if (v == a1) { num = smAdd(num, smNeg(smProd(n, cgC))); touched = true; }
  if (!touched) { return Shift(SM(vec4<u32>(0u), false), SM(vec4<u32>(1u, 0u, 0u, 0u), false)); }
  return Shift(num, den); }
fn otherEdge(A: u32, vid: u32) -> u32 { let pid = vid - params.n; if (pid >= arrayLength(&pairEdges)) { return A; } let e = pairEdges[pid]; if (e.x == A) { return e.y; } return e.x; }
// -1: p first, 1: q first, 0: the perturbation does not separate them (two segments on one line)
fn sosOrder(A: u32, p0: vec4<u32>, p1: vec4<u32>, q0: vec4<u32>, q1: vec4<u32>) -> i32 {
  let Cp = otherEdge(A, p1.w); let Cq = otherEdge(A, q1.w);
  var ids = array<u32, 6>(A, segInfo[A].z, Cp, segInfo[Cp].z, Cq, segInfo[Cq].z);
  for (var round = 0; round < 6; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 6; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    for (var k = 0; k < 6; k++) { if (ids[k] == top) { ids[k] = 0xffffffffu; } }
    for (var axis = 0u; axis < 2u; axis++) {
      let sp = shiftOf(A, p0.xy, p0.zw, Cp, top, axis); let sq = shiftOf(A, q0.xy, q0.zw, Cq, top, axis);
      let c = cmpFrac(sp.num, sp.den, sq.num, sq.den);
      if (c != 0) { return c; } } }
  return 0; }
fn beforeExact(A: u32, k0: vec4<u32>, k1: vec4<u32>, p0: vec4<u32>, p1: vec4<u32>) -> bool {
  if (before(k0, p0)) { return true; }
  if (before(p0, k0)) { return false; }
  if (params.mode == 0u) { return false; }
  return sosOrder(A, k0, k1, p0, p1) < 0; }
@compute @workgroup_size(256) fn sortEvents(@builtin(global_invocation_id) gid_raw: vec3<u32>) { let gid = vec3<u32>(gid_raw.x + gid_raw.y * 16776960u, 0u, 0u);
  let i = gid.x; if (i >= params.n) { return; }
  let r0 = evStart[i]; let r1 = evStart[i + 1u]; if (badRange(r0, r1)) { return; }
  for (var a = r0 + 1u; a < r1; a++) {
    let k0 = events[a * 2u]; let k1 = events[a * 2u + 1u]; var b = a;
    loop { if (b == r0) { break; } let p = events[(b - 1u) * 2u]; let p1 = events[(b - 1u) * 2u + 1u]; if (!beforeExact(i, k0, k1, p, p1)) { break; } events[b * 2u] = p; events[b * 2u + 1u] = p1; b = b - 1u; }
    events[b * 2u] = k0; events[b * 2u + 1u] = k1;
  }
}`,`sort`),link:await t(`
struct LP { e: u32, v: u32, pad0: u32, pad1: u32 }
@group(0) @binding(0) var<uniform> lp: LP;
@group(0) @binding(1) var<storage, read> pv: array<vec4<u32>>;          // start vid, end vid, layer
@group(0) @binding(2) var<storage, read> pc: array<vec4<i32>>;          // sx, sy, ex, ey
@group(0) @binding(3) var<storage, read_write> vcount: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read> vstart: array<u32>;
@group(0) @binding(5) var<storage, read_write> vlist: array<u32>;
@group(0) @binding(6) var<storage, read_write> succ: array<u32>;
@group(0) @binding(7) var<storage, read_write> labA: array<vec2<u32>>;   // label, next
@group(0) @binding(8) var<storage, read_write> labB: array<vec2<u32>>;
@compute @workgroup_size(256) fn vcountK(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); if (g.x >= lp.e) { return; } atomicAdd(&vcount[pv[g.x].x], 1u); }
@compute @workgroup_size(256) fn vscatter(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); if (g.x >= lp.e) { return; } let v = pv[g.x].x; let k = atomicAdd(&vcount[v], 1u); vlist[vstart[v] + k] = g.x; }
@compute @workgroup_size(256) fn successor(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u);
  let e = g.x; if (e >= lp.e) { return; }
  let v = pv[e].y; let a = vstart[v]; let b = vstart[v + 1u];
  if (b == a) { succ[e] = e; labA[e] = vec2<u32>(e, e); return; }
  var best = vlist[a];
  if (b - a > 1024u) { atomicAdd(&vcount[lp.v], 1u); succ[e] = e; labA[e] = vec2<u32>(e, e); return; }   // out-degree cap: a corrupt vstart must not spin the GPU
  if (b - a > 1u) {   // first outgoing edge clockwise from the reverse of the incoming one
    let q = pc[e]; let rin = atan2(f32(q.y - q.w), f32(q.x - q.z)); var bestAng = 10.0;
    for (var k = a; k < b; k++) { let o = vlist[k]; let r = pc[o]; var ang = rin - atan2(f32(r.w - r.y), f32(r.z - r.x));
      if (!(ang > 0.0)) { ang = ang + 6.2831853; } if (ang > 6.2831853) { ang = ang - 6.2831853; }   // a difference of two atan2 lies in [-2pi, 2pi]: one step each, no loop
      if (ang < bestAng) { bestAng = ang; best = o; } }
  }
  succ[e] = best; labA[e] = vec2<u32>(min(e, best), best);
}
@compute @workgroup_size(256) fn jumpAB(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let e = g.x; if (e >= lp.e) { return; } let s = labA[e]; let t = labA[s.y]; labB[e] = vec2<u32>(min(s.x, t.x), t.y); }
@compute @workgroup_size(256) fn jumpBA(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let e = g.x; if (e >= lp.e) { return; } let s = labB[e]; let t = labB[s.y]; labA[e] = vec2<u32>(min(s.x, t.x), t.y); }
`,`link`),scan:await t(F,`scan`),check:await t(`
@group(0) @binding(0) var<uniform> cp: vec4<u32>;   // n, cap
@group(0) @binding(1) var<storage, read> starts: array<u32>;
@group(0) @binding(2) var<storage, read_write> bad: array<atomic<u32>>;
@compute @workgroup_size(256) fn check(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let i = g.x; if (i >= cp.x) { return; }
  let lo = starts[i]; let hi = starts[i + 1u]; if (hi < lo || hi - lo > cp.y) { atomicAdd(&bad[0], 1u); } }`,`check`),glue:await t(`// a range from a corrupt scan must not spin the GPU: a dispatch keeps running after its process is killed (measured). Observed max 107 per cell, 13 per segment.
const RANGE_CAP = 4096u;
fn badRange(lo: u32, hi: u32) -> bool { return hi < lo || hi - lo > RANGE_CAP; }

fn mulu(a: u32, b: u32) -> vec2<u32> {   // unsigned 32x32 -> 64 (lo, hi)
  let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u;
  let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u);
  let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; }
  let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; }
  return vec2<u32>(lo, hi);
}
fn muls(a: i32, b: i32) -> vec2<u32> {   // signed 32x32 -> 64, two's complement
  let neg = (a < 0) != (b < 0);
  var r = mulu(u32(abs(a)), u32(abs(b)));
  if (neg) { r = neg64(r); }
  return r;
}
fn neg64(a: vec2<u32>) -> vec2<u32> { var lo = ~a.x; var hi = ~a.y; lo = lo + 1u; if (lo == 0u) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn sub64(a: vec2<u32>, b: vec2<u32>) -> vec2<u32> { var hi = a.y - b.y; if (a.x < b.x) { hi = hi - 1u; } return vec2<u32>(a.x - b.x, hi); }
fn sign64(a: vec2<u32>) -> i32 { if ((a.y & 0x80000000u) != 0u) { return -1; } if (a.x == 0u && a.y == 0u) { return 0; } return 1; }
fn cross(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { return sub64(muls(ux, vy), muls(uy, vx)); }
fn orient(ax: i32, ay: i32, bx: i32, by: i32, cx: i32, cy: i32) -> i32 { return sign64(cross(bx - ax, by - ay, cx - ax, cy - ay)); }
fn u64f(a: vec2<u32>) -> f32 { return f32(a.y) * 4294967296.0 + f32(a.x); }   // non-negative values only
// exact rounded quotient round(num * |d| / den) for 0 <= num < den (u64), |d| < 2^31: restoring division in 128-bit arithmetic
fn add128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn sub128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { return add128u(a, add128u(vec4<u32>(~b.x, ~b.y, ~b.z, ~b.w), vec4<u32>(1u, 0u, 0u, 0u))); }
fn ge128(a: vec4<u32>, b: vec4<u32>) -> bool { if (a.w != b.w) { return a.w > b.w; } if (a.z != b.z) { return a.z > b.z; } if (a.y != b.y) { return a.y > b.y; } return a.x >= b.x; }
fn shl128(a: vec4<u32>, s: u32) -> vec4<u32> { if (s == 0u) { return a; } let t = 32u - s; return vec4<u32>(a.x << s, (a.y << s) | (a.x >> t), (a.z << s) | (a.y >> t), (a.w << s) | (a.z >> t)); }
fn roundedShift(num: vec2<u32>, den: vec2<u32>, d: i32) -> i32 {
  if (d == 0) { return 0; }
  let ad = u32(abs(d)); let lo = mulu(num.x, ad); let hi = mulu(num.y, ad);
  var n = vec4<u32>(lo.x, lo.y, 0u, 0u); n = add128u(n, vec4<u32>(0u, hi.x, hi.y, 0u));
  n = shl128(n, 1u); n = add128u(n, vec4<u32>(den.x, den.y, 0u, 0u));
  let dd = shl128(vec4<u32>(den.x, den.y, 0u, 0u), 1u);
  var q = 0u; var sh = shl128(dd, 31u);
  for (var b = 31; b >= 0; b--) { if (ge128(n, sh)) { n = sub128u(n, sh); q = q | (1u << u32(b)); }
    sh = vec4<u32>((sh.x >> 1u) | (sh.y << 31u), (sh.y >> 1u) | (sh.z << 31u), (sh.z >> 1u) | (sh.w << 31u), sh.w >> 1u); }
  if (d < 0) { return -i32(q); } return i32(q);
}
struct Params { n: u32, cells: u32, cs: i32, mode: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> segs: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segInfo: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> layerInfo: array<vec4<i32>>;   // gw, gh, cellBase, 0
fn vtx(v: u32) -> vec2<i32> { return segs[v].xy; }
fn orientSoS(p: u32, q: u32, r: u32) -> i32 {   // Simulation of Simplicity: higher id dominates, x displacement before y
  let P = vtx(p); let Q = vtx(q); let R = vtx(r);
  let d = orient(P.x, P.y, Q.x, Q.y, R.x, R.y); if (d != 0) { return d; }
  var ids = array<u32, 3>(p, q, r);
  var cv = array<vec2<i32>, 3>(R - Q, P - R, Q - P);
  for (var round = 0; round < 3; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 3; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    var c = vec2<i32>(0, 0);
    for (var k = 0; k < 3; k++) { if (ids[k] == top) { c = c + cv[k]; ids[k] = 0xffffffffu; } }
    if (c.y != 0) { return -sign(c.y); }
    if (c.x != 0) { return sign(c.x); }
  }
  return 0;
}
fn cellRange(i: u32) -> vec4<i32> { let s = segs[i]; return vec4<i32>(min(s.x, s.z) / params.cs, min(s.y, s.w) / params.cs, max(s.x, s.z) / params.cs, max(s.y, s.w) / params.cs); }

struct GP { n: u32, polys: u32, fill: u32, mode: u32 }
@group(0) @binding(4) var<uniform> gp: GP;
@group(0) @binding(5) var<storage, read> evStart: array<u32>;
@group(0) @binding(6) var<storage, read> events: array<vec4<u32>>;
@group(0) @binding(7) var<storage, read> polyInfo: array<vec4<u32>>;      // first, count, layer segStart, layer segEnd
@group(0) @binding(8) var<storage, read_write> work: array<u32>;
@group(0) @binding(9) var<storage, read_write> polyW: array<i32>;
fn leQ(v: u32, a0: u32, ay: i32, dA: vec2<i32>) -> bool {
  if (v == a0) { var s = sign(dA.y); if (s == 0) { s = sign(dA.x); } return s >= 0; }
  let d = vtx(v).y - ay; if (d != 0) { return d < 0; } return v < a0; }
@compute @workgroup_size(256) fn rays(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u);
  let p = g.x; if (p >= gp.polys) { return; }
  let pi = polyInfo[p]; let a0 = pi.x; let a1 = segInfo[a0].z; let A0 = vtx(a0); let dA = vtx(a1) - A0;
  var wn = 0;
  for (var c = pi.z; c < pi.w; c++) { let c1 = segInfo[c].z;
    if (leQ(c, a0, A0.y, dA) == leQ(c1, a0, A0.y, dA)) { continue; }
    var side = 1;
    if (c != a0) {
      if (c1 == a0) { side = orientSoS(c, c1, a1); if (side == 0) { let dc = vtx(c1) - vtx(c); side = sign(dc.x * dA.x + dc.y * dA.y); } }
      else { side = orientSoS(c, c1, a0); } }
    let C0 = vtx(c); let C1 = vtx(c1);
    if (C1.y > C0.y || (C1.y == C0.y && c1 > c)) { if (side > 0) { wn = wn + 1; } } else { if (side < 0) { wn = wn - 1; } } }
  polyW[p] = wn;
}
@compute @workgroup_size(256) fn deltaSums(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u);
  let a = g.x; if (a > gp.n) { return; } if (a == gp.n) { work[a] = 0u; return; }
  if (badRange(evStart[a], evStart[a + 1u])) { return; }
  var s = 0; for (var r = evStart[a]; r < evStart[a + 1u]; r++) { s = s + bitcast<i32>(events[r * 2u + 1u].x); } work[a] = bitcast<u32>(s);
}`,`glue`),pieces:await t(`// a range from a corrupt scan must not spin the GPU: a dispatch keeps running after its process is killed (measured). Observed max 107 per cell, 13 per segment.
const RANGE_CAP = 4096u;
fn badRange(lo: u32, hi: u32) -> bool { return hi < lo || hi - lo > RANGE_CAP; }

fn mulu(a: u32, b: u32) -> vec2<u32> {   // unsigned 32x32 -> 64 (lo, hi)
  let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u;
  let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u);
  let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; }
  let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; }
  return vec2<u32>(lo, hi);
}
fn muls(a: i32, b: i32) -> vec2<u32> {   // signed 32x32 -> 64, two's complement
  let neg = (a < 0) != (b < 0);
  var r = mulu(u32(abs(a)), u32(abs(b)));
  if (neg) { r = neg64(r); }
  return r;
}
fn neg64(a: vec2<u32>) -> vec2<u32> { var lo = ~a.x; var hi = ~a.y; lo = lo + 1u; if (lo == 0u) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn sub64(a: vec2<u32>, b: vec2<u32>) -> vec2<u32> { var hi = a.y - b.y; if (a.x < b.x) { hi = hi - 1u; } return vec2<u32>(a.x - b.x, hi); }
fn sign64(a: vec2<u32>) -> i32 { if ((a.y & 0x80000000u) != 0u) { return -1; } if (a.x == 0u && a.y == 0u) { return 0; } return 1; }
fn cross(ux: i32, uy: i32, vx: i32, vy: i32) -> vec2<u32> { return sub64(muls(ux, vy), muls(uy, vx)); }
fn orient(ax: i32, ay: i32, bx: i32, by: i32, cx: i32, cy: i32) -> i32 { return sign64(cross(bx - ax, by - ay, cx - ax, cy - ay)); }
fn u64f(a: vec2<u32>) -> f32 { return f32(a.y) * 4294967296.0 + f32(a.x); }   // non-negative values only
// exact rounded quotient round(num * |d| / den) for 0 <= num < den (u64), |d| < 2^31: restoring division in 128-bit arithmetic
fn add128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn sub128u(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { return add128u(a, add128u(vec4<u32>(~b.x, ~b.y, ~b.z, ~b.w), vec4<u32>(1u, 0u, 0u, 0u))); }
fn ge128(a: vec4<u32>, b: vec4<u32>) -> bool { if (a.w != b.w) { return a.w > b.w; } if (a.z != b.z) { return a.z > b.z; } if (a.y != b.y) { return a.y > b.y; } return a.x >= b.x; }
fn shl128(a: vec4<u32>, s: u32) -> vec4<u32> { if (s == 0u) { return a; } let t = 32u - s; return vec4<u32>(a.x << s, (a.y << s) | (a.x >> t), (a.z << s) | (a.y >> t), (a.w << s) | (a.z >> t)); }
fn roundedShift(num: vec2<u32>, den: vec2<u32>, d: i32) -> i32 {
  if (d == 0) { return 0; }
  let ad = u32(abs(d)); let lo = mulu(num.x, ad); let hi = mulu(num.y, ad);
  var n = vec4<u32>(lo.x, lo.y, 0u, 0u); n = add128u(n, vec4<u32>(0u, hi.x, hi.y, 0u));
  n = shl128(n, 1u); n = add128u(n, vec4<u32>(den.x, den.y, 0u, 0u));
  let dd = shl128(vec4<u32>(den.x, den.y, 0u, 0u), 1u);
  var q = 0u; var sh = shl128(dd, 31u);
  for (var b = 31; b >= 0; b--) { if (ge128(n, sh)) { n = sub128u(n, sh); q = q | (1u << u32(b)); }
    sh = vec4<u32>((sh.x >> 1u) | (sh.y << 31u), (sh.y >> 1u) | (sh.z << 31u), (sh.z >> 1u) | (sh.w << 31u), sh.w >> 1u); }
  if (d < 0) { return -i32(q); } return i32(q);
}
struct Params { n: u32, cells: u32, cs: i32, mode: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> segs: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> segInfo: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> layerInfo: array<vec4<i32>>;   // gw, gh, cellBase, 0
fn vtx(v: u32) -> vec2<i32> { return segs[v].xy; }
fn orientSoS(p: u32, q: u32, r: u32) -> i32 {   // Simulation of Simplicity: higher id dominates, x displacement before y
  let P = vtx(p); let Q = vtx(q); let R = vtx(r);
  let d = orient(P.x, P.y, Q.x, Q.y, R.x, R.y); if (d != 0) { return d; }
  var ids = array<u32, 3>(p, q, r);
  var cv = array<vec2<i32>, 3>(R - Q, P - R, Q - P);
  for (var round = 0; round < 3; round++) {
    var top = 0u; var found = false;
    for (var k = 0; k < 3; k++) { if (ids[k] != 0xffffffffu && (!found || ids[k] > top)) { top = ids[k]; found = true; } }
    if (!found) { break; }
    var c = vec2<i32>(0, 0);
    for (var k = 0; k < 3; k++) { if (ids[k] == top) { c = c + cv[k]; ids[k] = 0xffffffffu; } }
    if (c.y != 0) { return -sign(c.y); }
    if (c.x != 0) { return sign(c.x); }
  }
  return 0;
}
fn cellRange(i: u32) -> vec4<i32> { let s = segs[i]; return vec4<i32>(min(s.x, s.z) / params.cs, min(s.y, s.w) / params.cs, max(s.x, s.z) / params.cs, max(s.y, s.w) / params.cs); }

struct GP { n: u32, polys: u32, fill: u32, mode: u32 }
@group(0) @binding(4) var<uniform> gp: GP;
@group(0) @binding(5) var<storage, read> evStart: array<u32>;
@group(0) @binding(6) var<storage, read> events: array<vec4<u32>>;
@group(0) @binding(7) var<storage, read> leftW: array<vec2<u32>>;       // per segment: (scanned delta sum, polygon index)
@group(0) @binding(8) var<storage, read> polyInfoW: array<vec4<i32>>;   // first, count, start winding, 0
@group(0) @binding(9) var<storage, read_write> pieceCount: array<u32>;
@group(0) @binding(10) var<storage, read_write> pv: array<vec4<u32>>;   // start vid, end vid, layer
@group(0) @binding(11) var<storage, read_write> pcd: array<vec4<i32>>;   // two entries per piece: coordinates, parent direction
fn insideOf(w: i32) -> bool { if (gp.fill == 3u) { return (w & 1) != 0; } if (gp.fill == 2u) { return w < 0; } if (gp.fill == 1u) { return w > 0; } return w != 0; }
@compute @workgroup_size(256) fn pieces(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u);
  let a = g.x; if (a >= gp.n) { return; }
  let lw = leftW[a]; let pw = polyInfoW[lw.y]; let firstScan = leftW[u32(pw.x)].x;
  var wl = pw.z + bitcast<i32>(lw.x - firstScan);
  let S = segs[a]; var x = S.x; var y = S.y; var vid = a; let nxt = segInfo[a].z; let dir = vec2<i32>(S.z - S.x, S.w - S.y); let layer = segInfo[a].x;
  var k = 0u; let base = pieceCount[a]; let r0 = evStart[a]; let r1 = evStart[a + 1u]; if (badRange(r0, r1)) { return; }
  for (var r = r0; r <= r1; r++) {
    var nx = S.z; var ny = S.w; var nv = nxt; var d = 0;
    if (r < r1) { let e = events[r * 2u + 1u]; d = bitcast<i32>(e.x); nx = bitcast<i32>(e.y); ny = bitcast<i32>(e.z); nv = e.w; }
    let il = insideOf(wl); let ir = insideOf(wl - 1);
    if (il != ir) {
      if (gp.mode == 1u) { let o = base + k;
        if (il) { pv[o] = vec4<u32>(vid, nv, layer, 0u); pcd[o * 2u] = vec4<i32>(x, y, nx, ny); pcd[o * 2u + 1u] = vec4<i32>(0, 0, dir.x, dir.y); }
        else { pv[o] = vec4<u32>(nv, vid, layer, 0u); pcd[o * 2u] = vec4<i32>(nx, ny, x, y); pcd[o * 2u + 1u] = vec4<i32>(0, 0, -dir.x, -dir.y); } }
      k = k + 1u; }
    x = nx; y = ny; vid = nv; wl = wl + d; }
  if (gp.mode == 0u) { pieceCount[a] = k; }
}`,`pieces`),ties:await t(`
@group(0) @binding(0) var<uniform> tp: vec4<u32>;
@group(0) @binding(1) var<storage, read> evStart: array<u32>;
@group(0) @binding(2) var<storage, read> events: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read_write> tieList: array<atomic<u32>>;
fn mulu(a: u32, b: u32) -> vec2<u32> { let al = a & 0xffffu; let ah = a >> 16u; let bl = b & 0xffffu; let bh = b >> 16u; let ll = al * bl; let lh = al * bh; let hl = ah * bl; let hh = ah * bh;
  var lo = ll; var hi = hh + (lh >> 16u) + (hl >> 16u); let t1 = lh << 16u; lo = lo + t1; if (lo < t1) { hi = hi + 1u; } let t2 = hl << 16u; lo = lo + t2; if (lo < t2) { hi = hi + 1u; } return vec2<u32>(lo, hi); }
fn add128(a: vec4<u32>, b: vec4<u32>) -> vec4<u32> { var r: vec4<u32>; r.x = a.x + b.x; var c = select(0u, 1u, r.x < a.x);
  let y = a.y + b.y; var c1 = select(0u, 1u, y < a.y); r.y = y + c; if (r.y < y) { c1 = 1u; } c = c1;
  let z = a.z + b.z; var c2 = select(0u, 1u, z < a.z); r.z = z + c; if (r.z < z) { c2 = 1u; } c = c2; r.w = a.w + b.w + c; return r; }
fn mul128(a: vec2<u32>, b: vec2<u32>) -> vec4<u32> { let p00 = mulu(a.x, b.x); let p01 = mulu(a.x, b.y); let p10 = mulu(a.y, b.x); let p11 = mulu(a.y, b.y);
  var r = vec4<u32>(p00.x, p00.y, p11.x, p11.y); r = add128(r, vec4<u32>(0u, p01.x, p01.y, 0u)); r = add128(r, vec4<u32>(0u, p10.x, p10.y, 0u)); return r; }
@compute @workgroup_size(256) fn ties(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u);
  let a = g.x; if (a >= tp.x) { return; } if (evStart[a + 1u] < evStart[a] || evStart[a + 1u] - evStart[a] > 4096u) { return; }   // RANGE_CAP (this shader has no prelude)
  for (var r = evStart[a] + 1u; r < evStart[a + 1u]; r++) { let p = events[(r - 1u) * 2u]; let q = events[r * 2u];
    if (all(mul128(p.xy, q.zw) == mul128(q.xy, p.zw))) { let k = atomicAdd(&tieList[0], 1u); atomicStore(&tieList[1u + k], a); return; } }
}`,`ties`),zip:await t(`
@group(0) @binding(0) var<uniform> zp: vec4<u32>;
@group(0) @binding(1) var<storage, read> a: array<u32>;
@group(0) @binding(2) var<storage, read> b: array<u32>;
@group(0) @binding(3) var<storage, read_write> o: array<vec2<u32>>;
@compute @workgroup_size(256) fn zip(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); if (g.x < zp.x) { o[g.x] = vec2<u32>(a[g.x], b[g.x]); } }`,`zip`),directions:await t(`
@group(0) @binding(0) var<uniform> dp: vec4<u32>;
@group(0) @binding(1) var<storage, read> pcd: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read_write> dirOut: array<vec4<i32>>;
@compute @workgroup_size(256) fn dirs(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); if (g.x < dp.x) { dirOut[g.x] = pcd[g.x * 2u + 1u]; } }`,`directions`),compact:await t(`
@group(0) @binding(0) var<uniform> dp: vec4<u32>;
@group(0) @binding(1) var<storage, read> pcd: array<vec4<i32>>;
@group(0) @binding(2) var<storage, read> succIn: array<u32>;
@group(0) @binding(3) var<storage, read> pvIn: array<vec4<u32>>;
@group(0) @binding(4) var<storage, read_write> compactOut: array<vec4<i32>>;
@compute @workgroup_size(256) fn compact(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = g_raw.x + g_raw.y * 16776960u; if (g < dp.x) { let c = pcd[g * 2u]; compactOut[g] = vec4<i32>(c.x, c.y, bitcast<i32>(succIn[g]), bitcast<i32>(pvIn[g].z)); } }`,`compact`),gate:await t(`
@group(0) @binding(0) var<uniform> gu: vec4<u32>;   // x: index into src, y: use src (1) or the constant z
@group(0) @binding(1) var<storage, read> bad: array<u32>;
@group(0) @binding(2) var<storage, read> src: array<u32>;
@group(0) @binding(3) var<storage, read_write> dst: array<u32>;
// a count for a later kernel's uniform, zero once any range check has failed: every later loop is bounded by that count
@compute @workgroup_size(1) fn gate() { var v = gu.z; if (gu.y == 1u) { v = src[gu.x]; } if (bad[0] != 0u) { v = 0u; } dst[0] = v; }`,`gate`),args:await t(`
@group(0) @binding(0) var<uniform> au: vec4<u32>;   // x: workgroup size
@group(0) @binding(1) var<storage, read> cnt: array<u32>;
@group(0) @binding(2) var<storage, read_write> args: array<u32>;
@compute @workgroup_size(1) fn argsK() { let groups = max(1u, (cnt[0] + au.x - 1u) / au.x); args[0] = min(groups, 65535u); args[1] = (groups + 65534u) / 65535u; args[2] = 1u; }`,`args`),polygonWinding:await t(`
@group(0) @binding(0) var<uniform> pu: vec4<u32>;
@group(0) @binding(1) var<storage, read> polyInfo: array<vec4<u32>>;
@group(0) @binding(2) var<storage, read> polyW: array<i32>;
@group(0) @binding(3) var<storage, read_write> polyInfoW: array<vec4<i32>>;
@compute @workgroup_size(256) fn polyWK(@builtin(global_invocation_id) g_raw: vec3<u32>) { let g = vec3<u32>(g_raw.x + g_raw.y * 16776960u, 0u, 0u); let p = g.x; if (p >= pu.x) { return; } let q = polyInfo[p]; polyInfoW[p] = vec4<i32>(i32(q.x), i32(q.y), polyW[p], 0); }`,`polygon winding`)},s={expand:i(o.expand,a.expand,`expand`),cellCount:i(o.bin,a.bin,`count`),cellScatter:i(o.bin,a.bin,`scatter`),intersect:i(o.intersect,a.intersect,`intersect`),sortEvents:i(o.sort,a.sort,`sortEvents`),vertexCount:i(o.link,a.link,`vcountK`),vertexScatter:i(o.link,a.link,`vscatter`),successor:i(o.link,a.link,`successor`),scanBlock:i(o.scan,a.scan,`scanBlock`),scanAddOffsets:i(o.scan,a.scan,`addOff`),checkRanges:i(o.check,a.check,`check`),rays:i(o.glue,a.glue,`rays`),deltaSums:i(o.glue,a.glue,`deltaSums`),pieces:i(o.pieces,a.pieces,`pieces`),ties:i(o.ties,a.ties,`ties`),zip:i(o.zip,a.zip,`zip`),directions:i(o.directions,a.directions,`dirs`),compact:i(o.compact,a.compact,`compact`),gate:i(o.gate,a.gate,`gate`),dispatchArguments:i(o.args,a.args,`argsK`),polygonWinding:i(o.polygonWinding,a.polygonWinding,`polyWK`)},c=/* @__PURE__ */ new Map,l=[],u=[],d=null,f=t=>{let n=e.createBuffer({size:16,usage:t});return u.push(n),n},p=(t,n)=>{let r=Math.max(65536,2**Math.ceil(Math.log2(Math.max(16,t)))),i=`${r}:${n}`,a=c.get(i)?.pop();return a||=e.createBuffer({size:r,usage:n|V.COPY_DST}),l.push([i,a]),a},m=()=>{for(let[e,t]of l)c.has(e)||c.set(e,[]),c.get(e).push(t);for(let e of u)e.destroy?.();l=[],u=[]},h=()=>(d||=e.createCommandEncoder(),d),g=(t,n)=>{let r=e.createBindGroup({layout:t,entries:n.map((e,t)=>({binding:t,resource:{buffer:e}}))});return u.push(r),r},_=(e,t,n,r)=>{let i=Math.ceil(r/256),a=1;i>H&&(a=Math.ceil(i/H),i=H);let o=h().beginComputePass();o.setPipeline(e),o.setBindGroup(0,g(t,n)),o.dispatchWorkgroups(i,a),o.end()},v=(e,t,n,r)=>{let i=h().beginComputePass();i.setPipeline(e),i.setBindGroup(0,g(t,n)),i.dispatchWorkgroupsIndirect(r,0),i.end()},y=e=>h().clearBuffer(e),b=(e,t,n,r,i)=>h().copyBufferToBuffer(e,t,n,r,i),x=t=>{let n=f(V.UNIFORM|V.COPY_DST);return e.queue.writeBuffer(n,0,new Uint32Array(t)),n},S=(e,t)=>{let n=Math.ceil(t/256),r=x([t,0,0,0]),i=p(n*4+4,V.STORAGE);_(s.scanBlock,a.scan,[r,e,i],t),n!==1&&(S(i,n),_(s.scanAddOffsets,a.scan,[r,e,i],t))},C=(e,t,n,r)=>_(s.checkRanges,a.check,[x([t,n,0,0]),e,r],t),w=(e,t,n,r,i,o=0)=>{let c=p(16,V.STORAGE|V.COPY_SRC),l=1,u=t;return t||(l=0,u=p(16,V.STORAGE)),_(s.gate,a.gate,[x([n,l,o,0]),e,u,c],1),b(c,0,r,i*4,4),c},T=e=>{let t=p(16,V.STORAGE|V.INDIRECT);return _(s.dispatchArguments,a.args,[x([256,0,0,0]),e,t],1),t},E=async()=>{d&&=(e.queue.submit([d.finish()]),null),await e.queue.onSubmittedWorkDone()},D=async(t,n,r)=>{let i=Math.max(4,n*4),a=e.createBuffer({size:Math.ceil(i/16)*16,usage:V.MAP_READ|V.COPY_DST}),o=e.createCommandEncoder();o.copyBufferToBuffer(t,0,a,0,Math.ceil(i/4)*4),e.queue.submit([o.finish()]),await a.mapAsync(1);let s=r(new Uint32Array(a.getMappedRange(),0,n));return a.unmap(),a.destroy(),s},O=async(t,n,r)=>{let i=t.segmentCount,o=t.cellCount,c=t.polygonCount,l=t.layerCount,u=Math.max(1,t.cellEntryCount),d=Math.max(65536,i*n),f=Math.ceil(d/2),h=i+d,g=i+f,O=2**Math.ceil(Math.log2(Math.max(h*32,d*32)));if(O>e.limits.maxStorageBufferBindingSize||O>e.limits.maxBufferSize)return{ok:!1,reason:`a ${O} byte buffer is over this device's limit`,overflow:!1};let ee=performance.now(),k=x([i,o,oe,0]),A=x([i,o,oe,1]),te=p(i*8,V.STORAGE),j=p(c*4,V.STORAGE),M=p(l*16,V.STORAGE),ne=p(c*16,V.STORAGE),re=(t,n,r)=>{n.gpuBuffer?b(n.gpuBuffer,n.offset??0,t,0,r*4):e.queue.writeBuffer(t,0,n,0,r)};re(te,t.points,i*2),re(j,t.polyLayer,c),re(M,t.layerInfo,l*4),re(ne,t.polyInfo,c*4);let N=p(i*16,V.STORAGE),P=p(i*16,V.STORAGE),F=p(i*4,V.STORAGE),I=[0,1,2,3,4].map(()=>p(16,V.STORAGE)),L=p(16,V.STORAGE|V.COPY_SRC);y(L),_(s.expand,a.expand,[x([i,c,0,0]),te,ne,j,N,P,F],i);let R=p((o+1)*4,V.STORAGE|V.COPY_SRC);y(R),_(s.cellCount,a.bin,[k,N,P,M,R,I[0],I[1]],i),S(R,o+1),C(R,o,se,L),w(L,null,0,A,1,o),w(L,null,0,k,1,o);let ie=p((o+1)*4,V.STORAGE),ae=p(u*8,V.STORAGE);y(ie),_(s.cellScatter,a.bin,[k,N,P,M,ie,R,ae],i);let z=p((i+1)*4,V.STORAGE|V.COPY_SRC),B=p(16,V.STORAGE),H=p(16,V.STORAGE|V.COPY_SRC);y(H),y(B),y(z),_(s.intersect,a.intersect,[k,N,P,M,R,ae,z,I[0],I[2],B,I[1]],u),S(z,i+1),C(z,i,se,L);let ce=x([i,c,0,0]),U=x([i,c,0,1]),le=x([i,0,0,0]);for(let e of[A,ce,U,le])w(L,null,0,e,0,i);let ue=p((i+1)*4,V.STORAGE);y(ue);let W=p(d*32,V.STORAGE),de=p(f*8,V.STORAGE);_(s.intersect,a.intersect,[A,N,P,M,R,ae,ue,W,z,H,de],u),_(s.sortEvents,a.sort,[A,N,P,M,z,W,de],i);let G=p(262148,V.STORAGE|V.COPY_SRC);y(G),_(s.ties,a.ties,[le,z,W,G],i);let K=p((i+1)*4,V.STORAGE),fe=p(c*4,V.STORAGE),pe=[A,N,P,M,ce,z,W,ne,K,fe];_(s.rays,a.glue,pe,c),_(s.deltaSums,a.glue,pe,i+1),S(K,i+1);let q=p(c*16,V.STORAGE);_(s.polygonWinding,a.polygonWinding,[x([c,0,0,0]),ne,fe,q],c);let me=p(i*8,V.STORAGE);_(s.zip,a.zip,[x([i,0,0,0]),K,F,me],i);let J=p((i+1)*4,V.STORAGE|V.COPY_SRC);y(J);let he=[A,N,P,M];_(s.pieces,a.pieces,[...he,ce,z,W,me,q,J,I[3],I[4]],i),S(J,i+1);let Y=p(h*16,V.STORAGE),ge=p(h*32,V.STORAGE);_(s.pieces,a.pieces,[...he,U,z,W,me,q,J,Y,ge],i);let X=p(16,V.STORAGE|V.COPY_SRC);b(J,i*4,X,0,4);let Z=x([0,0,0,0]);b(X,0,Z,0,4);let _e=T(X),Q=p(h*16,V.STORAGE);v(s.directions,a.directions,[Z,ge,Q],_e);let $=x([0,g,0,0]);b(X,0,$,0,4);let ve=p((g+1)*4,V.STORAGE),ye=p((g+1)*4,V.STORAGE|V.COPY_SRC),be=p(h*4,V.STORAGE),xe=p(h*4,V.STORAGE),Se=p(h*8,V.STORAGE),Ce=p(h*8,V.STORAGE);y(ye),y(ve),v(s.vertexCount,a.link,[$,Y,Q,ve,I[2],be,xe,Se,Ce],_e),S(ve,g+1),C(ve,g,1024,L);let we=w(L,X,0,$,0),Te=T(we),Ee=[$,Y,Q,ye,ve,be,xe,Se,Ce];v(s.vertexScatter,a.link,Ee,Te),v(s.successor,a.link,Ee,Te);let De=p(h*16,V.STORAGE|V.COPY_SRC);v(s.compact,a.compact,[Z,ge,xe,Y,De],_e);let Oe=p(32,V.STORAGE|V.COPY_SRC);b(X,0,Oe,0,4),b(z,i*4,Oe,4,4),b(H,0,Oe,8,4),b(G,0,Oe,12,4),b(L,0,Oe,16,4),b(ye,g*4,Oe,20,4),await E();let[ke,Ae,je,Me,Ne,Pe]=await D(Oe,6,e=>Array.from(e)),Fe={pieceCount:ke,eventCount:Ae,pairCount:je,tiedSegments:Me,eventsPerSegment:n};if(Ae>d||je>f)return m(),{ok:!1,overflow:!0,reason:`${Ae} crossings over the ${d} the buffers held`,...Fe};if(Ne>0||Pe>0||ke>h)return m(),{ok:!1,overflow:!1,reason:`the pipeline stopped itself: ${Ne} ranges out of bounds, ${Pe} vertices over the degree limit`,...Fe};let Ie=r(ke);return await D(De,ke*4,e=>Ie.set(new Int32Array(e.buffer,e.byteOffset,e.length))),m(),{ok:!0,ms:performance.now()-ee,...Fe}},ee=async(e,t)=>{if(e.segmentCount===0||e.polygonCount===0)return t(0),{ok:!0,ms:0,pieceCount:0,eventCount:0,pairCount:0,tiedSegments:0};let n=null;for(let r of ce)if(n=await O(e,r,t),n.ok||!n.overflow)return n;return n},k=await B(e);return{union:ee,front:k,dispose:()=>{m();for(let e of c.values())for(let t of e)t.destroy();c.clear(),k.dispose()}}}const W=e=>typeof e?.contour_phase_mode==`function`,de=e=>typeof e?.contour_mesh==`function`;async function G(e){return e.meshRoute!==!1&&e.contourGpu.front&&de(e.kernel)?me(e):J(e)}const K=({kernel:e,stl:t,paramsText:n,onProgress:r},i)=>{e.contour_phase_mode(0);let a=e.slice(t,n,r);return a?.stats&&(a.stats.contour_engine=`cpu`,a.stats.contour_engine_reason=i),a},fe=({kernel:e,paramsText:t},n)=>(e.contour_phase_mode(0),n?.stats&&(n.stats.contour_engine=`cpu`,n.stats.contour_engine_reason=`this slice has its own contour path`,Number(JSON.parse(t).reuse_stages)>=2&&(n.stats.contour_engine=`reused`,delete n.stats.contour_engine_reason)),n),pe=({kernel:e,stl:t,paramsText:n,onProgress:r},i)=>{e.contour_phase_mode(i);try{return e.slice(t,n,r)}catch(t){throw e.contour_phase_mode(0),t}},q=({kernel:e,stl:t,paramsText:n,onProgress:r},i)=>{let a;try{a=e.slice(t,n,r)}finally{e.contour_phase_mode(0)}return a?.stats&&Object.assign(a.stats,{contour_engine:`gpu`},i),a};async function me(e){let{kernel:t,contourGpu:n,canceled:r=()=>!1}=e,i=performance.now(),a=pe(e,3);if(!a?.captured)return fe(e,a);let o=performance.now()-i,s=performance.now(),c;try{let e=t.contour_mesh();c=await n.front.cut(e.tris,e.planes)}catch(e){c={failure:String(e?.message??e)}}if(r())return t.contour_phase_mode(0),{error:`canceled`};if(c.failure)return K(e,c.failure);t.contour_origin_buffer(c.input.layerCount).set(c.origins),t.contour_open_layers().set(c.openLayers);let l;try{l=await n.union(c.input,e=>t.contour_result_buffer(e))}catch(e){l={ok:!1,reason:String(e?.message??e)}}if(r())return t.contour_phase_mode(0),{error:`canceled`};if(!l.ok)return K(e,l.reason);let u=t.contour_assemble();if(u.unavailable)return K(e,`a layer the GPU left open has no mesh to be rebuilt from`);let d=performance.now()-s,f=0;for(let e of c.openLayers)f+=e;return q(e,{contour_front:`gpu`,contour_capture_ms:o,contour_front_ms:c.ms,contour_gpu_ms:d,contour_fallback_layers:u.fallbackLayers,contour_open_layers:f,contour_pieces:l.pieceCount,contour_crossings:l.eventCount})}async function J(e){let{kernel:t,contourGpu:n,canceled:r=()=>!1}=e,i=performance.now(),a=pe(e,1);if(!a?.captured)return fe(e,a);let o=performance.now()-i,s=performance.now(),c;try{c=await n.union(t.contour_gpu_input(),e=>t.contour_result_buffer(e))}catch(e){c={ok:!1,reason:String(e?.message??e)}}if(r())return t.contour_phase_mode(0),{error:`canceled`};if(!c.ok)return K(e,c.reason);let l=t.contour_assemble(),u=performance.now()-s;return q(e,{contour_front:`cpu`,contour_capture_ms:o,contour_gpu_ms:u,contour_fallback_layers:l.fallbackLayers,contour_pieces:c.pieceCount,contour_crossings:c.eventCount})}const he=/* @__PURE__ */ new Set([`smart`,`bucket`,`triangle`]),Y=e=>typeof e==`string`?e:JSON.stringify(e??{});let ge=!1;const X=(e,...t)=>{ge||console[e](...t)};let Z=null;const _e=async()=>{if(typeof crossOriginIsolated<`u`&&crossOriginIsolated)try{let e=await(await import(`./slicer_core.mt-B_C5pOLQ.js`)).default();return X(`info`,`[slicer.worker] core: mt (threads)`),Z=`mt`,e}catch(e){X(`warn`,`[slicer.worker] mt load failed — falling back to st:`,e)}let e=await(await import(`./slicer_core-aOc0CWYo.js`)).default();return X(`info`,`[slicer.worker] core: st`),Z=`st`,e};let Q=null,$=null;const ve=async()=>{if($!==null)return $;try{let e=await le(self.navigator?.gpu);if(!e)return $=!1,$;$=await ue(e),e.lost.then(()=>{$=null})}catch(e){X(`warn`,`[slicer.worker] contour GPU unavailable:`,e),$=!1}return $},ye=async(e,t,n)=>{let r=new Uint8Array(t.stl),i=Y(t.params);if(!t.gpu)return e.slice(r,i,n);let a=t=>{let a=e.slice(r,i,n);return a?.stats&&(a.stats.contour_engine=`cpu`,a.stats.contour_engine_reason=t),a};if(!W(e))return a(`this kernel build has no contour phase`);let o=await ve();return o?G({kernel:e,contourGpu:o,stl:r,paramsText:i,onProgress:n,canceled:()=>{let t=e.cancel_flag_view?.();return!!t&&t[0]!==0},meshRoute:Z===`st`}):a(`no WebGPU device`)},be=e=>Number.isInteger(e)&&e>=1&&e<=16,xe=/* @__PURE__ */ new Float32Array,Se=e=>{for(let t of e)if(!be(t))throw Error(`paint state must be an integer 1..16 (got ${JSON.stringify(t)})`);return e},Ce=(e,t)=>Array.isArray(e.states)?Se(e.states):t===null?null:[t],we=e=>e.state===void 0||e.state===null?null:(Se([e.state]),e.state),Te=e=>+(e.cursor===`circle`),Ee=e=>Number.isFinite(e.px)&&Number.isFinite(e.py)&&Number.isFinite(e.pz),De={smart:0,bucket:1,triangle:2},Oe=e=>Number.isFinite(e.angle)?e.angle:30,ke=(e,t,n)=>{let r=Oe(t);if(t.tool===`smart`){n===null?e.selector_seed_fill_erase(t.facet,t.hx,t.hy,t.hz,r):e.selector_seed_fill(t.facet,t.hx,t.hy,t.hz,r,n);return}let i=t.tool===`bucket`,a=-1;i&&(a=r),n===null?e.selector_bucket_fill_erase(t.facet,t.hx,t.hy,t.hz,a,i):e.selector_bucket_fill(t.facet,t.hx,t.hy,t.hz,a,i,n)},Ae=(e,t,n)=>{let r={type:`painted`,enf:e.selector_painted_count(!0),blk:e.selector_painted_count(!1)},i=Ce(t,n);return i&&(r.counts=Object.fromEntries(i.map(t=>[t,e.selector_painted_count_state(t)]))),r};let je=Promise.resolve();self.onmessage=e=>(je=je.then(()=>Me(e)).catch(e=>X(`warn`,`[slicer.worker] message failed:`,e)),je);const Me=async e=>{let t=e.data,n=(e,n)=>{t?.requestId===void 0?self.postMessage(e,n):self.postMessage({...e,requestId:t.requestId},n)};t.quiet!==void 0&&(ge=!!t.quiet);try{if(t.cmd===`exportPaint`&&!Q){n({type:`paintExport`,supported:!1,facets:[],hex:``});return}if(t.cmd===`slaJob`){let e=_(t.job);Q||=_e();let r=await Q,i=(e,t)=>n({type:`progress`,done:e,total:t});if(r.slice_sla_job){r.set_layer_sink((e,t,r,i,a)=>{let o=[];i?.buffer&&o.push(i.buffer),a?.buffer&&o.push(a.buffer),n({type:`layer`,z:e,idx:t,gcode:``,paths:i,widths:a},o)});let t,a=performance.now();try{t=r.slice_sla_job(e,i)}finally{r.clear_layer_sink()}if(t?.error){n({type:`error`,error:String(t.error)});return}n({type:`done`,result:w(t,performance.now()-a)});return}n({type:`error`,code:`SLA_UNSUPPORTED_OBJECT_AWARE`,error:`Object-aware SLA slicing requires WASM kernel support`});return}if(t.cmd===`sla`){let e=Y(t.params);Q||=_e();let r=await Q,i=(e,t)=>n({type:`progress`,done:e,total:t});if(r.slice_sla){r.set_layer_sink((e,t,r,i,a)=>{let o=[];i&&i.buffer&&o.push(i.buffer),a&&a.buffer&&o.push(a.buffer),n({type:`layer`,z:e,idx:t,gcode:``,paths:i,widths:a},o)});let a,o=performance.now();try{a=r.slice_sla(new Uint8Array(t.stl),e,i)}finally{r.clear_layer_sink()}if(a&&a.error){n({type:`error`,error:String(a.error)});return}n({type:`done`,result:w(a,performance.now()-o)});return}let{sliceSla:a}=await import(`./sla_core-DV6s80Fq.js`),o=JSON.parse(e);v(o);let s=performance.now(),c=a(new Uint8Array(t.stl),o,{onProgress:i,onLayer:e=>{let t=[];e.paths?.buffer&&t.push(e.paths.buffer),e.widths?.buffer&&t.push(e.widths.buffer),n({type:`layer`,z:e.z,idx:e.idx,gcode:``,paths:e.paths,widths:e.widths},t)}});if(c&&c.error){n({type:`error`,error:String(c.error)});return}n({type:`done`,result:w(c,performance.now()-s)});return}Q||=_e();let e=await Q;if(t.cmd===`warmup`){n({type:`warm`,kernel:Z});return}if(t.cmd===`prepare`){let r=!1;t.keepPaint?r=e.selector_reprepare(new Uint8Array(t.stl)):e.selector_prepare(new Uint8Array(t.stl)),n({type:`prepared`,facets:e.selector_facet_count(),kept:r});return}if(t.cmd===`paint`){let r=we(t);if(he.has(t.tool)){if(r===null)throw Error(`a '${t.tool}' fill needs an explicit integer state`);ke(e,t,r)}else r===null?e.selector_paint(t.facet,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius,t.enforcer):Ee(t)&&e.selector_paint_stroke?e.selector_paint_stroke(t.facet,t.px,t.py,t.pz,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius,r,Te(t)):e.selector_paint_shape(t.facet,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius,r,Te(t));n(Ae(e,t,r));return}if(t.cmd===`erase`){he.has(t.tool)?ke(e,t,null):Ee(t)&&e.selector_erase_stroke?e.selector_erase_stroke(t.facet,t.px,t.py,t.pz,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius,Te(t)):e.selector_erase_shape?e.selector_erase_shape(t.facet,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius,Te(t)):e.selector_erase(t.facet,t.hx,t.hy,t.hz,t.cx,t.cy,t.cz,t.radius),n(Ae(e,t,null));return}if(t.cmd===`importPaint`){let r=0;e.selector_import_paint&&(r=e.selector_import_paint(t.facets,t.hex??``));let i=Ae(e,t,null);i.applied=r,n(i);return}if(t.cmd===`meshBoolean`){if(!e.mesh_boolean){n({type:`meshBoolean`,error:`MESH_BOOLEAN_UNAVAILABLE: this kernel has no mesh boolean`});return}let r=e.mesh_boolean(t.first,t.second,t.operation);n({type:`meshBoolean`,error:r.error,positions:r.positions});return}if(t.cmd===`exportPaint`){let t=null;e.selector_export_paint&&(t=e.selector_export_paint()),n({type:`paintExport`,supported:!!e.selector_export_paint,facets:t?.facets??[],hex:t?.hex??``});return}if(t.cmd===`clear`){e.selector_clear();let r={type:`painted`,enf:0,blk:0},i=Ce(t,null);i&&(r.counts=Object.fromEntries(i.map(e=>[e,0]))),n(r);return}if(t.cmd===`overlay`){let r=Ce(t,null),i=r&&!r.includes(1)&&!r.includes(2),a={type:`overlay`,enf:xe,blk:xe};i||(a.enf=e.selector_overlay(!0),a.blk=e.selector_overlay(!1)),r&&(a.overlays=Object.fromEntries(r.map(t=>[t,e.selector_overlay_state(t)]))),n(a,[a.enf,a.blk,...Object.values(a.overlays??{})].filter(e=>e?.buffer&&e.byteLength>0).map(e=>e.buffer));return}if(t.cmd===`fillPreview`){if(!e.selector_fill_preview){n({type:`fillPreview`,supported:!1,tris:xe});return}if(t.clear){e.selector_fill_preview_clear(),n({type:`fillPreview`,supported:!0,tris:xe});return}let r=De[t.tool]??De.smart,i=Oe(t);r===De.triangle&&(i=-1);let a=e.selector_fill_preview(t.facet,t.hx,t.hy,t.hz,i,r),o=[];a?.buffer&&a.byteLength>0&&o.push(a.buffer),n({type:`fillPreview`,supported:!0,tris:a},o);return}if(t.cmd===`paintMode`){if(Number.isFinite(t.overhangDeg)&&e.selector_set_overhang_limit&&e.selector_set_overhang_limit(t.overhangDeg),e.selector_set_clip_plane){let n=t.clipPlane;n?e.selector_set_clip_plane(n[0],n[1],n[2],n[3],!0):t.clipPlane===null&&e.selector_set_clip_plane(0,0,1,0,!1)}n({type:`paintMode`,ok:!0});return}if(t.stall)return;if(!self.__supSabSent){self.__supSabSent=!0;try{let t=e.sup_progress_view&&e.sup_progress_view(),r=e.cancel_flag_view&&e.cancel_flag_view();t&&t.buffer instanceof SharedArrayBuffer&&n({type:`supsab`,buf:t.buffer,ptr:t.byteOffset,cancelPtr:r?.byteOffset??0})}catch{}}let r=(e,t)=>n({type:`progress`,done:e,total:t});e.set_layer_sink((e,t,r,i,a)=>{let o=[];i&&i.buffer&&o.push(i.buffer),a&&a.buffer&&o.push(a.buffer),n({type:`layer`,z:e,idx:t,gcode:r,paths:i,widths:a},o)});let i,a=performance.now();try{i=await ye(e,t,r)}finally{e.clear_layer_sink()}if(i&&i.error){n({type:`error`,error:String(i.error)});return}n({type:`done`,result:w(b(i),performance.now()-a)})}catch(e){let t={type:`error`,error:String(e&&e.message||e)};e?.code&&(t.code=e.code),n(t)}};