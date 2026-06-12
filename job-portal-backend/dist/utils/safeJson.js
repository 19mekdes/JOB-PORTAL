"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJsonParse = void 0;
const safeJsonParse = (value, fallback = []) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value ?? fallback;
};
exports.safeJsonParse = safeJsonParse;
