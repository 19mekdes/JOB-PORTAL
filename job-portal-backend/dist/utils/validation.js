"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePhone = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    return password.length >= 6;
};
exports.validatePassword = validatePassword;
const validatePhone = (phone) => {
    const re = /^[0-9+\-\s()]{10,15}$/;
    return re.test(phone);
};
exports.validatePhone = validatePhone;
