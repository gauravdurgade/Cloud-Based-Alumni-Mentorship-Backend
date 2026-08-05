/**
 * Mongoose plugin to automatically filter out soft-deleted documents.
 * Adds `isDeleted` and `deletedAt` fields to the schema.
 * Automatically excludes `isDeleted: true` from `find`, `findOne`, `countDocuments`, etc.
 */
module.exports = function softDeletePlugin(schema) {
    schema.add({
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    });

    const types = ['find', 'findOne', 'countDocuments', 'findOneAndUpdate', 'updateMany'];

    types.forEach(type => {
        schema.pre(type, function (next) {
            // Only apply if the query hasn't explicitly requested deleted docs
            if (this.getFilter().isDeleted !== true && this.getFilter().isDeleted !== false) {
                this.where({ isDeleted: { $ne: true } });
            }
            next();
        });
    });
};
