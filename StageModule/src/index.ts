export * from "./core/StageCore.js";
export * from "./utils/SObject.js";


import "./testers/AttributionTests.js";
import "./testers/SObjectTests.js";
export * from "./testers/Tester.js";

// Types
// export * from "./utils/TypeUtils";

declare global {
  var APP_VERSION: string;
}

globalThis.APP_VERSION = "1.0.0";

console.log(`Stage Version: ${APP_VERSION}`);
