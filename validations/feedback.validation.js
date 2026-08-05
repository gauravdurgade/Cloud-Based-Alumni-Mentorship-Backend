const Joi = require('joi');

const submitFeedback = {
    body: Joi.object().keys({
        meetingId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        rating: Joi.number().min(1).max(5).required(),
        review: Joi.string().allow(''),
        recommended: Joi.boolean()
    })
};

const getAlumniFeedback = {
    params: Joi.object().keys({
        alumniId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

module.exports = {
    submitFeedback,
    getAlumniFeedback
};
