const { Group, GroupMember, User, Conversation, Message } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new group
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Create the group
    const group = await Group.create({
      name: name.trim(),
      description: description?.trim(),
      created_by: userId,
      max_members: 256
    });

    // Add creator as admin
    await GroupMember.create({
      group_id: group.id,
      user_id: userId,
      role: 'admin',
      added_by: userId,
      joined_at: new Date()
    });

    // Add other members if provided
    if (members.length > 0) {
      const memberPromises = members.map(memberId => 
        GroupMember.create({
          group_id: group.id,
          user_id: memberId,
          role: 'member',
          added_by: userId,  
          joined_at: new Date()
        })
      );
      await Promise.all(memberPromises);
    }

    // Create group conversation
    const conversation = await Conversation.create({
      type: 'group',
      group_id: group.id,
      name: group.name,
      description: group.description
    });

    // Get group info with members
    const groupInfo = await getGroupWithMembers(group.id);

    res.status(201).json({
      success: true,
      data: {
        ...groupInfo,
        conversation_id: conversation.id
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's groups
 */
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.findAll({
      include: [
        {
          model: GroupMember,
          as: 'members',
          where: {
            user_id: userId,
            left_at: null
          },
          required: true,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'realName', 'profilePicture', 'is_online']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'realName', 'profilePicture']
        },
        {
          model: Conversation,
          as: 'conversation',
          attributes: ['id', 'last_message_at'],
          include: [
            {
              model: Message,
              as: 'lastMessage',
              attributes: ['id', 'content', 'message_type', 'created_at'],
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'username', 'realName']
                }
              ]
            }
          ]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    const groupsWithDetails = groups.map((group) => {
      const activeMembers = group.members || [];
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        avatar_url: group.avatar_url,
        created_by: group.created_by,
        member_count: activeMembers.length,
        members: activeMembers.map(member => member.user),
        creator: group.creator,
        conversation: group.conversation,
        created_at: group.created_at,
        updated_at: group.updated_at
      };
    });

    res.json({
      success: true,
      data: groupsWithDetails
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get group details
 */
const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const groupInfo = await getGroupWithMembers(groupId);
    
    res.json({
      success: true,
      data: groupInfo
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add members to group
 */
const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.user.id;

    // Check if user is admin or has permission to add members
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        left_at: null,
        [Op.or]: [
          { role: 'admin' },
          { can_add_members: true }
        ]
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members to this group'
      });
    }

    // Check group member limit
    const group = await Group.findByPk(groupId);
    const currentMemberCount = await GroupMember.count({
      where: {
        group_id: groupId,
        left_at: null
      }
    });

    if (currentMemberCount + members.length > group.max_members) {
      return res.status(400).json({
        success: false,
        message: `Group member limit (${group.max_members}) would be exceeded`
      });
    }

    // Add new members
    const memberPromises = members.map(async (memberId) => {
      // Check if user is already a member
      const existingMember = await GroupMember.findOne({
        where: {
          group_id: groupId,
          user_id: memberId,
          left_at: null
        }
      });

      if (!existingMember) {
        return GroupMember.create({
          group_id: groupId,
          user_id: memberId,
          role: 'member',
          added_by: userId,
          joined_at: new Date()
        });
      }
      return null;
    });

    const addedMembers = await Promise.all(memberPromises);
    const actuallyAdded = addedMembers.filter(member => member !== null);

    // Get updated group info
    const groupInfo = await getGroupWithMembers(groupId);

    res.json({
      success: true,
      message: `${actuallyAdded.length} members added successfully`,
      data: groupInfo
    });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Remove member from group
 */
const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user is admin or removing themselves
    const userMembership = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        left_at: null
      }
    });

    if (!userMembership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check permissions (admins can remove anyone, members can only remove themselves)
    if (userId !== memberId && userMembership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove this member'
      });
    }

    // Find member to remove
    const memberToRemove = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: memberId,
        left_at: null
      }
    });

    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this group'
      });
    }

    // Don't allow removing the group creator unless they're removing themselves
    const group = await Group.findByPk(groupId);
    if (group.created_by === memberId && userId !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    // Mark member as left
    memberToRemove.left_at = new Date();
    await memberToRemove.save();

    // Get updated group info
    const groupInfo = await getGroupWithMembers(groupId);

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: groupInfo
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Leave group
 */
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const membership = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if user is the creator
    const group = await Group.findByPk(groupId);
    if (group.created_by === userId) {
      // If creator is leaving, check if there are other admins
      const otherAdmins = await GroupMember.count({
        where: {
          group_id: groupId,
          user_id: { [Op.ne]: userId },
          role: 'admin',
          left_at: null
        }
      });

      if (otherAdmins === 0) {
        // Promote the oldest member to admin
        const oldestMember = await GroupMember.findOne({
          where: {
            group_id: groupId,
            user_id: { [Op.ne]: userId },
            left_at: null
          },
          order: [['joined_at', 'ASC']]
        });

        if (oldestMember) {
          oldestMember.role = 'admin';
          await oldestMember.save();
        }
      }
    }

    // Mark as left
    membership.left_at = new Date();
    await membership.save();

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update group details
 */
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar_url } = req.body;
    const userId = req.user.id;

    // Check if user is admin or has permission to edit group info
    const membership = await GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        left_at: null,
        [Op.or]: [
          { role: 'admin' },
          { can_edit_group_info: true }
        ]
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this group'
      });
    }

    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update group
    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.description = description?.trim();
    if (avatar_url !== undefined) group.avatar_url = avatar_url;

    await group.save();

    // Update associated conversation
    const conversation = await Conversation.findOne({
      where: { group_id: groupId }
    });
    if (conversation) {
      conversation.name = group.name;
      conversation.description = group.description;
      await conversation.save();
    }

    // Get updated group info
    const groupInfo = await getGroupWithMembers(groupId);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: groupInfo
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to get group with members
 */
async function getGroupWithMembers(groupId) {
  const group = await Group.findByPk(groupId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'realName', 'profilePicture']
      },
      {
        model: Conversation,
        as: 'conversation',
        attributes: ['id']
      }
    ]
  });

  const members = await GroupMember.findAll({
    where: {
      group_id: groupId,
      left_at: null
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'realName', 'profilePicture', 'is_online']
      },
      {
        model: User,
        as: 'addedBy',
        attributes: ['id', 'username', 'realName']
      }
    ],
    order: [['joined_at', 'ASC']]
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatar_url: group.avatar_url,
    created_by: group.created_by,
    max_members: group.max_members,
    member_count: members.length,
    creator: group.creator,
    conversation_id: group.conversation?.id,
    members: members.map(member => ({
      id: member.id,
      user: member.user,
      role: member.role,
      joined_at: member.joined_at,
      added_by: member.addedBy,
      can_add_members: member.can_add_members,
      can_edit_group_info: member.can_edit_group_info
    })),
    created_at: group.created_at,
    updated_at: group.updated_at
  };
}

module.exports = {
  createGroup,
  getUserGroups,
  getGroup,
  addMembers,
  removeMember,
  leaveGroup,
  updateGroup
};
