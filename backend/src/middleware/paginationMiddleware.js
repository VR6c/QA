/**
 * Standardized Pagination & Search Parameters Middleware
 */
export const parsePaginationParams = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const search = (req.query.search || '').trim();

  req.pagination = {
    page,
    limit,
    skip,
    sort: { [sortBy]: sortOrder },
    search
  };

  next();
};
