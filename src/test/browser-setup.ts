import "@testing-library/jest-dom/vitest";

if (typeof globalThis.process === "undefined") {
  Object.assign(globalThis, {
    process: {
      env: {},
    },
  });
}
