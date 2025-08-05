'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // A group has many members through group_members
      Group.hasMany(models.GroupMember, {
        foreignKey: 'group_id',
        as: 'members'
      });

      // A group belongs to a creator (user)
      Group.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // A group has one conversation
      Group.hasOne(models.Conversation, {
        foreignKey: 'group_id',
        as: 'conversation'
      });
    }

    // Instance method to get active members
    async getActiveMembers() {
      const GroupMember = sequelize.models.GroupMember;
      const User = sequelize.models.User;
      
      return await GroupMember.findAll({
        where: {
          group_id: this.id,
          left_at: null
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'avatar_url', 'is_online']
        }]
      });
    }

    // Check if user is admin
    async isUserAdmin(userId) {
      const GroupMember = sequelize.models.GroupMember;
      
      const member = await GroupMember.findOne({
        where: {
          group_id: this.id,
          user_id: userId,
          left_at: null
        }
      });

      return member && member.role === 'admin';
    }

    // Get group info with member count
    async getGroupInfo() {
      const activeMembers = await this.getActiveMembers();
      
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        avatar_url: this.avatar_url,
        created_by: this.created_by,
        member_count: activeMembers.length,
        created_at: this.created_at,
        updated_at: this.updated_at
      };
    }
  }

  Group.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    max_members: {
      type: DataTypes.INTEGER,
      defaultValue: 256,
      validate: {
        min: 2,
        max: 1000
      }
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    underscored: true,
    timestamps: true,
    paranoid: false // Disable paranoid mode since we use is_archived for soft deletes
  });

  return Group;
};
