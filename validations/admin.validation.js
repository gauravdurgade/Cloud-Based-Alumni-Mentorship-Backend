const Joi = require('joi');

const getAllUsers = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        keyword: Joi.string(),
        role: Joi.string().valid('student', 'alumni', 'admin'),
        accountStatus: Joi.string().valid('Active', 'Suspended'),
        branch: Joi.string(),
        company: Joi.string(),
        designation: Joi.string(),
        availability: Joi.boolean(),
        isAlumniApproved: Joi.string().valid('Pending', 'Approved', 'Rejected')
    })
};

const getById = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

const updateStatus = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object().keys({
        accountStatus: Joi.string().valid('Active', 'Suspended'),
        alumniApprovalStatus: Joi.string().valid('Pending', 'Approved', 'Rejected')
    }).min(1)
};

const updateUser = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object().unknown(true)
};

const deleteUser = {
    params: Joi.object().keys({
        id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
};

module.exports = {
    getAllUsers,
    getById,
    updateStatus,
    updateUser,
    deleteUser
};
