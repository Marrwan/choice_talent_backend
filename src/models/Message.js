const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'conversations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text content of the message'
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video'),
      defaultValue: 'text',
      field: 'message_type'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    },
    replyToMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reply_to_message_id',
      references: {
        model: 'messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    paranoid: false, // We handle soft deletes manually
    indexes: [
      {
        fields: ['conversation_id']
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['is_deleted']
      }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    Message.hasMany(models.MessageAttachment, {
      foreignKey: 'messageId',
      as: 'attachments'
    });
    // Self-referential association for replies
    Message.belongsTo(models.Message, {
      foreignKey: 'replyToMessageId',
      as: 'replyToMessage'
    });
    Message.hasMany(models.Message, {
      foreignKey: 'replyToMessageId',
      as: 'replies'
    });
  };

  return Message;
}; 