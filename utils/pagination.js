/**
 * Calculates pagination metadata and returns skip/limit values
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalDocuments - Total documents in collection
 * @returns {object} { skip, limit, paginationMeta }
 */
const getPagination = (page = 1, limit = 10, totalDocuments = 0) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const totalPages = Math.ceil(totalDocuments / limitNum);

    const paginationMeta = {
        total: totalDocuments,
        page: pageNum,
        pages: totalPages,
        limit: limitNum
    };

    return { skip, limit: limitNum, paginationMeta };
};

module.exports = { getPagination };
