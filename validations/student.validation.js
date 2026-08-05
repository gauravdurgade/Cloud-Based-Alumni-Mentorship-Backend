const Joi = require('joi');

const updateProfile = {
    body: Joi.object().keys({
        bio: Joi.string().allow(''),
        branch: Joi.string().allow(''),
        year: Joi.string().allow(''),
        skills: Joi.array().items(Joi.string()),
        linkedin: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
        portfolio: Joi.string().uri().allow('')
    })
};

module.exports = {
    updateProfile
};
