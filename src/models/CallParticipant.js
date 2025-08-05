const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class CallParticipant extends Model {
    static associate(models) {
      // A call participant belongs to a call (either GroupCall or Call)
      CallParticipant.belongsTo(models.GroupCall, {
        foreignKey: 'call_id',
        as: 'groupCall'
      });

      CallParticipant.belongsTo(models.Call, {
        foreignKey: 'call_id',
        as: 'call'
      });

      // A call participant belongs to a user
      CallParticipant.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Instance methods
    isHost() {
      return this.role === 'host';
    }

    isModerator() {
      return this.role === 'moderator';
    }

    isParticipant() {
      return this.role === 'participant';
    }

    isJoined() {
      return this.status === 'joined' && this.joined_at && !this.left_at;
    }

    isInvited() {
      return this.status === 'invited';
    }

    hasDeclined() {
      return this.status === 'declined';
    }

    hasMissed() {
      return this.status === 'missed';
    }

    hasLeft() {
      return this.status === 'left' && this.left_at;
    }

    // Join the call
    async joinCall() {
      this.status = 'joined';
      this.joined_at = new Date();
      this.left_at = null;
      await this.save();
    }

    // Leave the call
    async leaveCall() {
      this.status = 'left';
      this.left_at = new Date();
      await this.save();
    }

    // Decline the call invitation
    async declineCall() {
      this.status = 'declined';
      await this.save();
    }

    // Mark as missed
    async markAsMissed() {
      this.status = 'missed';
      await this.save();
    }

    // Toggle mute status
    async toggleMute() {
      this.muted = !this.muted;
      await this.save();
      return this.muted;
    }

    // Set mute status
    async setMute(isMuted) {
      this.muted = isMuted;
      await this.save();
      return this.muted;
    }

    // Toggle video status
    async toggleVideo() {
      this.video_enabled = !this.video_enabled;
      await this.save();
      return this.video_enabled;
    }

    // Set video status
    async setVideo(isEnabled) {
      this.video_enabled = isEnabled;
      await this.save();
      return this.video_enabled;
    }

    // Get participation duration in seconds
    getParticipationDuration() {
      if (!this.joined_at) return 0;
      const endTime = this.left_at || new Date();
      return Math.floor((endTime - this.joined_at) / 1000);
    }

    // Update role (only if current user has permission)
    async updateRole(newRole) {
      if (['host', 'moderator', 'participant'].includes(newRole)) {
        this.role = newRole;
        await this.save();
      }
      return this.role;
    }
  }

  CallParticipant.init({
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    role: {
      type: DataTypes.ENUM('host', 'moderator', 'participant'),
      allowNull: false,
      defaultValue: 'participant'
    },
    muted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    video_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'joined_at'
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('invited', 'joined', 'declined', 'missed', 'left'),
      allowNull: false,
      defaultValue: 'invited'
    },
    connection_quality: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: true,
      comment: 'Network connection quality'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional participant metadata (device info, etc.)'
    }
  }, {
    sequelize,
    modelName: 'CallParticipant',
    tableName: 'call_participants',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['call_id'] },
      { fields: ['user_id'] },
      { 
        unique: true,
        fields: ['call_id', 'user_id'],
        name: 'unique_call_participant'
      },
      { fields: ['status'] },
      { fields: ['role'] },
      { fields: ['joined_at'] }
    ]
  });

  return CallParticipant;
};
