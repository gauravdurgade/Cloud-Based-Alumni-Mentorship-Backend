const Joi = require('joi');

const getNotifications = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100)
    })
};

const byId = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

module.exports = {
    getNotifications,
    byId
};
