const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct'
    },
    participant1Id: {
      type: DataTypes.UUID,
      allowNull: true, // Made nullable for group chats
      field: 'participant1_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    participant2Id: {
      type: DataTypes.UUID,
      allowNull: true, // Made nullable for group chats
      field: 'participant2_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'group_id',
      references: {
        model: 'groups',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true // For group chats, direct chats don't need names
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_message_id',
      references: {
        model: 'messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['participant1_id', 'participant2_id'],
        where: {
          type: 'direct'
        }
      },
      {
        fields: ['participant1_id']
      },
      {
        fields: ['participant2_id']
      },
      {
        fields: ['group_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['last_message_at']
      }
    ]
  });

  // Define associations
  Conversation.associate = (models) => {
    // Direct conversation participants
    Conversation.belongsTo(models.User, {
      as: 'participant1',
      foreignKey: 'participant1_id'
    });
    
    Conversation.belongsTo(models.User, {
      as: 'participant2',
      foreignKey: 'participant2_id'
    });
    
    // Group conversation
    Conversation.belongsTo(models.Group, {
      as: 'group',
      foreignKey: 'group_id'
    });
    
    // Messages
    Conversation.hasMany(models.Message, {
      as: 'messages',
      foreignKey: 'conversationId'
    });
    
    Conversation.belongsTo(models.Message, {
      as: 'lastMessage',
      foreignKey: 'last_message_id'
    });

    // Calls
    Conversation.hasMany(models.Call, {
      as: 'calls',
      foreignKey: 'conversation_id'
    });
  };

  // Instance methods
  Conversation.prototype.getParticipants = async function() {
    if (this.type === 'direct') {
      const participant1 = await this.getParticipant1();
      const participant2 = await this.getParticipant2();
      return [participant1, participant2].filter(Boolean);
    } else if (this.type === 'group') {
      const group = await this.getGroup({ include: ['members'] });
      return group ? group.members : [];
    }
    return [];
  };

  Conversation.prototype.isParticipant = async function(userId) {
    if (this.type === 'direct') {
      return this.participant1Id === userId || this.participant2Id === userId;
    } else if (this.type === 'group') {
      const group = await this.getGroup();
      if (group) {
        return await group.isMember(userId);
      }
    }
    return false;
  };

  return Conversation;
};
