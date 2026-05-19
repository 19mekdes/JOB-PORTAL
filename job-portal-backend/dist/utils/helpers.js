"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHashtags = exports.formatDate = exports.generatePublicId = void 0;
const generatePublicId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};
exports.generatePublicId = generatePublicId;
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
exports.formatDate = formatDate;
const extractHashtags = (text) => {
    return text.match(/#\w+/g) || [];
};
exports.extractHashtags = extractHashtags;
