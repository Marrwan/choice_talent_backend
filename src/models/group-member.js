'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GroupMember extends Model {
    static associate(models) {
      // A group member belongs to a group
      GroupMember.belongsTo(models.Group, {
        foreignKey: 'group_id',
        as: 'group'
      });

      // A group member belongs to a user
      GroupMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // A group member was added by another user
      GroupMember.belongsTo(models.User, {
        foreignKey: 'added_by',
        as: 'addedByUser'
      });
    }

    // Check if member is active (hasn't left)
    isActive() {
      return this.left_at === null;
    }

    // Check if member is admin
    isAdmin() {
      return this.role === 'admin';
    }

    // Leave group
    async leaveGroup() {
      this.left_at = new Date();
      await this.save();
    }

    // Promote to admin
    async promoteToAdmin() {
      this.role = 'admin';
      await this.save();
    }

    // Demote to member
    async demoteToMember() {
      this.role = 'member';
      await this.save();
    }
  }

  GroupMember.init({
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
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
      allowNull: false
    },
    added_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    can_add_members: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    can_edit_group_info: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'GroupMember',
    tableName: 'group_members',
    underscored: true,
    timestamps: true,
    paranoid: false, // Disable paranoid mode since we use left_at for soft deletes
    indexes: [
      {
        unique: true,
        fields: ['group_id', 'user_id'],
        name: 'unique_group_user'
      },
      {
        fields: ['group_id', 'left_at'],
        name: 'active_members_index'
      }
    ]
  });

  return GroupMember;
};
