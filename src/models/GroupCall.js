const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class GroupCall extends Model {
    static associate(models) {
      // A group call belongs to a group
      GroupCall.belongsTo(models.Group, {
        foreignKey: 'group_id',
        as: 'group'
      });

      // A group call has many call participants
      GroupCall.hasMany(models.CallParticipant, {
        foreignKey: 'call_id',
        as: 'callParticipants'
      });

      // A group call may have call history records
      GroupCall.hasMany(models.CallHistory, {
        foreignKey: 'call_id',
        as: 'history'
      });
    }

    // Instance methods
    isActive() {
      return this.status === 'active';
    }

    isEnded() {
      return this.status === 'ended';
    }

    isPending() {
      return this.status === 'pending';
    }

    isCancelled() {
      return this.status === 'cancelled';
    }

    async startCall() {
      this.status = 'active';
      this.startTime = new Date();
      await this.save();
    }

    async endCall() {
      this.status = 'ended';
      this.endTime = new Date();
      await this.save();
    }

    async cancelCall() {
      this.status = 'cancelled';
      this.endTime = new Date();
      await this.save();
    }

    // Get call duration in seconds
    getDuration() {
      if (!this.startTime) return 0;
      const endTime = this.endTime || new Date();
      return Math.floor((endTime - this.startTime) / 1000);
    }

    // Get active participants
    async getActiveParticipants() {
      const CallParticipant = sequelize.models.CallParticipant;
      const User = sequelize.models.User;
      
      return await CallParticipant.findAll({
        where: {
          call_id: this.id,
          status: 'joined'
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      });
    }

    // Get all participants
    async getAllParticipants() {
      const CallParticipant = sequelize.models.CallParticipant;
      const User = sequelize.models.User;
      
      return await CallParticipant.findAll({
        where: {
          call_id: this.id
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      });
    }

    // Create call history record
    async createHistoryRecord() {
      const CallHistory = sequelize.models.CallHistory;
      const participants = await this.getAllParticipants();
      
      const participantsList = participants.map(p => ({
        userId: p.user_id,
        username: p.user.username,
        role: p.role,
        joinedAt: p.joined_at,
        leftAt: p.left_at
      }));

      return await CallHistory.create({
        call_id: this.id,
        participants: participantsList,
        duration: this.getDuration(),
        timestamp: this.endTime || new Date()
      });
    }
  }

  GroupCall.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of participant user IDs'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'ended', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    call_type: {
      type: DataTypes.ENUM('audio', 'video'),
      allowNull: false,
      defaultValue: 'audio'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional call metadata (settings, quality, etc.)'
    }
  }, {
    sequelize,
    modelName: 'GroupCall',
    tableName: 'group_calls',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['group_id'] },
      { fields: ['status'] },
      { fields: ['call_type'] },
      { fields: ['start_time'] },
      { fields: ['end_time'] }
    ]
  });

  return GroupCall;
};
