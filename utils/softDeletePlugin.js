/**
 * Mongoose plugin to automatically filter out soft-deleted documents.
 * Adds `isDeleted` and `deletedAt` fields to the schema.
 * Automatically excludes `isDeleted: true` from queries.
 */

module.exports = function softDeletePlugin(schema) {
    schema.add({
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    });

    const queryTypes = [
        "find",
        "findOne",
        "countDocuments",
        "findOneAndUpdate",
        "updateMany",
    ];

    queryTypes.forEach((type) => {
        schema.pre(type, function () {
            const filter = this.getFilter();

            if (
                filter.isDeleted !== true &&
                filter.isDeleted !== false
            ) {
                this.where({ isDeleted: { $ne: true } });
            }
        });
    });
};