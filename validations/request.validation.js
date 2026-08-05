const Joi = require('joi');

const createRequest = {
    body: Joi.object().keys({
        alumniId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        message: Joi.string().required()
    })
};

const acceptRequest = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object().keys({
        scheduledDate: Joi.date().iso(),
        meetingLink: Joi.string().uri().allow(''),
        meetingPlatform: Joi.string().allow('')
    })
};

const rejectRequest = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

const completeRequest = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object().keys({
        completionNotes: Joi.string().allow('')
    })
};

module.exports = {
    createRequest,
    acceptRequest,
    rejectRequest,
    completeRequest
};
