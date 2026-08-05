const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const register = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid(ROLES.STUDENT, ROLES.ALUMNI).default(ROLES.STUDENT) // Admin cannot be registered via API
    })
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
};

module.exports = {
    register,
    login
};
