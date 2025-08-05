const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class CallHistory extends Model {
    static associate(models) {
      // A call history record belongs to a call (either GroupCall or Call)
      CallHistory.belongsTo(models.GroupCall, {
        foreignKey: 'call_id',
        as: 'groupCall'
      });

      CallHistory.belongsTo(models.Call, {
        foreignKey: 'call_id',
        as: 'call'
      });
    }

    // Instance methods
    getFormattedDuration() {
      if (!this.duration) return '0s';
      
      const hours = Math.floor(this.duration / 3600);
      const minutes = Math.floor((this.duration % 3600) / 60);
      const seconds = this.duration % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }

    getParticipantCount() {
      return this.participants ? this.participants.length : 0;
    }

    getHostParticipant() {
      if (!this.participants) return null;
      return this.participants.find(p => p.role === 'host');
    }

    getActiveParticipants() {
      if (!this.participants) return [];
      return this.participants.filter(p => p.joinedAt && !p.leftAt);
    }

    getParticipantsByRole(role) {
      if (!this.participants) return [];
      return this.participants.filter(p => p.role === role);
    }

    // Static methods for querying
    static async getCallHistoryByUser(userId, options = {}) {
      const { limit = 50, offset = 0, startDate, endDate } = options;
      
      const whereClause = {
        participants: {
          [sequelize.Sequelize.Op.contains]: [{ userId }]
        }
      };

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp[sequelize.Sequelize.Op.gte] = startDate;
        if (endDate) whereClause.timestamp[sequelize.Sequelize.Op.lte] = endDate;
      }

      return await CallHistory.findAndCountAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit,
        offset
      });
    }

    static async getCallStatsByUser(userId, timeframe = 'month') {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const calls = await CallHistory.findAll({
        where: {
          participants: {
            [sequelize.Sequelize.Op.contains]: [{ userId }]
          },
          timestamp: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        }
      });

      const totalCalls = calls.length;
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

      return {
        totalCalls,
        totalDuration,
        averageDuration,
        timeframe,
        startDate,
        endDate: now
      };
    }
  }

  CallHistory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    callId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'call_id',
      comment: 'References either calls or group_calls table'
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of participant objects with user info and participation details'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Call duration in seconds'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    call_type: {
      type: DataTypes.ENUM('audio', 'video', 'group_audio', 'group_video'),
      allowNull: true,
      comment: 'Type of call for quick filtering'
    },
    call_quality: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: true,
      comment: 'Overall call quality rating'
    },
    ended_reason: {
      type: DataTypes.ENUM('normal', 'timeout', 'technical_issue', 'cancelled', 'interrupted'),
      allowNull: true,
      defaultValue: 'normal',
      comment: 'Reason why the call ended'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional call metadata and analytics'
    }
  }, {
    sequelize,
    modelName: 'CallHistory',
    tableName: 'call_history',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['call_id'] },
      { fields: ['timestamp'] },
      { fields: ['call_type'] },
      { fields: ['duration'] },
      { 
        fields: ['participants'],
        using: 'gin',
        name: 'call_history_participants_gin'
      }
    ]
  });

  return CallHistory;
};
