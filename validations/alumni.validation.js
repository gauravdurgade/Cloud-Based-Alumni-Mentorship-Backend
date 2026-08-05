const Joi = require('joi');
const { ALUMNI_STATUS, ROLES } = require('../utils/constants');

const updateProfile = {
    body: Joi.object().keys({
        bio: Joi.string().allow(''),
        skills: Joi.array().items(Joi.string()),
        linkedin: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
        portfolio: Joi.string().uri().allow(''),
        company: Joi.string().allow(''),
        designation: Joi.string().allow(''),
        experience: Joi.number().min(0),
        mentorshipDomains: Joi.array().items(Joi.string()),
        isAvailable: Joi.boolean(),
        availabilityStatus: Joi.string().valid("Available", "Busy", "On Leave")
    })
};

const getAll = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        keyword: Joi.string(),
        company: Joi.string(),
        designation: Joi.string(),
        mentorshipDomains: Joi.string(),
        skills: Joi.string(),
        experience: Joi.number().min(0),
        isAvailable: Joi.boolean(),
        sort: Joi.string().valid('oldest', 'experienceAsc', 'experienceDesc', 'nameAsc', 'nameDesc', 'newest')
    })
};

const getById = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

module.exports = {
    updateProfile,
    getAll,
    getById
};
