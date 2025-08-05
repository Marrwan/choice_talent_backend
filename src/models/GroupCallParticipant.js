'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupCallParticipant extends Model {
    static associate(models) {
      // A group call participant belongs to a call
      GroupCallParticipant.belongsTo(models.Call, {
        foreignKey: 'call_id',
        as: 'call'
      });

      // A group call participant belongs to a user
      GroupCallParticipant.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Instance methods
    isConnected() {
      return this.status === 'connected' && this.joined_at && !this.left_at;
    }

    isRinging() {
      return this.status === 'ringing';
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
      this.status = 'connected';
      this.joined_at = new Date();
      await this.save();
    }

    // Leave the call
    async leaveCall() {
      this.status = 'left';
      this.left_at = new Date();
      await this.save();
    }

    // Decline the call
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
      this.is_muted = !this.is_muted;
      await this.save();
    }

    // Toggle video status
    async toggleVideo() {
      this.is_video_enabled = !this.is_video_enabled;
      await this.save();
    }

    // Get call duration in seconds
    getCallDuration() {
      if (!this.joined_at) return 0;
      const endTime = this.left_at || new Date();
      return Math.floor((endTime - this.joined_at) / 1000);
    }
  }

  GroupCallParticipant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    call_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'calls',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ringing', 'connected', 'declined', 'missed', 'left'),
      defaultValue: 'ringing',
      allowNull: false
    },
    is_muted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_video_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'GroupCallParticipant',
    tableName: 'group_call_participants',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['call_id']
      },
      {
        fields: ['user_id']
      },
      {
        unique: true,
        fields: ['call_id', 'user_id'],
        name: 'unique_call_participant'
      },
      {
        fields: ['status']
      }
    ]
  });

  return GroupCallParticipant;
};
