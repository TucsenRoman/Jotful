/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch",
  displayName: "Jotful",
  bundleIdentifier: ".watch",
  icon: "../../assets/icon-1024.png",
  colors: { $accent: "#EF705A" },
  deploymentTarget: "9.4",
  entitlements: { /* Add entitlements */ },
});
