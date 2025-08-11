const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    realName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'real_name'
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture'
    },
    careerProfilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'career_profile_picture',
      comment: 'Profile picture for career module'
    },

    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },

    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lga: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contact_number'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'email_verification_token'
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_expires'
    },
    passwordResetToken: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_online'
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('free', 'premium'),
      allowNull: false,
      defaultValue: 'free',
      field: 'subscription_status',
      comment: 'User subscription status: free or premium'
    },
    lastUpgradeReminder: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_upgrade_reminder',
      comment: 'Last time upgrade reminder was sent'
    },
    upgradeReminderCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'upgrade_reminder_count',
      comment: 'Number of upgrade reminders sent'
    }
  }, {
    tableName: 'users',
    paranoid: true,
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: { 
        exclude: ['passwordHash', 'passwordResetToken', 'emailVerificationToken'] 
      }
    },
    scopes: {
      withPassword: {
        attributes: {}
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.passwordHash;
    delete values.passwordResetToken;
    delete values.emailVerificationToken;
    delete values.deletedAt;
    return values;
  };

  // Helper method to check if profile is complete
  User.prototype.isProfileComplete = function() {
    const requiredFields = [
      'realName', 'username', 'dateOfBirth', 'gender', 
      'occupation', 'country', 'state', 'lga'
    ];
    
    return requiredFields.every(field => this[field] && this[field].toString().trim() !== '');
  };

  // Helper method to check if user has premium subscription
  User.prototype.isPremium = function() {
    return this.subscriptionStatus === 'premium';
  };



  // Helper method to update subscription status
  User.prototype.updateSubscriptionStatus = function(status) {
    this.subscriptionStatus = status;
    return this.save();
  };

  // Helper method to increment upgrade reminder count
  User.prototype.incrementUpgradeReminder = function() {
    this.upgradeReminderCount += 1;
    this.lastUpgradeReminder = new Date();
    return this.save();
  };

  // Set up associations
  User.associate = function(models) {
    // Basic associations
    
    User.hasOne(models.Subscription, { foreignKey: 'userId', as: 'subscription' });

    // Chat associations
    User.hasMany(models.Conversation, { foreignKey: 'participant1Id', as: 'conversations1' });
    User.hasMany(models.Conversation, { foreignKey: 'participant2Id', as: 'conversations2' });
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(models.MessageAttachment, { foreignKey: 'uploadedBy', as: 'uploadedAttachments' });

    // Call associations
    User.hasMany(models.Call, { foreignKey: 'callerId', as: 'initiatedCalls' });
    User.hasMany(models.Call, { foreignKey: 'receiverId', as: 'receivedCalls' });

    // Group associations
    User.hasMany(models.Group, { foreignKey: 'createdBy', as: 'createdGroups' });
    User.hasMany(models.GroupMember, { foreignKey: 'userId', as: 'groupMemberships' });
    User.hasMany(models.GroupMember, { foreignKey: 'addedBy', as: 'addedMembers' });
    User.hasMany(models.GroupCallParticipant, { foreignKey: 'userId', as: 'callParticipations' });

    // Professional Career Profile associations
    User.hasOne(models.ProfessionalCareerProfile, { foreignKey: 'userId', as: 'professionalCareerProfile' });

    // Job associations
    User.hasOne(models.JobHuntingSettings, { foreignKey: 'userId', as: 'jobHuntingSettings' });
    User.hasMany(models.JobSubscription, { foreignKey: 'userId', as: 'jobSubscriptions' });
    User.hasMany(models.JobPayment, { foreignKey: 'userId', as: 'jobPayments' });
    User.hasMany(models.JobActivityLog, { foreignKey: 'userId', as: 'jobActivityLogs' });
  };

  return User;
}; 