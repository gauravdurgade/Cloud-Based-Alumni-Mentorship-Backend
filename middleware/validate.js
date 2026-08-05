const Joi = require('joi');
const logger = require('../config/logger');

const validate = (schema) => (req, res, next) => {
    const validSchema = Joi.object(schema);

    const object = Object.keys(schema).reduce((obj, key) => {
        if (Object.prototype.hasOwnProperty.call(req, key)) {
            obj[key] = req[key];
        }
        return obj;
    }, {});

    const { value, error } = validSchema.validate(object, {
        abortEarly: false
    });

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(', ');

        logger.warn(`Validation Error: ${errorMessage}`);

        return res.status(400).json({
            success: false,
            message: errorMessage,
            data: null
        });
    }

    Object.assign(req, value);
    return next();
};

module.exports = validate;