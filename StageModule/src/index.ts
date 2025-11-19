export * from "./utils/SObject.js";
export * from "./utils/SOrderedMap.js";

export * from "./math/SMath.js";
export * from "./math/Rotation2D.js";
export * from "./math/Vector2D.js";

export * from "./core/StageCore.js";
export * from "./core/Graphics2D.js";
export * from "./core/Color.js";
export * from "./core/Course.js";

import "./testers/AttributionTests.js";
import "./testers/SObjectTests.js";
export * from "./testers/Tester.js";
export * from "./utils/TypeUtils.js";

declare global {
    var APP_VERSION: string;
}

globalThis.APP_VERSION = "1.0.0";

console.log(`Stage Version: ${APP_VERSION}`);
