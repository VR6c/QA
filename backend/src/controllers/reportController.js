import Task from '../models/Task.js';
import Report from '../models/Report.js';
import Setting from '../models/Setting.js';
import { recordActivity } from '../services/auditLogger.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const defaultKpiTargets = {
  quick_test: { name: 'Quick Test on TestFlight', good: 3, excellence: 4, unit: 'month' },
  finding_error: { name: 'Finding Product Error', good: 4, excellence: 6, unit: 'month' },
  conduct_testing: { name: 'Conduct Testing New Feature', good: 4, excellence: 6, unit: 'month' },
  new_idea: { name: 'New Idea Propose', good: 1, excellence: 3, unit: 'month' },
  research_doc: { name: 'Research Testing Template & Document', good: 1, excellence: 2, unit: 'month' }
};

// Helper: Normalize Task KPI Category string to standard key
export function mapTaskToKpiCategoryKey(task) {
  const cat = (task.kpiCategory || '').toLowerCase().trim();
  const flowVal = (task.flowValue || '').toLowerCase().trim();
  const title = (task.title || '').toLowerCase().trim();

  if (cat.includes('quick_test') || cat.includes('quick test') || flowVal.includes('quick test')) return 'quick_test';
  if (cat.includes('finding') || cat.includes('product error') || cat.includes('error') || flowVal.includes('finding')) return 'finding_error';
  if (cat.includes('conduct') || cat.includes('testing new feature') || cat.includes('conduct_testing')) return 'conduct_testing';
  if (cat.includes('idea') || cat.includes('new idea') || cat.includes('propose')) return 'new_idea';
  if (cat.includes('research') || cat.includes('template') || cat.includes('document') || cat.includes('doc')) return 'research_doc';

  // Fallback title checks
  if (title.includes('testflight') || title.includes('quick test')) return 'quick_test';
  if (title.includes('error') || title.includes('bug')) return 'finding_error';
  if (title.includes('conduct') || title.includes('new feature')) return 'conduct_testing';
  if (title.includes('idea')) return 'new_idea';
  if (title.includes('research') || title.includes('template')) return 'research_doc';

  return 'other';
}

export const reportController = {
  // GET /api/reports/kpi-targets
  getKpiTargets: async (req, res) => {
    try {
      let setting = await Setting.findOne({ key: 'kpi_target_thresholds' });
      if (!setting) {
        setting = new Setting({
          key: 'kpi_target_thresholds',
          name: 'IMP KPI Target Thresholds',
          category: 'Feature',
          value: defaultKpiTargets,
          value_type: 'json',
          description: 'Dynamic target thresholds for Monthly Individual KPI evaluation'
        });
        await setting.save();
      }
      return sendSuccess(res, setting.value, null, 'KPI target thresholds retrieved');
    } catch (error) {
      console.error('Error getting KPI targets:', error);
      return sendError(res, error.message || 'Failed to fetch KPI targets', 500, 'ERR_INTERNAL');
    }
  },

  // PUT /api/reports/kpi-targets
  updateKpiTargets: async (req, res) => {
    try {
      const newTargets = req.body;
      let setting = await Setting.findOne({ key: 'kpi_target_thresholds' });

      const updatedValue = { ...defaultKpiTargets, ...newTargets };

      if (!setting) {
        setting = new Setting({
          key: 'kpi_target_thresholds',
          name: 'IMP KPI Target Thresholds',
          category: 'Feature',
          value: updatedValue,
          value_type: 'json',
          description: 'Dynamic target thresholds for Monthly Individual KPI evaluation'
        });
      } else {
        setting.value = updatedValue;
        setting.updated_by = req.user?.name || 'Super Admin';
      }
      await setting.save();

      recordActivity({
        req,
        module: 'Report Engine',
        action: 'KPI_TARGETS_UPDATED',
        description: 'Updated dynamic KPI evaluation target thresholds',
        newValue: updatedValue
      });

      return sendSuccess(res, setting.value, null, 'KPI target thresholds updated successfully');
    } catch (error) {
      console.error('Error updating KPI targets:', error);
      return sendError(res, error.message || 'Failed to update KPI targets', 400, 'ERR_VALIDATION');
    }
  },

  // GET /api/reports/weekly/preview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  getWeeklyPreview: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateQuery = {};
      if (startDate && endDate) {
        dateQuery = { date: { $gte: startDate, $lte: endDate } };
      }

      const tasks = await Task.find(dateQuery).sort({ date: 1, createdAt: 1 }).lean();
      const formattedTasks = tasks.map(t => ({ ...t, id: t._id.toString() }));

      // 1. Group chronologically by day (Monday through Saturday)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const daysMap = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: []
      };

      formattedTasks.forEach(t => {
        let dayName = 'Monday';
        if (t.date && t.date.length >= 10) {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
            const calculatedDay = dayNames[d.getDay()];
            if (daysMap[calculatedDay]) dayName = calculatedDay;
          }
        }
        if (daysMap[dayName]) {
          daysMap[dayName].push(t);
        } else {
          daysMap['Monday'].push(t);
        }
      });

      // 2. Section Partitioning
      const lastWeekAchievement = formattedTasks.filter(t =>
        ['success', 'done', 'done_production'].includes(t.status)
      );

      const thisWeekPlan = formattedTasks.filter(t =>
        ['testing', 'progress', 'backlog'].includes(t.status)
      );

      // Tracking Owner Deployment
      const ownerDeploymentMap = {};
      formattedTasks.forEach(t => {
        const owner = t.owner || 'Unassigned';
        if (!ownerDeploymentMap[owner]) {
          ownerDeploymentMap[owner] = { owner, total: 0, done: 0, pending: 0, items: [] };
        }
        ownerDeploymentMap[owner].total++;
        if (['success', 'done', 'done_production'].includes(t.status)) {
          ownerDeploymentMap[owner].done++;
        } else {
          ownerDeploymentMap[owner].pending++;
        }
        ownerDeploymentMap[owner].items.push(t);
      });

      // 3. GCIN Auto-suggest Blockers (feedback status > 48h)
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const blockerTasks = formattedTasks.filter(t =>
        t.status === 'feedback' && new Date(t.updatedAt || t.createdAt || Date.now()) < fortyEightHoursAgo
      );

      const autoSuggestedChallenges = blockerTasks.map(t =>
        `[Blocker >48h] Task "${t.title}" (Owner: ${t.owner}) held in feedback status.`
      );

      const previewData = {
        startDate: startDate || '',
        endDate: endDate || '',
        days: daysMap,
        sections: {
          lastWeekAchievement,
          thisWeekPlan,
          trackingOwnerDeployment: Object.values(ownerDeploymentMap)
        },
        gcinAutoSuggestions: {
          good: lastWeekAchievement.length > 0 ? [`Successfully completed ${lastWeekAchievement.length} tasks during the cycle.`] : [],
          challenge: autoSuggestedChallenges,
          improvement: ['Streamline QA feedback verification cycle to eliminate >48h bottlenecks.'],
          nextAction: ['Conduct daily standup sync on pending testflight builds.']
        },
        totalTasks: formattedTasks.length
      };

      return sendSuccess(res, previewData, null, 'Weekly report preview generated successfully');
    } catch (error) {
      console.error('Error generating weekly report preview:', error);
      return sendError(res, error.message || 'Failed to generate weekly report preview', 500, 'ERR_INTERNAL');
    }
  },

  // GET /api/reports/monthly/preview?targetMonth=YYYY-MM&owner=OwnerName
  getMonthlyPreview: async (req, res) => {
    try {
      const { targetMonth, owner } = req.query;

      if (!targetMonth || !targetMonth.match(/^\d{4}-\d{2}$/)) {
        return sendError(res, 'Valid targetMonth (YYYY-MM) is required', 400, 'ERR_VALIDATION');
      }

      // Fetch dynamic target thresholds
      let setting = await Setting.findOne({ key: 'kpi_target_thresholds' });
      const kpiTargets = setting?.value || defaultKpiTargets;

      // REQ-REP-D3: Safe Query for Regeneration & Preview
      const monthStartStr = `${targetMonth}-01`;
      const monthEndStr = `${targetMonth}-31`;

      const safeQuery = {
        status: { $in: ['success', 'done', 'done_production'] },
        $or: [
          {
            $or: [
              { date: { $regex: `^${targetMonth}` } },
              { completed_at: { $gte: new Date(`${monthStartStr}T00:00:00.000Z`), $lte: new Date(`${monthEndStr}T23:59:59.999Z`) } }
            ],
            kpi_claimed_month: null
          },
          { kpi_claimed_month: targetMonth }
        ]
      };

      if (owner && owner !== 'all' && owner !== 'All') {
        safeQuery.owner = { $regex: new RegExp(`^${escapeRegex(owner.trim())}$`, 'i') };
      }

      const tasks = await Task.find(safeQuery).sort({ date: 1 }).lean();
      const formattedTasks = tasks.map(t => ({ ...t, id: t._id.toString() }));

      // REQ-REP-M1: IMP KPI Category Count Aggregation
      const counts = {
        quick_test: 0,
        finding_error: 0,
        conduct_testing: 0,
        new_idea: 0,
        research_doc: 0,
        other: 0
      };

      const categorizedItems = {
        quick_test: [],
        finding_error: [],
        conduct_testing: [],
        new_idea: [],
        research_doc: [],
        other: []
      };

      formattedTasks.forEach(t => {
        const catKey = mapTaskToKpiCategoryKey(t);
        if (counts[catKey] !== undefined) {
          counts[catKey]++;
          categorizedItems[catKey].push(t);
        } else {
          counts.other++;
          categorizedItems.other.push(t);
        }
      });

      // REQ-REP-M2: Performance Tier Auto-Assignment
      const evaluateTier = (count, targetObj) => {
        if (!targetObj) return 'Needs Improvement';
        if (count >= targetObj.excellence) return 'Excellence';
        if (count >= targetObj.good) return 'Good';
        return 'Needs Improvement';
      };

      const performanceTiers = {
        quick_test: evaluateTier(counts.quick_test, kpiTargets.quick_test),
        finding_error: evaluateTier(counts.finding_error, kpiTargets.finding_error),
        conduct_testing: evaluateTier(counts.conduct_testing, kpiTargets.conduct_testing),
        new_idea: evaluateTier(counts.new_idea, kpiTargets.new_idea),
        research_doc: evaluateTier(counts.research_doc, kpiTargets.research_doc)
      };

      const excellenceCount = Object.values(performanceTiers).filter(t => t === 'Excellence').length;
      const goodCount = Object.values(performanceTiers).filter(t => t === 'Good' || t === 'Excellence').length;
      let overallTier = 'Needs Improvement';
      if (excellenceCount >= 3) overallTier = 'Excellence';
      else if (goodCount >= 3) overallTier = 'Good';

      performanceTiers.overall = overallTier;

      // REQ-REP-M3: Timeliness & Deadline Auditing
      const timeliness = {
        on_time: [],
        over_deadline: []
      };

      formattedTasks.forEach(t => {
        const targetTimeline = t.due_date || t.timeline || t.date;
        const compDateStr = t.completed_at ? t.completed_at.toISOString().split('T')[0] : t.date;

        if (targetTimeline && compDateStr > targetTimeline) {
          timeliness.over_deadline.push({
            ...t,
            delayReason: t.delay_reason || t.reason || 'Requirement change or developer delay'
          });
        } else {
          timeliness.on_time.push(t);
        }
      });

      const previewData = {
        targetMonth,
        owner: owner || 'All',
        kpiTargets,
        counts,
        categorizedItems,
        performanceTiers,
        timelinessSummary: {
          onTimeCount: timeliness.on_time.length,
          overDeadlineCount: timeliness.over_deadline.length,
          onTimeItems: timeliness.on_time,
          overDeadlineItems: timeliness.over_deadline
        },
        totalEligibleTasks: formattedTasks.length
      };

      return sendSuccess(res, previewData, null, 'Monthly report preview generated successfully');
    } catch (error) {
      console.error('Error generating monthly report preview:', error);
      return sendError(res, error.message || 'Failed to generate monthly report preview', 500, 'ERR_INTERNAL');
    }
  },

  // POST /api/reports/finalize (REQ-REP-D2: Atomic Claim & Lock)
  finalizeReport: async (req, res) => {
    try {
      const {
        title,
        type,
        period,
        startDate,
        endDate,
        owner,
        gcin,
        task_ids,
        metrics,
        kpi_targets,
        performance_tier,
        challenges_success_stories
      } = req.body;

      if (!title || !type || !period) {
        return sendError(res, 'Title, type, and period are required', 400, 'ERR_VALIDATION');
      }

      // 1. Create Report Document
      const newReport = new Report({
        title,
        type,
        period,
        startDate: startDate || null,
        endDate: endDate || null,
        owner: owner || 'All',
        status: 'finalized',
        gcin: gcin || { good: [], challenge: [], improvement: [], nextAction: [] },
        task_ids: task_ids || [],
        metrics: metrics || {},
        kpi_targets: kpi_targets || null,
        performance_tier: performance_tier || {},
        challenges_success_stories: challenges_success_stories || {},
        created_by: req.user?.name || 'Super Admin'
      });

      await newReport.save();

      // 2. REQ-REP-D2: Atomic Claim & Lock included tasks if monthly report
      if (type === 'monthly' && Array.isArray(task_ids) && task_ids.length > 0) {
        await Task.updateMany(
          { _id: { $in: task_ids } },
          {
            $set: {
              kpi_claimed_month: period,
              kpi_claimed_report_id: newReport._id
            }
          }
        );
      }

      recordActivity({
        req,
        module: 'Report Engine',
        action: 'REPORT_FINALIZED',
        targetType: 'Report',
        targetId: newReport._id.toString(),
        targetName: newReport.title,
        description: `Finalized and locked ${type} report "${newReport.title}" for period ${period} (${task_ids?.length || 0} tasks claimed)`
      });

      return sendSuccess(res, newReport, null, 'Report finalized and tasks claimed successfully', 201);
    } catch (error) {
      console.error('Error finalizing report:', error);
      return sendError(res, error.message || 'Failed to finalize report', 400, 'ERR_VALIDATION');
    }
  },

  // POST /api/reports/unlock-task/:taskId (REQ-REP-D4: Manual Release Mechanism)
  unlockTask: async (req, res) => {
    try {
      const { taskId } = req.params;

      const task = await Task.findById(taskId);
      if (!task) {
        return sendError(res, `Task with ID ${taskId} not found`, 404, 'ERR_NOT_FOUND');
      }

      const previousClaimedMonth = task.kpi_claimed_month;

      task.kpi_claimed_month = null;
      task.kpi_claimed_report_id = null;
      await task.save();

      recordActivity({
        req,
        module: 'Report Engine',
        action: 'TASK_KPI_UNLOCKED',
        targetType: 'Task',
        targetId: task._id.toString(),
        targetName: task.title,
        description: `Super Admin / QA Lead unlocked claimed KPI task "${task.title}" (previously claimed in ${previousClaimedMonth || 'N/A'})`,
        oldValue: { kpi_claimed_month: previousClaimedMonth },
        newValue: { kpi_claimed_month: null }
      });

      return sendSuccess(res, task, null, `Task "${task.title}" released and unlocked successfully`);
    } catch (error) {
      console.error('Error unlocking task:', error);
      return sendError(res, error.message || 'Failed to unlock task', 500, 'ERR_INTERNAL');
    }
  },

  // GET /api/reports
  getReports: async (req, res) => {
    try {
      const reports = await Report.find({}).sort({ createdAt: -1 }).lean();
      const formattedReports = reports.map(r => ({ ...r, id: r._id.toString() }));
      return sendSuccess(res, formattedReports, { total: formattedReports.length }, 'Reports retrieved successfully');
    } catch (error) {
      console.error('Error fetching reports:', error);
      return sendError(res, error.message || 'Failed to fetch reports', 500, 'ERR_INTERNAL');
    }
  },

  // GET /api/reports/:id
  getReportById: async (req, res) => {
    try {
      const { id } = req.params;
      const report = await Report.findById(id).populate('task_ids').lean();
      if (!report) {
        return sendError(res, `Report with ID ${id} not found`, 404, 'ERR_NOT_FOUND');
      }
      return sendSuccess(res, { ...report, id: report._id.toString() }, null, 'Report retrieved');
    } catch (error) {
      console.error('Error fetching report:', error);
      return sendError(res, error.message || 'Failed to fetch report', 500, 'ERR_INTERNAL');
    }
  }
};
