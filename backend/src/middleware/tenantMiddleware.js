/**
 * Multi-Tenant Context Isolation Middleware
 */
export const tenantMiddleware = (req, res, next) => {
  // Extract tenant ID from header, query, or decoded token payload
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id || 'default_organization';
  req.tenantId = String(tenantId).trim();
  next();
};
