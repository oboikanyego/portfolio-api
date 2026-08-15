function getPagination(query) {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  const page = Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function paginatedResult(data, total, page, limit) {
  const pages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    total,
    page,
    pages,
    hasMore: page < pages
  };
}

module.exports = { getPagination, paginatedResult };
