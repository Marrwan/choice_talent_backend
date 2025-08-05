const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class MessageAttachment extends Model {
    static associate(models) {
      // A message attachment belongs to a message
      MessageAttachment.belongsTo(models.Message, {
        foreignKey: 'message_id',
        as: 'message'
      });

      // A message attachment belongs to a user (uploader)
      MessageAttachment.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
      });
    }

    // Instance methods
    isImage() {
      return this.fileType && this.fileType.startsWith('image/');
    }

    isVideo() {
      return this.fileType && this.fileType.startsWith('video/');
    }

    isAudio() {
      return this.fileType && this.fileType.startsWith('audio/');
    }

    isDocument() {
      return this.fileType && (
        this.fileType.includes('pdf') ||
        this.fileType.includes('document') ||
        this.fileType.includes('text') ||
        this.fileType.includes('spreadsheet')
      );
    }

    getFormattedSize() {
      if (!this.size) return '0 B';
      
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      let i = 0;
      let size = this.size;
      
      while (size >= 1024 && i < sizes.length - 1) {
        size /= 1024;
        i++;
      }
      
      return `${Math.round(size * 100) / 100} ${sizes[i]}`;
    }

    getFileExtension() {
      if (!this.fileUrl) return '';
      return this.fileUrl.split('.').pop().toLowerCase();
    }

    // Validate file type and size
    static validateFile(fileType, size, maxSize = 50 * 1024 * 1024) { // 50MB default
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ];

      if (!allowedTypes.includes(fileType)) {
        throw new Error('File type not allowed');
      }

      if (size > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
      }

      return true;
    }
  }

  MessageAttachment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'message_id',
      references: {
        model: 'messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_url',
      comment: 'URL or path to the attached file'
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_type',
      comment: 'MIME type of the file (e.g., image/jpeg, application/pdf)'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Original filename when uploaded'
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to thumbnail for images/videos'
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    upload_status: {
      type: DataTypes.ENUM('uploading', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'completed'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional file metadata (dimensions, duration, etc.)'
    }
  }, {
    sequelize,
    modelName: 'MessageAttachment',
    tableName: 'message_attachments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['message_id'] },
      { fields: ['uploaded_by'] },
      { fields: ['file_type'] },
      { fields: ['size'] },
      { fields: ['upload_status'] }
    ]
  });

  return MessageAttachment;
};
