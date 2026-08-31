import Owner from '../models/Owner.js';
import Task from '../models/Task.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DEFAULT_OWNERS = [
  { name: 'Unassigned', role: 'General', color: 'slate', isDefault: true },
  { name: 'Vireak', role: 'QA Lead', color: 'indigo', isDefault: true },
  { name: 'QA Team', role: 'QA Tester', color: 'blue', isDefault: true },
  { name: 'Dev Team', role: 'Developer', color: 'emerald', isDefault: true },
  { name: 'Product Manager', role: 'Product Owner', color: 'purple', isDefault: true }
];

export const ownerController = {
  // GET /api/owners
  getAllOwners: async (req, res) => {
    try {
      let owners = await Owner.find().sort({ isDefault: -1, createdAt: 1 }).lean();

      if (owners.length === 0) {
        const createdDocs = await Owner.insertMany(DEFAULT_OWNERS);
        owners = createdDocs.map(doc => doc.toObject());
      }

      return sendSuccess(res, owners, { total: owners.length });
    } catch (error) {
      console.error('Error fetching owners:', error);
      return sendError(res, error.message || 'Failed to fetch owners', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/owners
  createOwner: async (req, res) => {
    try {
      const { name, role, color } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Owner name is required', 400, 'ERR_VALIDATION');
      }

      const trimmedName = name.trim();

      const existingOwner = await Owner.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
      }).lean();

      if (existingOwner) {
        return sendError(res, `Owner "${trimmedName}" already exists`, 409, 'ERR_CONFLICT');
      }

      const newOwner = new Owner({
        name: trimmedName,
        role: (role && role.trim()) || 'Team Member',
        color: color || 'blue'
      });

      await newOwner.save();

      recordActivity({
        req,
        module: 'Owner Management',
        action: 'OWNER_CREATED',
        targetType: 'Owner',
        targetId: newOwner._id.toString(),
        targetName: newOwner.name,
        description: `Created owner profile "${newOwner.name}" with role "${newOwner.role}"`,
        newValue: { name: newOwner.name, role: newOwner.role, color: newOwner.color }
      });

      return sendSuccess(res, newOwner, null, 'Owner created successfully', 201);
    } catch (error) {
      console.error('Error creating owner:', error);
      return sendError(res, error.message || 'Failed to create owner', 400, 'ERR_VALIDATION');
    }
  },

  // PATCH /api/owners/:id
  updateOwner: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, color } = req.body;

      const currentOwner = await Owner.findById(id);
      if (!currentOwner) {
        return sendError(res, `Owner with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      const oldName = currentOwner.name;
      const oldRole = currentOwner.role;
      const oldColor = currentOwner.color;
      let newName = oldName;

      if (name && typeof name === 'string') {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return sendError(res, 'Owner name cannot be empty', 400, 'ERR_VALIDATION');
        }

        if (trimmedName.toLowerCase() !== oldName.toLowerCase()) {
          const existingOwner = await Owner.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
          }).lean();

          if (existingOwner) {
            return sendError(res, `Owner name "${trimmedName}" is already taken`, 409, 'ERR_CONFLICT');
          }
        }
        newName = trimmedName;
      }

      currentOwner.name = newName;
      if (role !== undefined) currentOwner.role = role.trim();
      if (color !== undefined) currentOwner.color = color;

      await currentOwner.save();

      if (oldName !== newName) {
        await Task.updateMany({ owner: oldName }, { owner: newName });
      }

      recordActivity({
        req,
        module: 'Owner Management',
        action: 'OWNER_UPDATED',
        targetType: 'Owner',
        targetId: currentOwner._id.toString(),
        targetName: currentOwner.name,
        description: `Updated owner profile for "${currentOwner.name}"`,
        oldValue: { name: oldName, role: oldRole, color: oldColor },
        newValue: { name: currentOwner.name, role: currentOwner.role, color: currentOwner.color }
      });

      return sendSuccess(res, currentOwner, null, 'Owner updated successfully');
    } catch (error) {
      console.error('Error updating owner:', error);
      return sendError(res, error.message || 'Failed to update owner', 400, 'ERR_VALIDATION');
    }
  },

  // DELETE /api/owners/:id
  deleteOwner: async (req, res) => {
    try {
      const { id } = req.params;
      const owner = await Owner.findById(id);

      if (!owner) {
        return sendError(res, `Owner with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }

      if (owner.name === 'Unassigned') {
        return sendError(res, 'The default "Unassigned" owner cannot be deleted', 400, 'ERR_FORBIDDEN');
      }

      const deletedName = owner.name;
      await Owner.findByIdAndDelete(id);

      await Task.updateMany({ owner: deletedName }, { owner: 'Unassigned' });

      recordActivity({
        req,
        module: 'Owner Management',
        action: 'OWNER_DELETED',
        targetType: 'Owner',
        targetId: owner._id.toString(),
        targetName: deletedName,
        description: `Deleted owner "${deletedName}" and reassigned tasks to Unassigned`,
        oldValue: { name: owner.name, role: owner.role }
      });

      return sendSuccess(res, { id }, null, `Owner "${deletedName}" removed. Tasks reassigned to Unassigned.`);
    } catch (error) {
      console.error('Error deleting owner:', error);
      return sendError(res, error.message || 'Failed to delete owner', 500, 'ERR_INTERNAL');
    }
  }
};
