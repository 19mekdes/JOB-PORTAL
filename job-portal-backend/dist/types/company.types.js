"use strict";
// src/types/company.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.canCompanyPostJob = exports.isCompanyVerified = exports.isCompanyActive = void 0;
// Company validation helpers
const isCompanyActive = (company) => {
    return company.is_active === true;
};
exports.isCompanyActive = isCompanyActive;
const isCompanyVerified = (company) => {
    return company.is_verified === true;
};
exports.isCompanyVerified = isCompanyVerified;
const canCompanyPostJob = (company) => {
    return company.is_active === true && company.is_verified === true;
};
exports.canCompanyPostJob = canCompanyPostJob;
