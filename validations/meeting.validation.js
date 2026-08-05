const Joi = require('joi');

const createMeeting = {
    body: Joi.object().keys({
        requestId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        title: Joi.string().required(),
        scheduledDate: Joi.date().iso().required(),
        durationMinutes: Joi.number().integer().min(15).max(180),
        meetingPlatform: Joi.string().allow(''),
        meetingLink: Joi.string().uri().allow('')
    })
};

const updateStatus = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid("Scheduled", "Completed", "Cancelled").required()
    })
};

module.exports = {
    createMeeting,
    updateStatus
};
