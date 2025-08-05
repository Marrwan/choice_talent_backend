const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Call extends Model {
    static associate(models) {
      // A call belongs to a caller (user)
      Call.belongsTo(models.User, {
        foreignKey: 'caller_id',
        as: 'caller'
      });

      // A call may belong to a receiver (user) - nullable for group calls
      Call.belongsTo(models.User, {
        foreignKey: 'receiver_id',
        as: 'receiver'
      });

      // A call may belong to a conversation
      Call.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation'
      });

      // A call may belong to a group
      Call.belongsTo(models.Group, {
        foreignKey: 'group_id',
        as: 'group'
      });

      // A call has many group call participants
      Call.hasMany(models.GroupCallParticipant, {
        foreignKey: 'call_id',
        as: 'participants'
      });
    }

    // Instance methods
    isGroupCall() {
      return this.call_type === 'group_audio' || this.call_type === 'group_video';
    }

    isDirectCall() {
      return this.call_type === 'audio' || this.call_type === 'video';
    }

    isVideoCall() {
      return this.call_type === 'video' || this.call_type === 'group_video';
    }

    isAudioCall() {
      return this.call_type === 'audio' || this.call_type === 'group_audio';
    }

    async startCall() {
      this.status = 'active';
      this.started_at = new Date();
      await this.save();
    }

    async endCall() {
      this.status = 'ended';
      this.ended_at = new Date();
      if (this.started_at) {
        this.duration = Math.floor((this.ended_at - this.started_at) / 1000);
      }
      await this.save();
    }

    async markAsMissed() {
      this.status = 'missed';
      await this.save();
    }

    async markAsDeclined() {
      this.status = 'declined';
      await this.save();
    }

    // Get active participants for group calls
    async getActiveParticipants() {
      if (!this.isGroupCall()) return [];
      const GroupCallParticipant = sequelize.models.GroupCallParticipant;
      const User = sequelize.models.User;
      
      return await GroupCallParticipant.findAll({
        where: {
          call_id: this.id,
          status: 'connected'
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'realName', 'profilePicture']
        }]
      });
    }

    // Get all participants for group calls
    async getAllParticipants() {
      if (!this.isGroupCall()) return [];
      const GroupCallParticipant = sequelize.models.GroupCallParticipant;
      const User = sequelize.models.User;
      
      return await GroupCallParticipant.findAll({
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
  }

  Call.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    caller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for group calls
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'conversations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    call_type: {
      type: DataTypes.ENUM('audio', 'video', 'group_audio', 'group_video'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ringing', 'active', 'ended', 'missed', 'declined'),
      allowNull: false,
      defaultValue: 'ringing'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds'
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Extra call metadata (ICE, SDP, etc)'
    }
  }, {
    sequelize,
    modelName: 'Call',
    tableName: 'calls',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['caller_id'] },
      { fields: ['receiver_id'] },
      { fields: ['conversation_id'] },
      { fields: ['group_id'] },
      { fields: ['status'] },
      { fields: ['call_type'] }
    ]
  });

  return Call;
};
